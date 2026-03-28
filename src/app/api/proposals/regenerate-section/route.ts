import { NextResponse } from "next/server";
import type { ProposalSection } from "@/lib/proposal-actions";

interface RegenerationRequest {
  section: ProposalSection;
  clientName: string;
  brief: string;
  currentScope: Array<{ title: string; description: string; dueDate: string }>;
  currentTimeline: string;
  currentBudget: string;
  currentTerms: string;
  freelancerName: string;
  profession: string;
  tone: string;
  services: string;
  hourlyRate: number;
}

function validateSectionInput(section: unknown): section is ProposalSection {
  return ["scope", "timeline", "pricing", "terms"].includes(String(section));
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

  const {
    section,
    clientName,
    brief,
    currentScope,
    currentTimeline,
    currentBudget,
    currentTerms,
    freelancerName,
    profession,
    tone,
    services,
    hourlyRate,
  } = body as RegenerationRequest;

  // Validate inputs
  if (!section || !validateSectionInput(section)) {
    return NextResponse.json(
      { error: "Invalid or missing section. Must be: scope, timeline, pricing, or terms" },
      { status: 400 }
    );
  }

  if (!clientName || !brief) {
    return NextResponse.json(
      { error: "Missing required fields: clientName, brief" },
      { status: 400 }
    );
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;

  // If no API key configured, return template fallback
  if (!apiKey) {
    return NextResponse.json(
      generateTemplateSection(section, clientName, currentScope || [], currentTimeline, currentBudget)
    );
  }

  try {
    const toneGuide =
      tone === "professional"
        ? "Use a formal, structured, and polished tone."
        : tone === "friendly"
          ? "Use a warm, conversational, and approachable tone."
          : "Use a confident, bold, and direct tone.";

    const systemPrompt = `You are an expert freelance proposal writer specializing in section-by-section regeneration.

Freelancer profile:
- Name: ${freelancerName}
- Profession: ${profession}
- Services: ${services}
- Hourly rate: $${hourlyRate}/hr
- Tone: ${toneGuide}

You are regenerating a single section of an existing proposal. Maintain consistency with the existing proposal context while improving the regenerated section.

Output rules:
- Generate ONLY the requested section
- Maintain alignment with existing proposal context
- Be specific and actionable
- Match the freelancer's tone preference
- Return valid JSON matching the section-specific format`;

    let userPrompt = "";
    let expectedFormat = "";

    if (section === "scope") {
      userPrompt = `Regenerate the deliverables and timeline section for:
Client: ${clientName}
Project brief: ${brief}
Current timeline: ${currentTimeline}
Current budget: ${currentBudget}

Today's date is ${new Date().toISOString().split("T")[0]}.
Generate 3-5 detailed deliverables with specific due dates.

Respond with ONLY valid JSON in this exact format:
{
  "scope": [
    {
      "title": "string - Milestone name",
      "description": "string - What will be delivered",
      "dueDate": "string - YYYY-MM-DD format"
    }
  ]
}`;
      expectedFormat = "scope array";
    } else if (section === "timeline") {
      userPrompt = `Regenerate the project timeline section for:
Client: ${clientName}
Project brief: ${brief}
Current budget: ${currentBudget}

Provide a realistic timeline estimate that balances quality and speed.

Respond with ONLY valid JSON in this exact format:
{
  "timeline": "string - e.g. '8 weeks' or '3 months'"
}`;
      expectedFormat = "timeline string";
    } else if (section === "pricing") {
      userPrompt = `Regenerate the pricing section for:
Client: ${clientName}
Project brief: ${brief}
Current timeline: ${currentTimeline}
Current budget: ${currentBudget}
Freelancer hourly rate: $${hourlyRate}/hr

Provide detailed pricing breakdown and total price estimate.

Respond with ONLY valid JSON in this exact format:
{
  "budget": "string - e.g. '$10,000 - $15,000'",
  "totalPrice": number - the estimated total price
}`;
      expectedFormat = "budget and totalPrice";
    } else if (section === "terms") {
      userPrompt = `Regenerate the terms and conditions section for:
Client: ${clientName}
Project brief: ${brief}

Create professional, fair payment terms and conditions.

Respond with ONLY valid JSON in this exact format:
{
  "terms": "string - Payment terms and conditions"
}`;
      expectedFormat = "terms string";
    }

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

    let result: unknown;
    try {
      result = JSON.parse(jsonMatch[0]);
    } catch {
      throw new Error("AI response contained malformed JSON");
    }

    // Validate the result based on section type
    if (section === "scope" && !validateScopeResult(result)) {
      throw new Error("AI response does not match scope format");
    }
    if (section === "timeline" && !validateTimelineResult(result)) {
      throw new Error("AI response does not match timeline format");
    }
    if (section === "pricing" && !validatePricingResult(result)) {
      throw new Error("AI response does not match pricing format");
    }
    if (section === "terms" && !validateTermsResult(result)) {
      throw new Error("AI response does not match terms format");
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Section regeneration failed, falling back to template:", error);
    return NextResponse.json(
      generateTemplateSection(section, clientName, currentScope || [], currentTimeline, currentBudget)
    );
  }
}

function validateScopeResult(data: unknown): data is {
  scope: Array<{ title: string; description: string; dueDate: string }>;
} {
  if (!data || typeof data !== "object") return false;
  const obj = data as Record<string, unknown>;
  if (!Array.isArray(obj.scope)) return false;
  return obj.scope.every(
    (item) =>
      typeof item === "object" &&
      typeof (item as Record<string, unknown>).title === "string" &&
      typeof (item as Record<string, unknown>).description === "string" &&
      typeof (item as Record<string, unknown>).dueDate === "string"
  );
}

function validateTimelineResult(data: unknown): data is { timeline: string } {
  if (!data || typeof data !== "object") return false;
  const obj = data as Record<string, unknown>;
  return typeof obj.timeline === "string" && obj.timeline.length > 0;
}

function validatePricingResult(data: unknown): data is {
  budget: string;
  totalPrice: number;
} {
  if (!data || typeof data !== "object") return false;
  const obj = data as Record<string, unknown>;
  return (
    typeof obj.budget === "string" &&
    typeof obj.totalPrice === "number" &&
    obj.totalPrice > 0
  );
}

function validateTermsResult(data: unknown): data is { terms: string } {
  if (!data || typeof data !== "object") return false;
  const obj = data as Record<string, unknown>;
  return typeof obj.terms === "string" && obj.terms.length > 0;
}

function generateTemplateSection(
  section: ProposalSection,
  clientName: string,
  currentScope: Array<{ title: string; description: string; dueDate: string }>,
  currentTimeline: string,
  currentBudget: string
) {
  const today = Date.now();

  if (section === "scope") {
    return {
      scope: [
        {
          title: "Discovery & Planning",
          description: "Understanding project requirements, stakeholder interviews, and roadmap creation.",
          dueDate: new Date(today + 14 * 86400000).toISOString().split("T")[0],
        },
        {
          title: "Development",
          description: "Core implementation with regular progress updates and client check-ins.",
          dueDate: new Date(today + 35 * 86400000).toISOString().split("T")[0],
        },
        {
          title: "Testing & Refinement",
          description: "Quality assurance, performance optimization, and two rounds of revisions.",
          dueDate: new Date(today + 49 * 86400000).toISOString().split("T")[0],
        },
      ],
    };
  }

  if (section === "timeline") {
    return { timeline: "8 weeks" };
  }

  if (section === "pricing") {
    const budgetNum = parseInt(currentBudget.replace(/[^0-9]/g, "")) || 5000;
    return {
      budget: currentBudget || "$5,000 - $10,000",
      totalPrice: budgetNum,
    };
  }

  if (section === "terms") {
    return {
      terms: "Payment split across milestones: 30% upfront, 30% at midpoint, 40% on completion. Two rounds of revisions per milestone included. Additional revisions billed at hourly rate. Net 15 payment terms on all invoices.",
    };
  }

  return {};
}
