// =============================================================
// MTR-287: Client portal API — view + approve/decline documents
// GET  /api/portal/[documentId]  — get sent document (no auth required)
// POST /api/portal/[documentId]  — approve or decline
// =============================================================

import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ documentId: string }> }
) {
  const { documentId } = await params;
  const supabase = createServiceClient();

  // Only return documents that have been sent (portal-safe statuses)
  const { data: doc, error } = await supabase
    .from("documents")
    .select(
      "id, type, title, content, metadata, status, version, file_url, file_type, created_at, updated_at, sent_at, approved_at, freelancer_id, client_id"
    )
    .eq("id", documentId)
    .in("status", ["sent", "approved", "completed", "paid", "declined"])
    .single();

  if (error || !doc) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  // Get freelancer info for branding
  const { data: freelancer } = await supabase
    .from("freelancers")
    .select("name, email, brand_color, logo_url, portfolio_url")
    .eq("id", doc.freelancer_id)
    .single();

  // Get client info
  let client = null;
  if (doc.client_id) {
    const { data: clientData } = await supabase
      .from("clients")
      .select("name, email, company")
      .eq("id", doc.client_id)
      .single();
    client = clientData;
  }

  return NextResponse.json({ document: doc, freelancer, client });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ documentId: string }> }
) {
  const { documentId } = await params;
  const supabase = createServiceClient();

  let body: { action: "approve" | "decline"; message?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!["approve", "decline"].includes(body.action)) {
    return NextResponse.json(
      { error: "Action must be 'approve' or 'decline'" },
      { status: 400 }
    );
  }

  // Verify document exists and is in "sent" status
  const { data: doc, error } = await supabase
    .from("documents")
    .select("id, status, freelancer_id, client_id")
    .eq("id", documentId)
    .eq("status", "sent")
    .single();

  if (error || !doc) {
    return NextResponse.json(
      { error: "Document not found or not in sent status" },
      { status: 404 }
    );
  }

  const newStatus = body.action === "approve" ? "approved" : "declined";
  const updateData: Record<string, unknown> = { status: newStatus };
  if (body.action === "approve") {
    updateData.approved_at = new Date().toISOString();
  }

  const { error: updateError } = await supabase
    .from("documents")
    .update(updateData)
    .eq("id", documentId);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  // If client left a message, store it
  if (body.message && doc.client_id) {
    await supabase.from("messages").insert({
      client_id: doc.client_id,
      sender: "client",
      body: `[${body.action.toUpperCase()}] ${body.message}`,
      type: "activity",
    });
  }

  return NextResponse.json({
    success: true,
    status: newStatus,
    message: `Document ${body.action}d successfully`,
  });
}
