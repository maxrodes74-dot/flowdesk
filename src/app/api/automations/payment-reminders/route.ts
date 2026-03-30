// ============================================================
// Payment Reminder Automation API Route
// ============================================================

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { rowToFreelancer, rowToInvoice, rowToClient } from "@/lib/supabase/data";
import {
  checkPaymentReminders,
  generateReminderText,
  calculateLateFee,
} from "@/lib/automations/payment-reminders";
import { sendPaymentReminderEmail } from "@/lib/email";
import type { PaymentReminderConfig } from "@/lib/types";

// This endpoint can be called by:
// 1. A cron job on an external service (pass freelancerId)
// 2. Manual trigger from dashboard
// 3. Supabase Edge Function

export async function POST(request: Request) {
  try {
    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400 }
      );
    }

    const { freelancerId } = body as Record<string, unknown>;

    if (!freelancerId || typeof freelancerId !== "string") {
      return NextResponse.json(
        { error: "freelancerId is required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Get freelancer
    const { data: freelancerRow, error: freelancerError } = await supabase
      .from("freelancers")
      .select("*")
      .eq("id", freelancerId)
      .single();

    if (freelancerError || !freelancerRow) {
      return NextResponse.json(
        { error: "Freelancer not found" },
        { status: 404 }
      );
    }

    const freelancer = rowToFreelancer(freelancerRow);

    // Get automation config
    const { data: automationRow } = await supabase
      .from("automations")
      .select("*")
      .eq("freelancer_id", freelancerId)
      .eq("type", "payment_reminders")
      .single();

    if (!automationRow || !automationRow.enabled) {
      return NextResponse.json(
        { message: "Payment reminders automation not enabled" },
        { status: 200 }
      );
    }

    const config = automationRow.config as unknown as PaymentReminderConfig;

    // Get all invoices for this freelancer
    const { data: invoiceRows, error: invoiceError } = await supabase
      .from("invoices")
      .select("*")
      .eq("freelancer_id", freelancerId);

    if (invoiceError || !invoiceRows) {
      return NextResponse.json(
        { error: "Failed to fetch invoices" },
        { status: 500 }
      );
    }

    // Get all clients for this freelancer
    const { data: clientRows, error: clientError } = await supabase
      .from("clients")
      .select("*")
      .eq("freelancer_id", freelancerId);

    if (clientError || !clientRows) {
      return NextResponse.json(
        { error: "Failed to fetch clients" },
        { status: 500 }
      );
    }

    const clientsMap = new Map(clientRows.map((row) => [row.id, rowToClient(row)]));
    const invoices = invoiceRows.map((row) =>
      rowToInvoice(row, clientsMap.get(row.client_id)?.name || "")
    );

    // Check for overdue invoices
    const overdueInvoices = checkPaymentReminders(invoices, clientsMap, config);

    // Send reminder emails
    const results = [];

    for (const item of overdueInvoices) {
      if (!item.shouldRemind) continue;

      const escalationDay =
        item.escalationStage === "day1"
          ? 1
          : item.escalationStage === "day7"
            ? 7
            : 14;

      const reminderText = generateReminderText(
        item.escalationStage,
        freelancer,
        item.client.name
      );

      const lateFee = calculateLateFee(item.invoice.total, config.lateFee);

      const emailSent = await sendPaymentReminderEmail(
        item.client.email,
        item.client.name,
        freelancer,
        {
          id: item.invoice.id,
          amount: item.invoice.total,
          dueDate: item.invoice.dueDate,
          escalationDay,
          lateFee: config.lateFee,
        }
      );

      if (emailSent) {
        // Log this reminder (optional: create an activity log)
        results.push({
          invoiceId: item.invoice.id,
          clientEmail: item.client.email,
          escalationStage: item.escalationStage,
          sent: true,
        });
      }
    }

    return NextResponse.json({
      success: true,
      remindersProcessed: results.length,
      details: results,
    });
  } catch (error) {
    console.error("Payment reminder automation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Optional: GET endpoint to test the automation
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const freelancerId = searchParams.get("freelancerId");

  if (!freelancerId) {
    return NextResponse.json(
      { error: "freelancerId query parameter required" },
      { status: 400 }
    );
  }

  // Call POST endpoint with test data
  return POST(
    new Request(request.url, {
      method: "POST",
      body: JSON.stringify({ freelancerId }),
    })
  );
}
