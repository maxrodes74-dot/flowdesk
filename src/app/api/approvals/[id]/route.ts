// =============================================================
// MTR-294: Agent Guardrails - Approval Resolution Endpoint
// POST /api/approvals/[id]  — approve or reject (session auth)
// =============================================================

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const supabaseService = createServiceClient();

  // Verify session (authenticated user)
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Verify user is a freelancer
  const { data: freelancer, error: freelancerError } = await supabase
    .from("freelancers")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (freelancerError || !freelancer) {
    return NextResponse.json(
      { error: "Freelancer profile not found" },
      { status: 404 }
    );
  }

  let body: { action: "approve" | "reject" };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!["approve", "reject"].includes(body.action)) {
    return NextResponse.json(
      { error: "Action must be 'approve' or 'reject'" },
      { status: 400 }
    );
  }

  // Fetch pending approval
  const { data: approval, error: fetchError } = await supabaseService
    .from("pending_approvals")
    .select("*")
    .eq("id", id)
    .eq("freelancer_id", freelancer.id)
    .eq("status", "pending")
    .single();

  if (fetchError || !approval) {
    return NextResponse.json(
      { error: "Approval not found or not pending" },
      { status: 404 }
    );
  }

  const newStatus = body.action === "approve" ? "approved" : "rejected";
  const now = new Date().toISOString();

  // Update approval status
  const { error: updateError } = await supabaseService
    .from("pending_approvals")
    .update({
      status: newStatus,
      resolved_at: now,
    })
    .eq("id", id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  // If approved, execute the action payload
  if (body.action === "approve") {
    // The action_payload contains the details to execute
    // For now, we log the approval. The actual execution would be
    // handled by the calling API based on action_category.
    // This could involve creating documents, sending emails, etc.
    console.log("Approval resolved:", {
      approval_id: id,
      action: "approved",
      payload: approval.action_payload,
    });
  }

  // Log the audit event
  await supabaseService.from("audit_logs").insert({
    freelancer_id: freelancer.id,
    api_key_id: approval.api_key_id,
    action_category: approval.action_category,
    action: `Approval ${newStatus} by freelancer`,
    resource_type: "approval",
    resource_id: id,
    result: newStatus === "approved" ? "approved" : "rejected",
    created_at: now,
  });

  return NextResponse.json({
    success: true,
    approval_id: id,
    status: newStatus,
    message: `Approval ${newStatus} successfully`,
  });
}
