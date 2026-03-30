// =============================================================
// MTR-295: Client Portal v2 - Change Request Endpoint
// POST /api/portal/[documentId]/change-request  — submit change request (no auth)
// =============================================================

import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import type { CreateChangeRequestInput } from "@/lib/portal/types";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ documentId: string }> }
) {
  const { documentId } = await params;
  const supabase = createServiceClient();

  // Verify document exists and is viewable
  const { data: doc, error: docError } = await supabase
    .from("documents")
    .select("id, status, freelancer_id, client_id, type, title, template_id, lineage_chain")
    .eq("id", documentId)
    .in("status", ["sent", "approved", "completed", "paid", "declined"])
    .single();

  if (docError || !doc) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  let body: CreateChangeRequestInput;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Validate input
  if (!body.description || !body.sections_affected || !body.client_name) {
    return NextResponse.json(
      {
        error:
          "Missing required fields: description, sections_affected, client_name",
      },
      { status: 400 }
    );
  }

  if (!Array.isArray(body.sections_affected) || body.sections_affected.length === 0) {
    return NextResponse.json(
      { error: "sections_affected must be a non-empty array" },
      { status: 400 }
    );
  }

  // Create change request
  const { data: changeRequest, error: changeError } = await supabase
    .from("change_requests")
    .insert({
      document_id: documentId,
      client_name: body.client_name,
      description: body.description,
      sections_affected: body.sections_affected,
      status: "pending",
      change_order_id: null,
      created_at: new Date().toISOString(),
      resolved_at: null,
    })
    .select()
    .single();

  if (changeError || !changeRequest) {
    return NextResponse.json(
      { error: changeError?.message || "Failed to create change request" },
      { status: 500 }
    );
  }

  // Auto-create change_order draft document linked to original
  const changeOrderTitle = `Change Order: ${doc.title}`;
  const changeOrderContent = {
    summary: body.description,
    changes: body.sections_affected.map((section) => ({
      description: `Modifications to ${section}`,
      type: "modification",
    })),
    reason: body.description,
    impact_analysis: "",
  };

  const { data: changeOrder, error: coError } = await supabase
    .from("documents")
    .insert({
      freelancer_id: doc.freelancer_id,
      client_id: doc.client_id,
      type: "change_order",
      template_id: null,
      parent_id: documentId,
      lineage_chain: [...((doc.lineage_chain as string[]) || []), documentId],
      title: changeOrderTitle,
      content: changeOrderContent,
      metadata: {
        original_document_id: documentId,
        changes: body.sections_affected,
        reason: body.description,
      },
      status: "draft",
      version: 1,
      file_url: null,
      file_type: null,
      ai_generated: false,
      agent_key_id: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      sent_at: null,
      approved_at: null,
    })
    .select()
    .single();

  if (coError || !changeOrder) {
    console.error("Failed to create change order:", coError);
    // Don't fail the whole request if change order creation fails
  }

  // Link change order to change request
  if (changeOrder) {
    await supabase
      .from("change_requests")
      .update({ change_order_id: changeOrder.id })
      .eq("id", changeRequest.id);
  }

  return NextResponse.json(
    {
      change_request: changeRequest,
      change_order: changeOrder || null,
    },
    { status: 201 }
  );
}
