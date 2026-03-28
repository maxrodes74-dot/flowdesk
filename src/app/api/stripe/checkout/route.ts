import { NextResponse } from "next/server";

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

  const {
    invoiceId,
    amount,
    clientEmail,
    description,
    successUrl,
    cancelUrl,
    priceId,
    billingPeriod,
  } = body as Record<string, string>;

  // Either use priceId for subscription or amount for one-time payment
  if (!invoiceId || !successUrl || !cancelUrl) {
    return NextResponse.json(
      { error: "Missing required fields: invoiceId, successUrl, cancelUrl" },
      { status: 400 }
    );
  }

  // If priceId is provided, use it; otherwise fall back to amount
  if (!priceId && !amount) {
    return NextResponse.json(
      { error: "Either priceId or amount must be provided" },
      { status: 400 }
    );
  }

  try {
    // Build checkout session params based on whether this is a subscription or one-time payment
    const sessionParams: Record<string, string> = {
      "payment_method_types[0]": "card",
      success_url: successUrl,
      cancel_url: cancelUrl,
      ...(clientEmail ? { customer_email: clientEmail } : {}),
      "metadata[invoice_id]": invoiceId,
    };

    if (priceId) {
      // Subscription mode
      sessionParams.mode = "subscription";
      sessionParams["line_items[0][price]"] = priceId;
      sessionParams["line_items[0][quantity]"] = "1";
    } else {
      // Payment mode (one-time)
      sessionParams.mode = "payment";
      const amountCents = Math.round(parseFloat(amount) * 100);
      if (isNaN(amountCents) || amountCents <= 0) {
        return NextResponse.json(
          { error: "Amount must be a positive number" },
          { status: 400 }
        );
      }
      sessionParams["line_items[0][price_data][currency]"] = "usd";
      sessionParams["line_items[0][price_data][product_data][name]"] =
        description || `Invoice ${invoiceId}`;
      sessionParams["line_items[0][price_data][unit_amount]"] = String(amountCents);
      sessionParams["line_items[0][quantity]"] = "1";
    }

    // Create Stripe Checkout Session using the API directly
    const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${stripeSecretKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams(sessionParams),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error("Stripe checkout session error:", error);
      return NextResponse.json(
        { error: "Failed to create checkout session" },
        { status: 500 }
      );
    }

    const session = await response.json();
    return NextResponse.json({ url: session.url, sessionId: session.id });
  } catch (error) {
    console.error("Stripe checkout error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
