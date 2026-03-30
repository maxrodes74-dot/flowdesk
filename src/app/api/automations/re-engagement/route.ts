// ============================================================
// Re-engagement Ping Automation API Route
// ============================================================

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { rowToFreelancer, rowToClient, rowToProposal } from "@/lib/supabase/data";
import {
  findInactiveClients,
  generateReEngagementMessage,
} from "@/lib/automations/re-engagement";
import { sendReEngagementEmail } from "@/lib/email";
import type { ReEngagementConfig } from "@/lib/types";

interface RequestBody {
  freelancerId: string;
}

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

    const { freelancerId } = body as unknown as RequestBody;

    if (!freelancerId || typeof freelancerId !== "string") {
      return NextResponse.json(
        { error: "freelancerId is required" },
        { status: 400 }
      );
    }

    const anthropicApiKey = process.env.ANTHROPIC_API_KEY;
    const supabase = await createClient();

    // Get freelancer
    const { data: freelancerRow } = await supabase
      .from("freelancers")
      .select("*")
      .eq("id", freelancerId)
      .single();

    if (!freelancerRow) {
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
      .eq("type", "re_engagement_ping")
      .single();

    if (!automationRow || !automationRow.enabled) {
      return NextResponse.json(
        { message: "Re-engagement automation not enabled" },
        { status: 200 }
      );
    }

    const config = automationRow.config as unknown as ReEngagementConfig;

    // Get all clients
    const { data: clientRows } = await supabase
      .from("clients")
      .select("*")
      .eq("freelancer_id", freelancerId);

    if (!clientRows) {
      return NextResponse.json(
        { error: "Failed to fetch clients" },
        { status: 500 }
      );
    }

    // Get all proposals
    const { data: proposalRows } = await supabase
      .from("proposals")
      .select("*")
      .eq("freelancer_id", freelancerId);

    if (!proposalRows) {
      return NextResponse.json(
        { error: "Failed to fetch proposals" },
        { status: 500 }
      );
    }

    // Find inactive clients
    const inactiveClients = findInactiveClients(
      clientRows.map((row) => rowToClient(row)),
      proposalRows.map((row) => rowToProposal(row, clientRows.find((c) => c.id === row.client_id)?.name || "")),
      config.inactivityThresholdDays
    );

    // Send re-engagement emails
    const results = [];

    for (const inactiveClient of inactiveClients) {
      // Generate personalized message
      const engagementMessage = await generateReEngagementMessage(
        inactiveClient.client.name,
        freelancer.profession,
        freelancer.tone,
        anthropicApiKey || ""
      );

      const emailSent = await sendReEngagementEmail(
        inactiveClient.client.email,
        inactiveClient.client.name,
        freelancer,
        {
          portalSlug: inactiveClient.client.portalSlug,
        }
      );

      if (emailSent) {
        results.push({
          clientId: inactiveClient.client.id,
          clientEmail: inactiveClient.client.email,
          daysInactive: inactiveClient.daysInactive,
          sent: true,
          message: engagementMessage,
        });
      }
    }

    return NextResponse.json({
      success: true,
      inactiveClientsFound: inactiveClients.length,
      emailsSent: results.length,
      details: results,
    });
  } catch (error) {
    console.error("Re-engagement automation error:", error);
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

    // Get all freelancers with re-engagement automation enabled
    const { data: automationRows, error: automationError } = await supabase
      .from("automations")
      .select("freelancer_id")
      .eq("type", "re_engagement_ping")
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
    console.error("Re-engagement cron execution error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
