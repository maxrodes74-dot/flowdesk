// =============================================================
// MTR-296: AI Document Generation - Public API Endpoint
// POST /api/v1/generate  — generate document from template (API key auth)
// =============================================================

import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import {
  gatherContext,
  generateDocumentContent,
} from "@/lib/ai/generate";
import { validateDocumentContent } from "@/lib/documents/schemas";
import { checkGuardrail, logAgentAction } from "@/lib/guardrails/check";
import type { CreateDocumentInput } from "@/lib/documents/types";

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
  // For now, we'll query by key prefix + full key comparison
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

interface GenerateRequest {
  template_id: string;
  client_id?: string;
  notes?: string;
  parent_document_id?: string;
}

export async function POST(request: NextRequest) {
  const supabase = createServiceClient();
  const authHeader = request.headers.get("authorization");

  // Verify API key
  const auth = await verifyApiKey(authHeader);
  if (!auth) {
    return NextResponse.json({ error: "Invalid API key" }, { status: 401 });
  }

  let body: GenerateRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.template_id) {
    return NextResponse.json(
      { error: "template_id is required" },
      { status: 400 }
    );
  }

  // Check guardrail for create action
  const guardrailCheck = await checkGuardrail({
    api_key_id: auth.api_key_id,
    freelancer_id: auth.freelancer_id,
    action_category: "create",
    action: `Create ${body.template_id} document`,
    resource_type: "document",
    resource_id: "new",
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

  // Fetch template
  const { data: template, error: templateError } = await supabase
    .from("templates")
    .select("*")
    .eq("id", body.template_id)
    .single();

  if (templateError || !template) {
    return NextResponse.json({ error: "Template not found" }, { status: 404 });
  }

  try {
    // Gather context for generation
    const context = await gatherContext({
      freelancer_id: auth.freelancer_id,
      client_id: body.client_id,
      parent_document_id: body.parent_document_id,
    });

    // Generate document content
    const generatedContent = await generateDocumentContent({
      template,
      context,
      notes: body.notes,
    });

    // Validate generated content
    const validation = validateDocumentContent(template.type, generatedContent);
    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Generated content validation failed",
          details: validation.error.issues,
        },
        { status: 400 }
      );
    }

    // Create document
    const documentData: CreateDocumentInput = {
      client_id: body.client_id,
      type: template.type as any,
      template_id: body.template_id,
      parent_id: body.parent_document_id,
      title: `${template.name} - ${new Date().toLocaleDateString()}`,
      content: generatedContent,
      metadata: {
        generated_at: new Date().toISOString(),
        generation_context: {
          freelancer_name: context.freelancer.name,
          client_name: context.client?.name,
        },
      },
      status: "draft",
      ai_generated: true,
    };

    const { data: document, error: createError } = await (supabase
      .from("documents") as any)
      .insert({
        ...(documentData as unknown as Record<string, unknown>),
        freelancer_id: auth.freelancer_id,
        version: 1,
        file_url: null,
        file_type: null,
        agent_key_id: auth.api_key_id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        sent_at: null,
        approved_at: null,
      })
      .select()
      .single();

    if (createError || !document) {
      return NextResponse.json(
        { error: createError?.message || "Failed to create document" },
        { status: 500 }
      );
    }

    // Dispatch webhook event (if webhook system exists)
    // await dispatchWebhook('document.created', document);

    return NextResponse.json({ document }, { status: 201 });
  } catch (error) {
    console.error("Generation error:", error);
    return NextResponse.json(
      {
        error: "Document generation failed",
        message:
          error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
