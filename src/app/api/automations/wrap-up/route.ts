// ============================================================
// Project Wrap-Up Automation API Route
// ============================================================

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { rowToFreelancer, rowToProposal, rowToClient } from "@/lib/supabase/data";
import {
  checkProjectCompletion,
  generateWrapUpSequence,
  generateWrapUpMessages,
} from "@/lib/automations/wrap-up";
import { sendWrapUpEmail } from "@/lib/email";
import type { ProjectWrapUpConfig } from "@/lib/types";

interface RequestBody {
  freelancerId: string;
  proposalId: string;
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

    const { freelancerId, proposalId } = body as unknown as RequestBody;

    if (!freelancerId || !proposalId) {
      return NextResponse.json(
        { error: "freelancerId and proposalId are required" },
        { status: 400 }
      );
    }

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
      .eq("type", "project_wrap_up")
      .single();

    if (!automationRow || !automationRow.enabled) {
      return NextResponse.json(
        { message: "Project wrap-up automation not enabled" },
        { status: 200 }
      );
    }

    const config = automationRow.config as unknown as ProjectWrapUpConfig;

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
      .eq("id", proposalRow.client_id)
      .single();

    if (!clientRow) {
      return NextResponse.json(
        { error: "Client not found" },
        { status: 404 }
      );
    }

    const proposal = rowToProposal(proposalRow, clientRow.name);
    const client = rowToClient(clientRow);

    // Get milestones
    const { data: milestoneRows } = await supabase
      .from("milestones")
      .select("*")
      .eq("proposal_id", proposalId);

    const milestones = (milestoneRows || []).map((m: Record<string, unknown>) => ({
      id: m.id as string,
      proposalId: m.proposal_id as string,
      title: m.title as string,
      description: m.description as string,
      dueDate: m.due_date as string,
      status: m.status as "pending" | "in_progress" | "completed",
      sortOrder: m.sort_order as number,
      invoiceId: m.invoice_id as string | null,
      createdAt: m.created_at as string,
    }));

    // Check if project is complete
    const isComplete = checkProjectCompletion(proposal, milestones);

    if (!isComplete) {
      return NextResponse.json(
        {
          message:
            "Project not complete - not all milestones are marked as completed",
        },
        { status: 200 }
      );
    }

    // Generate wrap-up sequence
    const sequence = generateWrapUpSequence(proposal, client.name, {
      delayDays: config.delayDays,
      includeTestimonialRequest: config.includeTestimonialRequest,
      includeReferralAsk: config.includeReferralAsk,
    });

    // Send thank you email immediately
    const messages = generateWrapUpMessages(proposal.title, client.name, freelancer.tone);

    const emailSent = await sendWrapUpEmail(
      client.email,
      client.name,
      freelancer,
      {
        projectTitle: proposal.title,
        includeTestimonial: config.includeTestimonialRequest,
        includeReferral: config.includeReferralAsk,
        clientId: client.id,
      }
    );

    // Optionally create a log entry for the wrap-up sequence
    if (emailSent) {
      // Could store wrap-up progress here for future reference
    }

    return NextResponse.json({
      success: true,
      projectComplete: true,
      wrapUpInitiated: emailSent,
      sequence,
      messages,
    });
  } catch (error) {
    console.error("Project wrap-up automation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET endpoint: Called by Vercel cron scheduler (requires CRON_SECRET)
// Also supports testing with freelancerId and proposalId query parameters
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

    // Get all freelancers with wrap-up automation enabled
    const { data: automationRows, error: automationError } = await supabase
      .from("automations")
      .select("freelancer_id")
      .eq("type", "project_wrap_up")
      .eq("enabled", true);

    if (automationError || !automationRows) {
      return NextResponse.json(
        { error: "Failed to fetch automations" },
        { status: 500 }
      );
    }

    // For each freelancer with wrap-up enabled, find completed proposals
    const results = [];
    for (const automation of automationRows) {
      const freelancerId = automation.freelancer_id;

      // Get completed proposals for this freelancer
      const { data: proposalRows } = await supabase
        .from("proposals")
        .select("*")
        .eq("freelancer_id", freelancerId)
        .eq("status", "approved");

      if (!proposalRows) continue;

      // Check each proposal for completion and run wrap-up
      for (const proposal of proposalRows) {
        const response = await POST(
          new Request(request.url, {
            method: "POST",
            body: JSON.stringify({
              freelancerId,
              proposalId: proposal.id,
            }),
          })
        );

        const data = await response.json();
        results.push({
          freelancerId,
          proposalId: proposal.id,
          status: response.status,
          data,
        });
      }
    }

    return NextResponse.json({
      success: true,
      automationsRun: results.length,
      results,
    });
  } catch (error) {
    console.error("Wrap-up cron execution error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
