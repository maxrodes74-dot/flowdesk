// ============================================================
// Re-engagement Ping Automation API Route
// ============================================================

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { rowToFreelancer, rowToClient } from "@/lib/supabase/data";
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

    const { freelancerId } = body as RequestBody;

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

    const config = automationRow.config as ReEngagementConfig;

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
      proposalRows.map((row, idx) => ({
        id: row.id,
        freelancerId: row.freelancer_id,
        clientId: row.client_id,
        clientName: clientRows.find((c) => c.id === row.client_id)?.name || "",
        title: row.title,
        brief: row.brief,
        scope: row.scope_json || [],
        timeline: row.timeline,
        budget: row.budget,
        totalPrice: row.total_price,
        terms: row.terms,
        status: row.status,
        aiGenerated: row.ai_generated,
        createdAt: row.created_at,
      })),
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

// GET endpoint to test the automation
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const freelancerId = searchParams.get("freelancerId");

  if (!freelancerId) {
    return NextResponse.json(
      { error: "freelancerId query parameter required" },
      { status: 400 }
    );
  }

  // Call POST endpoint
  return POST(
    new Request(request.url, {
      method: "POST",
      body: JSON.stringify({ freelancerId }),
    })
  );
}
