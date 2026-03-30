// =============================================================
// MTR-286: Subscription checkout — Pro ($12/mo | $97/yr) + Pro+ ($19/mo | $148/yr)
// POST /api/stripe/subscribe
// =============================================================

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const PRICE_MAP: Record<string, Record<string, string>> = {
  pro: {
    monthly: "price_1TG3DKEywgG0Hl8k0T66zD6G",
    annual: "price_1TG4dyEywgG0Hl8kaoMn8lYj",
  },
  "pro+": {
    monthly: "price_1TG3EdEywgG0Hl8kg9o5OYhE",
    annual: "price_1TG4glEywgG0Hl8kK8RkY7vv",
  },
};

export async function POST(request: Request) {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeSecretKey) {
    return NextResponse.json({ error: "Stripe is not configured" }, { status: 503 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Record<string, string>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { tier, interval } = body;
  if (!tier || !interval) {
    return NextResponse.json(
      { error: "Missing required fields: tier (pro | pro+), interval (monthly | annual)" },
      { status: 400 }
    );
  }

  const priceId = PRICE_MAP[tier]?.[interval];
  if (!priceId) {
    return NextResponse.json(
      { error: `Invalid tier/interval: ${tier}/${interval}` },
      { status: 400 }
    );
  }

  // Get or create Stripe customer
  const { data: freelancer } = await supabase
    .from("freelancers")
    .select("stripe_customer_id, email, name")
    .eq("id", user.id)
    .single();

  let customerId = freelancer?.stripe_customer_id;

  if (!customerId) {
    // Create Stripe customer
    const customerRes = await fetch("https://api.stripe.com/v1/customers", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${stripeSecretKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        email: freelancer?.email || user.email || "",
        name: freelancer?.name || "",
        "metadata[user_id]": user.id,
      }),
    });

    if (!customerRes.ok) {
      return NextResponse.json({ error: "Failed to create customer" }, { status: 500 });
    }

    const customer = await customerRes.json();
    customerId = customer.id;

    // Save customer ID
    await supabase
      .from("freelancers")
      .update({ stripe_customer_id: customerId })
      .eq("id", user.id);
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://scopepad.vercel.app";

  // Create Stripe Checkout Session for subscription
  const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${stripeSecretKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      customer: customerId!,
      "payment_method_types[0]": "card",
      mode: "subscription",
      "line_items[0][price]": priceId,
      "line_items[0][quantity]": "1",
      success_url: `${appUrl}/dashboard/settings?checkout=success`,
      cancel_url: `${appUrl}/dashboard/settings?checkout=cancelled`,
      "subscription_data[trial_period_days]": "14",
      "subscription_data[metadata][user_id]": user.id,
      "subscription_data[metadata][tier]": tier,
      allow_promotion_codes: "true",
    }),
  });

  if (!response.ok) {
    const err = await response.json();
    console.error("Stripe subscription checkout error:", err);
    return NextResponse.json({ error: "Failed to create checkout session" }, { status: 500 });
  }

  const session = await response.json();
  return NextResponse.json({ url: session.url, sessionId: session.id });
}
