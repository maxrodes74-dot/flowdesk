// =============================================================
// MTR-296: AI Document Generation - Core Logic
// Uses Claude API for content generation
// =============================================================

import { createServiceClient } from "@/lib/supabase/service";
import type { Template } from "@/lib/templates/types";
import type { Document } from "@/lib/documents/types";

export interface GenerationContext {
  freelancer: {
    id: string;
    name: string;
    email: string;
    services?: string[];
    rate?: number;
    tone?: string;
    portfolio_url?: string;
  };
  client?: {
    id: string;
    name: string;
    company?: string;
    email?: string;
  };
  recent_documents: Partial<Document>[];
  parent_document?: Partial<Document>;
}

/**
 * Gather context for AI generation from freelancer, client, and document history.
 */
export async function gatherContext(params: {
  freelancer_id: string;
  client_id?: string;
  parent_document_id?: string;
}): Promise<GenerationContext> {
  const supabase = createServiceClient();

  // Fetch freelancer profile
  const { data: freelancer, error: freelancerError } = await supabase
    .from("freelancers")
    .select(
      "id, name, email, services, rate, tone, portfolio_url"
    )
    .eq("id", params.freelancer_id)
    .single();

  if (freelancerError || !freelancer) {
    throw new Error("Freelancer not found");
  }

  let client = null;
  if (params.client_id) {
    const { data: clientData } = await supabase
      .from("clients")
      .select("id, name, company, email")
      .eq("id", params.client_id)
      .single();
    client = clientData;
  }

  // Fetch recent documents for this client (last 5)
  let recentDocs: Partial<Document>[] = [];
  if (params.client_id) {
    const { data: docs } = await supabase
      .from("documents")
      .select("id, type, title, created_at")
      .eq("freelancer_id", params.freelancer_id)
      .eq("client_id", params.client_id)
      .order("created_at", { ascending: false })
      .limit(5);
    recentDocs = docs || [];
  }

  // Fetch parent document if provided
  let parentDoc = null;
  if (params.parent_document_id) {
    const { data: doc } = await supabase
      .from("documents")
      .select("id, type, title, content, metadata")
      .eq("id", params.parent_document_id)
      .single();
    parentDoc = doc;
  }

  return {
    freelancer,
    client: client || undefined,
    recent_documents: recentDocs,
    parent_document: parentDoc || undefined,
  };
}

/**
 * Generate document content using Claude API.
 */
export async function generateDocumentContent(params: {
  template: Template;
  context: GenerationContext;
  notes?: string;
}): Promise<Record<string, unknown>> {
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  if (!anthropicKey) {
    throw new Error("ANTHROPIC_API_KEY not configured");
  }

  // Build system prompt
  const systemPrompt = buildSystemPrompt(params.template, params.context);

  // Build user message
  const userMessage = buildUserMessage(params.template, params.context, params.notes);

  // Call Claude API
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": anthropicKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: userMessage,
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    console.error("Claude API error:", errorData);
    throw new Error(`Claude API error: ${response.statusText}`);
  }

  const data = (await response.json()) as { content: Array<{ type: string; text: string }> };

  // Extract text content
  const textContent = data.content
    .filter((block) => block.type === "text")
    .map((block) => block.text)
    .join("\n");

  // Parse the generated content as JSON
  let generatedContent: Record<string, unknown>;
  try {
    // Find JSON in the response
    const jsonMatch = textContent.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No JSON found in response");
    }
    generatedContent = JSON.parse(jsonMatch[0]);
  } catch (parseError) {
    console.error("Failed to parse Claude response:", textContent);
    throw new Error("Failed to parse generated content as JSON");
  }

  return generatedContent;
}

/**
 * Regenerate a single section of a document.
 */
export async function regenerateSection(params: {
  template: Template;
  section_key: string;
  context: GenerationContext;
  current_content: Record<string, unknown>;
  instructions?: string;
}): Promise<unknown> {
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  if (!anthropicKey) {
    throw new Error("ANTHROPIC_API_KEY not configured");
  }

  const section = params.template.sections.find(
    (s) => s.key === params.section_key
  );
  if (!section) {
    throw new Error(`Section ${params.section_key} not found in template`);
  }

  // Build system prompt for section regeneration
  const systemPrompt = buildSectionSystemPrompt(section, params.context);

  // Build user message for section regeneration
  const userMessage = buildSectionUserMessage(
    section,
    params.current_content,
    params.instructions
  );

  // Call Claude API
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": anthropicKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2048,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: userMessage,
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    console.error("Claude API error:", errorData);
    throw new Error(`Claude API error: ${response.statusText}`);
  }

  const data = (await response.json()) as { content: Array<{ type: string; text: string }> };

  // Extract text content
  const textContent = data.content
    .filter((block) => block.type === "text")
    .map((block) => block.text)
    .join("\n");

  // Parse based on section type
  let result: unknown;
  if (section.type === "number" || section.type === "currency") {
    result = parseFloat(textContent.trim());
  } else if (section.type === "list") {
    try {
      const jsonMatch = textContent.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
      } else {
        result = textContent.split("\n").filter((line) => line.trim());
      }
    } catch {
      result = textContent.split("\n").filter((line) => line.trim());
    }
  } else if (section.type === "table") {
    try {
      const jsonMatch = textContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
      } else {
        result = textContent;
      }
    } catch {
      result = textContent;
    }
  } else {
    result = textContent;
  }

  return result;
}

/**
 * Build system prompt for full document generation.
 */
function buildSystemPrompt(
  template: Template,
  context: GenerationContext
): string {
  const sectionsInfo = template.sections
    .map(
      (s) =>
        `- ${s.key} (${s.type}): ${s.label}. Requirements: ${s.ai_prompt}`
    )
    .join("\n");

  return `You are a professional document generation assistant. Your task is to generate a ${template.type} document based on the provided template and context.

TEMPLATE SECTIONS:
${sectionsInfo}

FREELANCER CONTEXT:
- Name: ${context.freelancer.name}
- Services: ${context.freelancer.services?.join(", ") || "Not specified"}
- Rate: ${context.freelancer.rate || "Not specified"}
- Tone: ${context.freelancer.tone || "Professional"}

${context.client ? `CLIENT CONTEXT:
- Name: ${context.client.name}
- Company: ${context.client.company || "Not specified"}
- Email: ${context.client.email || "Not specified"}

RECENT DOCUMENTS FOR THIS CLIENT:
${context.recent_documents.map((d) => `- ${d.title} (${d.type})`).join("\n")}` : ""}

${context.parent_document ? `PARENT DOCUMENT REFERENCE:
Title: ${context.parent_document.title}
Type: ${context.parent_document.type}

Parent Document Content:
${JSON.stringify(context.parent_document.content, null, 2)}` : ""}

INSTRUCTIONS:
Generate ONLY a valid JSON object with the exact keys corresponding to the section keys above. Each value should be appropriate for its section type. Make the content professional, contextual to the client and services, and ready for immediate use.`;
}

/**
 * Build user message for full document generation.
 */
function buildUserMessage(
  template: Template,
  context: GenerationContext,
  notes?: string
): string {
  const sections = template.sections
    .map((s) => `"${s.key}": <${s.type} content for: ${s.ai_prompt}>`)
    .join(",\n");

  let message = `Generate a complete ${template.type} document in JSON format with the following structure:

{
${sections}
}`;

  if (notes) {
    message += `\n\nADDITIONAL INSTRUCTIONS FROM USER:\n${notes}`;
  }

  return message;
}

/**
 * Build system prompt for section regeneration.
 */
function buildSectionSystemPrompt(section: any, context: GenerationContext): string {
  return `You are a professional document editor. Your task is to regenerate a single section of a document.

SECTION DETAILS:
- Key: ${section.key}
- Label: ${section.label}
- Type: ${section.type}
- Instructions: ${section.ai_prompt}

FREELANCER: ${context.freelancer.name}
TONE: ${context.freelancer.tone || "Professional"}

Generate ONLY the content for this section, matching the specified type. For lists, return a JSON array. For tables, return a JSON object. For text, return plain text (no markdown).`;
}

/**
 * Build user message for section regeneration.
 */
function buildSectionUserMessage(
  section: any,
  currentContent: Record<string, unknown>,
  instructions?: string
): string {
  let message = `Regenerate the "${section.label}" section (${section.type}).

Current content:
${JSON.stringify(currentContent[section.key] || "", null, 2)}

Instructions: ${section.ai_prompt}`;

  if (instructions) {
    message += `\n\nAdditional instructions: ${instructions}`;
  }

  return message;
}
