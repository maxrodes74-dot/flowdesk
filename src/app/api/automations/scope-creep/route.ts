// ============================================================
// Scope Creep Detection Automation API Route
// ============================================================

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { rowToFreelancer, rowToProposal } from "@/lib/supabase/data";
import {
  analyzeScopeCreep,
  generateChangeOrderDraft,
} from "@/lib/automations/scope-creep";
import { sendScopeCreepAlertEmail } from "@/lib/email";
import type { ScopeCreepConfig } from "@/lib/types";

interface RequestBody {
  freelancerId: string;
  clientId: string;
  proposalId: string;
  clientMessage: string;
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

    const {
      freelancerId,
      clientId,
      proposalId,
      clientMessage,
    } = body as RequestBody;

    if (!freelancerId || !clientId || !proposalId || !clientMessage) {
      return NextResponse.json(
        {
          error:
            "freelancerId, clientId, proposalId, and clientMessage are required",
        },
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
      .eq("type", "scope_creep_detection")
      .single();

    if (!automationRow || !automationRow.enabled) {
      return NextResponse.json(
        { message: "Scope creep detection not enabled" },
        { status: 200 }
      );
    }

    const config = automationRow.config as ScopeCreepConfig;

    // Get proposal
    const { data: proposalRow } = await supabase
      .from("proposals")
      .select("*")
      .eq("id", proposalId)
      .single();

    if (!proposalRow) {
      return NextResponse.json(
        { error: "Proposal not found" },
        { status: 404 }
      );
    }

    // Get client
    const { data: clientRow } = await supabase
      .from("clients")
      .select("*")
      .eq("id", clientId)
      .single();

    if (!clientRow) {
      return NextResponse.json(
        { error: "Client not found" },
        { status: 404 }
      );
    }

    const proposal = rowToProposal(proposalRow, clientRow.name);

    // Analyze scope creep
    let analysis;
    if (anthropicApiKey) {
      analysis = await analyzeScopeCreep(
        clientMessage,
        proposal,
        config,
        anthropicApiKey
      );
    } else {
      // Fallback without API
      return NextResponse.json(
        {
          error: "ANTHROPIC_API_KEY not configured",
        },
        { status: 500 }
      );
    }

    // If scope creep detected, notify freelancer and optionally generate change order
    if (analysis.isScopeCreep && analysis.confidence > 0.5) {
      // Send alert email to freelancer
      const emailSent = await sendScopeCreepAlertEmail(
        freelancer.email,
        freelancer,
        {
          clientName: clientRow.name,
          clientId: clientId,
          clientMessage,
          analysis: analysis.explanation,
          suggestedResponse: analysis.suggestedResponse,
        }
      );

      // Optionally generate change order draft
      let changeOrder = undefined;
      if (config.autoDraftChangeOrder) {
        changeOrder = generateChangeOrderDraft(
          clientMessage,
          freelancer.hourlyRate
        );
      }

      return NextResponse.json({
        success: true,
        scopeCreepDetected: true,
        analysis,
        changeOrder,
        emailSent,
      });
    }

    return NextResponse.json({
      success: true,
      scopeCreepDetected: false,
      analysis,
    });
  } catch (error) {
    console.error("Scope creep detection error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET endpoint to analyze a message without recording
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const freelancerId = searchParams.get("freelancerId");
  const clientId = searchParams.get("clientId");
  const proposalId = searchParams.get("proposalId");
  const clientMessage = searchParams.get("clientMessage");

  if (!freelancerId || !clientId || !proposalId || !clientMessage) {
    return NextResponse.json(
      {
        error:
          "freelancerId, clientId, proposalId, and clientMessage query parameters required",
      },
      { status: 400 }
    );
  }

  // Call POST endpoint
  return POST(
    new Request(request.url, {
      method: "POST",
      body: JSON.stringify({
        freelancerId,
        clientId,
        proposalId,
        clientMessage,
      }),
    })
  );
}
