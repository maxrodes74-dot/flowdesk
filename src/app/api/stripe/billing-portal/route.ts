import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST() {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeSecretKey) {
    return NextResponse.json(
      { error: "Stripe is not configured" },
      { status: 503 }
    );
  }

  try {
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

    const stripeCustomerId = (freelancerRow as Record<string, unknown>)
      .stripe_customer_id as string | undefined;

    if (!stripeCustomerId) {
      return NextResponse.json(
        { error: "No subscription found. Please subscribe first." },
        { status: 404 }
      );
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    // Create billing portal session via Stripe API
    const portalRes = await fetch(
      "https://api.stripe.com/v1/billing_portal/sessions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${stripeSecretKey}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          customer: stripeCustomerId,
          return_url: `${appUrl}/dashboard/settings`,
        }),
      }
    );

    if (!portalRes.ok) {
      const error = await portalRes.json();
      console.error("Stripe billing portal error:", error);
      return NextResponse.json(
        { error: "Failed to create billing portal session" },
        { status: 500 }
      );
    }

    const session = await portalRes.json();
    return NextResponse.json({
      success: true,
      portalUrl: session.url,
    });
  } catch (error) {
    console.error("Billing portal error:", error);
    return NextResponse.json(
      { error: "Failed to create billing portal session" },
      { status: 500 }
    );
  }
}
