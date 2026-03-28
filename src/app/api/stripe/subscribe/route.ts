import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeSecretKey) {
    return NextResponse.json(
      { error: "Stripe is not configured" },
      { status: 503 }
    );
  }

  try {
    const body = await request.json();
    const { tier, billingPeriod } = body as {
      tier: "pro" | "pro_plus";
      billingPeriod?: "monthly" | "annual";
    };

    if (!tier || !["pro", "pro_plus"].includes(tier)) {
      return NextResponse.json(
        { error: "Invalid tier. Must be 'pro' or 'pro_plus'" },
        { status: 400 }
      );
    }

    const billing = billingPeriod || "monthly";

    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const { data: freelancerRow } = await supabase
      .from("freelancers")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (!freelancerRow) {
      return NextResponse.json(
        { error: "Freelancer profile not found" },
        { status: 404 }
      );
    }

    // Get or create Stripe customer
    let customerId: string;
    const stripeCustomerId = (freelancerRow as Record<string, unknown>)
      .stripe_customer_id as string | undefined;

    if (stripeCustomerId) {
      customerId = stripeCustomerId;
    } else {
      // Create new Stripe customer via API
      const customerRes = await fetch("https://api.stripe.com/v1/customers", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${stripeSecretKey}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          email: user.email || "",
          name: freelancerRow.name || "",
          "metadata[freelancer_id]": freelancerRow.id,
        }),
      });

      if (!customerRes.ok) {
        console.error("Failed to create Stripe customer");
        return NextResponse.json(
          { error: "Failed to create payment profile" },
          { status: 500 }
        );
      }

      const customer = await customerRes.json();
      customerId = customer.id;

      // Try to save customer ID back to freelancer record
      try {
        await supabase
          .from("freelancers")
          .update({ stripe_customer_id: customerId } as Record<string, unknown>)
          .eq("id", freelancerRow.id);
      } catch (e) {
        console.warn("stripe_customer_id column may not exist yet:", e);
      }
    }

    // Determine price ID based on tier and billing period
    let priceId: string | undefined;

    if (tier === "pro") {
      priceId =
        billing === "annual"
          ? process.env.STRIPE_PRO_ANNUAL_PRICE_ID
          : process.env.STRIPE_PRO_PRICE_ID;
    } else {
      priceId =
        billing === "annual"
          ? process.env.STRIPE_PRO_PLUS_ANNUAL_PRICE_ID
          : process.env.STRIPE_PRO_PLUS_PRICE_ID;
    }

    if (!priceId) {
      return NextResponse.json(
        {
          error: `Price ID not configured for tier: ${tier} (${billing})`,
        },
        { status: 500 }
      );
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    // Create checkout session for subscription
    const sessionRes = await fetch(
      "https://api.stripe.com/v1/checkout/sessions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${stripeSecretKey}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          customer: customerId,
          mode: "subscription",
          "payment_method_types[0]": "card",
          "line_items[0][price]": priceId,
          "line_items[0][quantity]": "1",
          success_url: `${appUrl}/dashboard/settings?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${appUrl}/dashboard/settings`,
          "metadata[freelancer_id]": freelancerRow.id,
          "metadata[tier]": tier,
          "metadata[billing_period]": billing,
        }),
      }
    );

    if (!sessionRes.ok) {
      const error = await sessionRes.json();
      console.error("Stripe subscription session error:", error);
      return NextResponse.json(
        { error: "Failed to create checkout session" },
        { status: 500 }
      );
    }

    const session = await sessionRes.json();
    return NextResponse.json({
      success: true,
      checkoutUrl: session.url,
    });
  } catch (error) {
    console.error("Subscription checkout error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
