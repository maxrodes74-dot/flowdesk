import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

// Verify Stripe webhook signature
function verifyStripeSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const elements = signature.split(",");
  const timestampStr = elements
    .find((e) => e.startsWith("t="))
    ?.replace("t=", "");
  const sig = elements
    .find((e) => e.startsWith("v1="))
    ?.replace("v1=", "");

  if (!timestampStr || !sig) return false;

  const signedPayload = `${timestampStr}.${payload}`;
  const expectedSig = crypto
    .createHmac("sha256", secret)
    .update(signedPayload, "utf8")
    .digest("hex");

  // Timing-safe comparison
  try {
    return crypto.timingSafeEqual(
      Buffer.from(sig, "hex"),
      Buffer.from(expectedSig, "hex")
    );
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!webhookSecret || !supabaseUrl || !supabaseServiceKey) {
    console.error("Missing Stripe webhook or Supabase configuration");
    return NextResponse.json(
      { error: "Webhook not configured" },
      { status: 503 }
    );
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json(
      { error: "Missing stripe-signature header" },
      { status: 400 }
    );
  }

  const body = await request.text();

  if (!verifyStripeSignature(body, signature, webhookSecret)) {
    console.error("Invalid Stripe webhook signature");
    return NextResponse.json(
      { error: "Invalid signature" },
      { status: 400 }
    );
  }

  let event: {
    type: string;
    data: {
      object: {
        id: string;
        payment_status?: string;
        metadata?: Record<string, string>;
      };
    };
  };

  try {
    event = JSON.parse(body);
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON" },
      { status: 400 }
    );
  }

  // Use service role client for admin-level database operations
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const invoiceId = session.metadata?.invoice_id;

        if (invoiceId && session.payment_status === "paid") {
          const { error } = await supabase
            .from("invoices")
            .update({
              status: "paid",
              paid_at: new Date().toISOString(),
              stripe_payment_id: session.id,
            })
            .eq("id", invoiceId);

          if (error) {
            console.error("Failed to update invoice:", error);
            return NextResponse.json(
              { error: "Failed to update invoice" },
              { status: 500 }
            );
          }

          console.log(`Invoice ${invoiceId} marked as paid via Stripe`);
        }
        break;
      }

      case "checkout.session.async_payment_succeeded": {
        const session = event.data.object;
        const invoiceId = session.metadata?.invoice_id;

        if (invoiceId) {
          await supabase
            .from("invoices")
            .update({
              status: "paid",
              paid_at: new Date().toISOString(),
              stripe_payment_id: session.id,
            })
            .eq("id", invoiceId);
        }
        break;
      }

      case "checkout.session.async_payment_failed": {
        const session = event.data.object;
        const invoiceId = session.metadata?.invoice_id;

        if (invoiceId) {
          console.error(`Payment failed for invoice ${invoiceId}`);
          // Invoice stays in its current status (sent/viewed)
        }
        break;
      }

      default:
        // Unhandled event type — acknowledge receipt
        break;
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook processing error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}
