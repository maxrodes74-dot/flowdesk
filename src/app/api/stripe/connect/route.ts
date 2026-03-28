import { NextResponse } from "next/server";

/**
 * POST /api/stripe/connect
 * Creates a Stripe Connect account link for freelancers to connect their Stripe account
 * Returns a URL to redirect the user to for account linking
 */
export async function POST(request: Request) {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeSecretKey) {
    return NextResponse.json(
      { error: "Stripe is not configured" },
      { status: 503 }
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON in request body" },
      { status: 400 }
    );
  }

  const { freelancerId, redirectUrl } = body as Record<string, string>;

  if (!freelancerId || !redirectUrl) {
    return NextResponse.json(
      { error: "Missing required fields: freelancerId, redirectUrl" },
      { status: 400 }
    );
  }

  try {
    // Create a Stripe Connect account if one doesn't exist
    // First, check if we need to create an account
    const accountResponse = await fetch("https://api.stripe.com/v1/accounts", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${stripeSecretKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        type: "express",
        country: "US",
        email: "", // Email should be passed from freelancer data
        business_type: "individual",
      }),
    });

    if (!accountResponse.ok) {
      const error = await accountResponse.json();
      console.error("Stripe account creation error:", error);
      return NextResponse.json(
        { error: "Failed to create Stripe account" },
        { status: 500 }
      );
    }

    const account = await accountResponse.json();
    const stripeAccountId = account.id;

    // Create an account link for onboarding
    const linkResponse = await fetch(
      "https://api.stripe.com/v1/account_links",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${stripeSecretKey}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          account: stripeAccountId,
          type: "account_onboarding",
          refresh_url: `${redirectUrl}?refresh=true`,
          return_url: redirectUrl,
        }),
      }
    );

    if (!linkResponse.ok) {
      const error = await linkResponse.json();
      console.error("Stripe account link error:", error);
      return NextResponse.json(
        { error: "Failed to create account link" },
        { status: 500 }
      );
    }

    const link = await linkResponse.json();

    return NextResponse.json({
      url: link.url,
      stripeAccountId,
    });
  } catch (error) {
    console.error("Stripe Connect error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/stripe/connect?account_id={stripeAccountId}
 * Checks the status of a Stripe Connect account onboarding
 */
export async function GET(request: Request) {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeSecretKey) {
    return NextResponse.json(
      { error: "Stripe is not configured" },
      { status: 503 }
    );
  }

  const { searchParams } = new URL(request.url);
  const accountId = searchParams.get("account_id");

  if (!accountId) {
    return NextResponse.json(
      { error: "Missing required parameter: account_id" },
      { status: 400 }
    );
  }

  try {
    const response = await fetch(`https://api.stripe.com/v1/accounts/${accountId}`, {
      headers: {
        Authorization: `Bearer ${stripeSecretKey}`,
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to retrieve account" },
        { status: 500 }
      );
    }

    const account = await response.json();

    // Check onboarding completion status
    const isOnboardingComplete =
      account.charges_enabled && account.payouts_enabled;

    return NextResponse.json({
      stripeAccountId: account.id,
      isOnboardingComplete,
      chargesEnabled: account.charges_enabled,
      payoutsEnabled: account.payouts_enabled,
      country: account.country,
    });
  } catch (error) {
    console.error("Error checking Stripe account status:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
