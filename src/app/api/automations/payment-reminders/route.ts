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

// GET endpoint: Called by Vercel cron scheduler (requires CRON_SECRET)
// Also supports testing with freelancerId query parameter
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const cronSecret = request.headers.get("authorization");
  const expectedSecret = `Bearer ${process.env.CRON_SECRET}`;

  // If CRON_SECRET is set, verify it
  if (process.env.CRON_SECRET && cronSecret !== expectedSecret) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const supabase = await createClient();

    // Get all freelancers with payment reminders automation enabled
    const { data: automationRows, error: automationError } = await supabase
      .from("automations")
      .select("freelancer_id")
      .eq("type", "payment_reminders")
      .eq("enabled", true);

    if (automationError || !automationRows) {
      return NextResponse.json(
        { error: "Failed to fetch automations" },
        { status: 500 }
      );
    }

    // Run automation for each freelancer
    const results = [];
    for (const automation of automationRows) {
      // Reuse POST logic by creating a synthetic request
      const response = await POST(
        new Request(request.url, {
          method: "POST",
          body: JSON.stringify({ freelancerId: automation.freelancer_id }),
        })
      );

      const data = await response.json();
      results.push({
        freelancerId: automation.freelancer_id,
        status: response.status,
        data,
      });
    }

    return NextResponse.json({
      success: true,
      automationsRun: results.length,
      results,
    });
  } catch (error) {
    console.error("Payment reminder cron execution error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
