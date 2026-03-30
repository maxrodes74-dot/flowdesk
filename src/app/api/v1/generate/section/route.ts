// =============================================================
// MTR-296: AI Document Generation - Section Regeneration Endpoint
// POST /api/v1/generate/section  — regenerate single section (API key auth)
// =============================================================

import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import {
  gatherContext,
  regenerateSection,
} from "@/lib/ai/generate";
import { rowToDocument } from "@/lib/documents/types";
import { checkGuardrail } from "@/lib/guardrails/check";

// Verify API key and extract freelancer_id
async function verifyApiKey(
  authHeader: string | null
): Promise<{ freelancer_id: string; api_key_id: string } | null> {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  const apiKey = authHeader.substring(7);
  const supabase = createServiceClient();

  // Hash the key (in production, store hashed keys)
  const { data: keyRecord } = await supabase
    .from("api_keys")
    .select("id, freelancer_id")
    .eq("key_hash", hashApiKey(apiKey))
    .single();

  if (!keyRecord) {
    return null;
  }

  return {
    freelancer_id: keyRecord.freelancer_id,
    api_key_id: keyRecord.id,
  };
}

// Simple hash function (in production, use proper bcrypt/argon2)
function hashApiKey(key: string): string {
  return key; // Placeholder - implement proper hashing
}

interface RegenerateSectionRequest {
  document_id: string;
  section_key: string;
  instructions?: string;
}

export async function POST(request: NextRequest) {
  const supabase = createServiceClient();
  const authHeader = request.headers.get("authorization");

  // Verify API key
  const auth = await verifyApiKey(authHeader);
  if (!auth) {
    return NextResponse.json({ error: "Invalid API key" }, { status: 401 });
  }

  let body: RegenerateSectionRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.document_id || !body.section_key) {
    return NextResponse.json(
      { error: "document_id and section_key are required" },
      { status: 400 }
    );
  }

  // Check guardrail for edit action
  const guardrailCheck = await checkGuardrail({
    api_key_id: auth.api_key_id,
    freelancer_id: auth.freelancer_id,
    action_category: "edit",
    action: `Regenerate section ${body.section_key}`,
    resource_type: "document",
    resource_id: body.document_id,
    action_payload: body as unknown as Record<string, unknown>,
  });

  if (guardrailCheck.result === "blocked") {
    return NextResponse.json(
      { error: "Action blocked by guardrail" },
      { status: 403 }
    );
  }

  if (guardrailCheck.result === "pending_approval") {
    return NextResponse.json(
      {
        error: "Action pending approval",
        approval_id: guardrailCheck.approval_id,
      },
      { status: 202 }
    );
  }

  // Fetch document
  const { data: docData, error: docError } = await supabase
    .from("documents")
    .select("*")
    .eq("id", body.document_id)
    .eq("freelancer_id", auth.freelancer_id)
    .single();

  if (docError || !docData) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  const document = rowToDocument(docData);

  // Fetch template
  if (!document.template_id) {
    return NextResponse.json(
      { error: "Document has no associated template" },
      { status: 400 }
    );
  }

  const { data: template, error: templateError } = await supabase
    .from("templates")
    .select("*")
    .eq("id", document.template_id)
    .single();

  if (templateError || !template) {
    return NextResponse.json({ error: "Template not found" }, { status: 404 });
  }

  // Verify section exists in template
  const section = template.sections.find((s: any) => s.key === body.section_key);
  if (!section) {
    return NextResponse.json({ error: "Section not found in template" }, { status: 404 });
  }

  try {
    // Gather context for generation
    const context = await gatherContext({
      freelancer_id: auth.freelancer_id,
      client_id: document.client_id || undefined,
      parent_document_id: document.parent_id || undefined,
    });

    // Regenerate section
    const newSectionContent = await regenerateSection({
      template,
      section_key: body.section_key,
      context,
      current_content: document.content,
      instructions: body.instructions,
    });

    // Update document with new section content
    const updatedContent = {
      ...document.content,
      [body.section_key]: newSectionContent,
    };

    const { data: updated, error: updateError } = await (supabase
      .from("documents") as any)
      .update({
        content: updatedContent as unknown as Record<string, unknown>,
        updated_at: new Date().toISOString(),
      })
      .eq("id", body.document_id)
      .select()
      .single();

    if (updateError || !updated) {
      return NextResponse.json(
        { error: updateError?.message || "Failed to update document" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      document_id: body.document_id,
      section_key: body.section_key,
      updated_content: newSectionContent,
      full_content: updatedContent,
    });
  } catch (error) {
    console.error("Section regeneration error:", error);
    return NextResponse.json(
      {
        error: "Section regeneration failed",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
