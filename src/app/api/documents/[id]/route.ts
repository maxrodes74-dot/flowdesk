// =============================================================
// MTR-282: Document CRUD — Get, Update, Delete
// GET    /api/documents/[id]  — get with content, metadata, lineage
// PUT    /api/documents/[id]  — update content/metadata, auto-version
// DELETE /api/documents/[id]  — soft-delete (archive)
// =============================================================

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { validateDocumentContent } from "@/lib/documents/schemas";
import type { UpdateDocumentInput } from "@/lib/documents/types";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get document
  const { data: document, error } = await supabase
    .from("documents")
    .select("*")
    .eq("id", id)
    .eq("freelancer_id", user.id)
    .single();

  if (error || !document) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  // Get version history
  const { data: versions } = await supabase
    .from("document_versions")
    .select("id, version, created_by, created_at")
    .eq("document_id", id)
    .order("version", { ascending: false });

  // Get lineage (parent + children)
  const { data: children } = await supabase
    .from("documents")
    .select("id, type, title, status, created_at")
    .eq("parent_id", id)
    .order("created_at", { ascending: true });

  let parent = null;
  if (document.parent_id) {
    const { data: parentDoc } = await supabase
      .from("documents")
      .select("id, type, title, status")
      .eq("id", document.parent_id)
      .single();
    parent = parentDoc;
  }

  return NextResponse.json({
    document,
    versions: versions || [],
    lineage: { parent, children: children || [] },
  });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: UpdateDocumentInput;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // Get current document for version tracking
  const { data: current, error: fetchError } = await supabase
    .from("documents")
    .select("*")
    .eq("id", id)
    .eq("freelancer_id", user.id)
    .single();

  if (fetchError || !current) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  // Validate content if being updated
  if (body.content) {
    const contentResult = validateDocumentContent(current.type as any, body.content);
    if (!contentResult.success) {
      return NextResponse.json(
        { error: "Invalid content", details: contentResult.error.issues },
        { status: 400 }
      );
    }
  }

  // Determine if this is a content change (requires new version)
  const isContentChange = body.content && JSON.stringify(body.content) !== JSON.stringify(current.content);
  const newVersion = isContentChange ? current.version + 1 : current.version;

  // Build update object
  const updateData: Record<string, unknown> = {};
  if (body.client_id !== undefined) updateData.client_id = body.client_id;
  if (body.title !== undefined) updateData.title = body.title;
  if (body.content !== undefined) updateData.content = body.content;
  if (body.metadata !== undefined) updateData.metadata = body.metadata;
  if (body.status !== undefined) {
    updateData.status = body.status;
    if (body.status === "sent" && !current.sent_at) updateData.sent_at = new Date().toISOString();
    if (body.status === "approved" && !current.approved_at) updateData.approved_at = new Date().toISOString();
  }
  if (body.file_url !== undefined) updateData.file_url = body.file_url;
  if (body.file_type !== undefined) updateData.file_type = body.file_type;
  if (isContentChange) updateData.version = newVersion;

  const { data, error } = await supabase
    .from("documents")
    .update(updateData)
    .eq("id", id)
    .eq("freelancer_id", user.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Create version record if content changed
  if (isContentChange) {
    await (supabase.from("document_versions") as any).insert({
      documentId: id,
      version: newVersion,
      content: body.content,
      metadata: body.metadata || current.metadata,
      createdBy: "user",
    });
  }

  return NextResponse.json({ document: data });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Soft delete — archive the document
  const { error } = await supabase
    .from("documents")
    .update({ status: "archived" })
    .eq("id", id)
    .eq("freelancer_id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
