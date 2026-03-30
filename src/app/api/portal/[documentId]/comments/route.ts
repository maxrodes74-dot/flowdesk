// =============================================================
// MTR-295: Client Portal v2 - Comments Endpoint
// GET  /api/portal/[documentId]/comments  — list comments (no auth)
// POST /api/portal/[documentId]/comments  — add comment (no auth)
// =============================================================

import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import type { CreateCommentInput } from "@/lib/portal/types";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ documentId: string }> }
) {
  const { documentId } = await params;
  const supabase = createServiceClient();

  // Verify document exists and is viewable
  const { data: doc, error: docError } = await supabase
    .from("documents")
    .select("id, status")
    .eq("id", documentId)
    .in("status", ["sent", "approved", "completed", "paid", "declined"])
    .single();

  if (docError || !doc) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  // Fetch comments
  const { data: comments, error } = await supabase
    .from("document_comments")
    .select("*")
    .eq("document_id", documentId)
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ comments: comments || [] });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ documentId: string }> }
) {
  const { documentId } = await params;
  const supabase = createServiceClient();

  // Verify document exists and is viewable
  const { data: doc, error: docError } = await supabase
    .from("documents")
    .select("id, status")
    .eq("id", documentId)
    .in("status", ["sent", "approved", "completed", "paid", "declined"])
    .single();

  if (docError || !doc) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  let body: CreateCommentInput;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Validate input
  if (!body.body || !body.author_name || !body.author_type) {
    return NextResponse.json(
      { error: "Missing required fields: body, author_name, author_type" },
      { status: 400 }
    );
  }

  if (!["client", "freelancer"].includes(body.author_type)) {
    return NextResponse.json(
      { error: "author_type must be 'client' or 'freelancer'" },
      { status: 400 }
    );
  }

  // Create comment
  const { data: comment, error: createError } = await supabase
    .from("document_comments")
    .insert({
      document_id: documentId,
      section_key: body.section_key || null,
      author_type: body.author_type,
      author_name: body.author_name,
      body: body.body,
      parent_comment_id: null,
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (createError || !comment) {
    return NextResponse.json({ error: createError?.message || "Failed to create comment" }, { status: 500 });
  }

  return NextResponse.json({ comment }, { status: 201 });
}
