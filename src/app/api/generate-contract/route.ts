import { NextResponse } from "next/server";
import { ALL_CLAUSES } from "@/lib/contract-clauses";

// Validate the shape of AI-generated contract clauses
function validateContractShape(data: unknown): data is {
  clauseIds: string[];
  reasoning?: string;
} {
  if (!data || typeof data !== "object") return false;
  const obj = data as Record<string, unknown>;

  if (!Array.isArray(obj.clauseIds)) return false;
  if (obj.reasoning !== undefined && typeof obj.reasoning !== "string") return false;

  for (const id of obj.clauseIds) {
    if (typeof id !== "string") return false;
    const exists = ALL_CLAUSES.find((c) => c.id === id);
    if (!exists) return false;
  }

  return true;
}

// Input length limits
const MAX_BRIEF_LENGTH = 5000;
const MAX_FREELANCER_NAME_LENGTH = 200;
const MAX_PROFESSION_LENGTH = 200;
const MAX_BUDGET_LENGTH = 200;

// Default clause selections for fallback
function getDefaultClausesByClientType(clientType: string): string[] {
  const defaultClauses: Record<string, string[]> = {
    startup: [
      "payment_net30",
      "revisions_limited",
      "ip_licensed",
      "cancellation_flexible",
      "confidentiality_one_way",
    ],
    corporate: [
      "payment_net15",
      "revisions_limited",
      "ip_full_transfer",
      "cancellation_strict",
      "confidentiality_strict",
    ],
    individual: [
      "payment_50_50",
      "revisions_unlimited",
      "ip_licensed",
      "cancellation_moderate",
      "confidentiality_none",
    ],
  };

  return defaultClauses[clientType] || defaultClauses.individual;
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON in request body" },
      { status: 400 }
    );
  }

  // Extract and validate required fields
  const {
    projectBrief,
    clientType,
    freelancerName,
    profession,
    hourlyRate,
    budget,
    timeline,
  } = body;

  if (!projectBrief || typeof projectBrief !== "string") {
    return NextResponse.json(
      { error: "Missing or invalid projectBrief" },
      { status: 400 }
    );
  }

  if (projectBrief.length > MAX_BRIEF_LENGTH) {
    return NextResponse.json(
      {
        error: `Project brief exceeds maximum length of ${MAX_BRIEF_LENGTH} characters`,
      },
      { status: 400 }
    );
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;

  // If no API key configured, fall back to template generation
  if (!apiKey) {
    const selectedClauseIds = getDefaultClausesByClientType(
      clientType as string
    );
    return NextResponse.json({
      clauseIds: selectedClauseIds,
      reasoning: "Contract clauses selected based on client type (fallback mode)",
    });
  }

  try {
    const systemPrompt = `You are an expert contract drafter. Your job is to recommend the most appropriate contract clauses from the available library based on project details.

Available clauses by category:
- Payment Terms: payment_net30 (Net 30 days), payment_net15 (Net 15 days), payment_50_50 (50% upfront, 50% completion)
- Revisions: revisions_unlimited, revisions_limited (3 rounds), revisions_none (spec-based)
- IP Rights: ip_full_transfer (full ownership to client), ip_licensed (license only), ip_shared (shared rights)
- Cancellation: cancellation_strict, cancellation_flexible (5 days notice), cancellation_moderate (14-day grace period)
- Confidentiality: confidentiality_strict (mutual NDA), confidentiality_one_way (freelancer bound), confidentiality_none (limited)

Your task:
1. Analyze the freelancer profile and project scope
2. Select the most appropriate clause from each category
3. Return ONLY valid clause IDs that exist in the library

Respond ONLY with valid JSON in this exact format:
{
  "clauseIds": ["payment_...", "revisions_...", "ip_...", "cancellation_...", "confidentiality_..."],
  "reasoning": "Brief explanation of why these clauses were selected"
}`;

    const userPrompt = `Generate contract clauses for:

Freelancer Profile:
- Name: ${freelancerName || "Freelancer"}
- Profession: ${profession || "Service Provider"}
- Hourly Rate: $${hourlyRate || "50"}/hr

Project Details:
- Brief: ${projectBrief}
- Timeline: ${timeline || "Not specified"}
- Budget: ${budget || "Not specified"}
- Client Type: ${clientType || "individual"}

Select one clause from each category that best fits this project.`;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1024,
        temperature: 0.7,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
      }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    const text = data.content[0]?.text || "";

    // Extract JSON from the response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No valid JSON in AI response");
    }

    let contractData: unknown;
    try {
      contractData = JSON.parse(jsonMatch[0]);
    } catch {
      throw new Error("AI response contained malformed JSON");
    }

    if (!validateContractShape(contractData)) {
      throw new Error("AI response JSON does not match expected contract schema");
    }

    return NextResponse.json(contractData);
  } catch (error) {
    console.error("AI generation failed, falling back to template:", error);
    const selectedClauseIds = getDefaultClausesByClientType(
      clientType as string
    );
    return NextResponse.json({
      clauseIds: selectedClauseIds,
      reasoning: "Contract clauses selected based on client type (fallback mode)",
    });
  }
}
