// =============================================================
// MTR-282: Document CRUD — List & Create
// GET  /api/documents  — list with filters
// POST /api/documents  — create document
// =============================================================

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  DocumentType,
  DocumentStatus,
  validateDocumentContent,
} from "@/lib/documents/schemas";
import type { CreateDocumentInput } from "@/lib/documents/types";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = request.nextUrl;
  const type = url.searchParams.get("type");
  const status = url.searchParams.get("status");
  const clientId = url.searchParams.get("client_id");
  const limit = parseInt(url.searchParams.get("limit") || "50", 10);
  const offset = parseInt(url.searchParams.get("offset") || "0", 10);

  let query = supabase
    .from("documents")
    .select("*", { count: "exact" })
    .eq("freelancer_id", user.id)
    .order("updated_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (type) query = query.eq("type", type);
  if (status) query = query.eq("status", status);
  if (clientId) query = query.eq("client_id", clientId);

  const { data, error, count } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ documents: data, total: count });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: CreateDocumentInput;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // Validate document type
  const typeResult = DocumentType.safeParse(body.type);
  if (!typeResult.success) {
    return NextResponse.json(
      { error: "Invalid document type", details: typeResult.error.issues },
      { status: 400 }
    );
  }

  // Validate content against type-specific schema
  const contentResult = validateDocumentContent(body.type, body.content);
  if (!contentResult.success) {
    return NextResponse.json(
      { error: "Invalid content for document type", details: contentResult.error.issues },
      { status: 400 }
    );
  }

  // Build lineage chain if parent_id is set
  let lineageChain: string[] = [];
  if (body.parent_id) {
    const { data: parent } = await supabase
      .from("documents")
      .select("lineage_chain")
      .eq("id", body.parent_id)
      .single();

    if (parent) {
      lineageChain = [...((parent.lineage_chain as string[]) || []), body.parent_id];
    }
  }

  const { data, error } = await (supabase
    .from("documents") as any)
    .insert({
      freelancer_id: user.id,
      client_id: body.client_id || null,
      type: body.type,
      template_id: body.template_id || null,
      parent_id: body.parent_id || null,
      lineage_chain: lineageChain,
      title: body.title,
      content: body.content as unknown as Record<string, unknown>,
      metadata: body.metadata || {},
      status: body.status || "draft",
      ai_generated: body.ai_generated || false,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Create initial version record
  await (supabase.from("document_versions") as any).insert({
    documentId: data.id,
    version: 1,
    content: body.content,
    metadata: body.metadata || {},
    createdBy: "user",
  });

  return NextResponse.json({ document: data }, { status: 201 });
}
