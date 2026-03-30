import { NextResponse } from "next/server";
import { canGenerateProposal } from "@/lib/tier-limits";
import { trackServerEvent } from "@/lib/analytics";

// Validate the shape of an AI-generated proposal
function validateProposalShape(data: unknown): data is {
  title: string;
  brief: string;
  scope: { title: string; description: string; dueDate: string }[];
  timeline: string;
  budget: string;
  totalPrice: number;
  terms: string;
  status: string;
  aiGenerated: boolean;
  clientName: string;
} {
  if (!data || typeof data !== "object") return false;
  const obj = data as Record<string, unknown>;

  if (typeof obj.title !== "string" || !obj.title) return false;
  if (typeof obj.timeline !== "string") return false;
  if (typeof obj.terms !== "string") return false;
  if (typeof obj.totalPrice !== "number" || obj.totalPrice < 0) return false;
  if (!Array.isArray(obj.scope) || obj.scope.length === 0) return false;

  for (const item of obj.scope) {
    if (typeof item !== "object" || !item) return false;
    if (typeof item.title !== "string" || !item.title) return false;
    if (typeof item.description !== "string") return false;
    if (typeof item.dueDate !== "string") return false;
  }

  return true;
}

// Input length limits
const MAX_CLIENT_NAME_LENGTH = 200;
const MAX_BRIEF_LENGTH = 5000;
const MAX_TIMELINE_LENGTH = 200;
const MAX_BUDGET_LENGTH = 200;

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
    clientName,
    brief,
    timeline,
    budget,
    freelancerName,
    profession,
    tone,
    services,
    hourlyRate,
    subscriptionTier = "free",
    aiGenerationsUsedThisMonth = 0,
  } = body as Record<string, unknown>;

  // Server-side input validation
  if (!clientName || typeof clientName !== "string") {
    return NextResponse.json(
      { error: "Client name is required" },
      { status: 400 }
    );
  }
  if (!brief || typeof brief !== "string") {
    return NextResponse.json(
      { error: "Project brief is required" },
      { status: 400 }
    );
  }
  if (clientName.length > MAX_CLIENT_NAME_LENGTH) {
    return NextResponse.json(
      { error: `Client name must be under ${MAX_CLIENT_NAME_LENGTH} characters` },
      { status: 400 }
    );
  }
  if (brief.length > MAX_BRIEF_LENGTH) {
    return NextResponse.json(
      { error: `Project brief must be under ${MAX_BRIEF_LENGTH} characters` },
      { status: 400 }
    );
  }
  if (timeline && String(timeline).length > MAX_TIMELINE_LENGTH) {
    return NextResponse.json(
      { error: `Timeline must be under ${MAX_TIMELINE_LENGTH} characters` },
      { status: 400 }
    );
  }
  if (budget && String(budget).length > MAX_BUDGET_LENGTH) {
    return NextResponse.json(
      { error: `Budget must be under ${MAX_BUDGET_LENGTH} characters` },
      { status: 400 }
    );
  }

  // Check tier limits for AI generation
  if (
    !canGenerateProposal(
      subscriptionTier as import("@/lib/types").SubscriptionTier,
      aiGenerationsUsedThisMonth as number
    )
  ) {
    return NextResponse.json(
      {
        error: "You have reached your AI generation limit for this month. Please upgrade your plan.",
        code: "TIER_LIMIT_EXCEEDED",
      },
      { status: 429 }
    );
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;

  // If no API key configured, fall back to template generation
  if (!apiKey) {
    return NextResponse.json(generateTemplate(String(clientName), String(brief), String(timeline || ""), String(budget || "")));
  }

  try {
    const toneGuide =
      tone === "professional"
        ? "Use a formal, structured, and polished tone."
        : tone === "friendly"
          ? "Use a warm, conversational, and approachable tone."
          : "Use a confident, bold, and direct tone.";

    const systemPrompt = `You are an expert freelance proposal writer. You help freelancers create professional, compelling proposals that win clients.

Freelancer profile:
- Name: ${freelancerName}
- Profession: ${profession}
- Services: ${services}
- Hourly rate: $${hourlyRate}/hr
- Tone: ${toneGuide}

Output rules:
- Generate a complete proposal with clear deliverables, timeline, and pricing
- Break the project into 3-5 milestones with specific due dates
- Include professional terms and conditions
- Match the freelancer's tone preference
- Be specific and actionable, not vague

Respond ONLY with valid JSON in this exact format:
{
  "title": "string - Professional proposal title",
  "brief": "string - The original brief",
  "scope": [
    {
      "title": "string - Milestone name",
      "description": "string - What will be delivered",
      "dueDate": "string - YYYY-MM-DD format"
    }
  ],
  "timeline": "string - e.g. 8 weeks",
  "budget": "string - e.g. $10,000 - $15,000",
  "totalPrice": number,
  "terms": "string - Payment terms and conditions",
  "status": "draft",
  "aiGenerated": true,
  "clientName": "string"
}`;

    const userPrompt = `Generate a proposal for:
Client: ${clientName}
Project brief: ${brief}
Timeline: ${timeline}
Budget range: ${budget}

Today's date is ${new Date().toISOString().split("T")[0]}. Set milestone due dates starting from today.`;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 2048,
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

    let proposal: unknown;
    try {
      proposal = JSON.parse(jsonMatch[0]);
    } catch {
      throw new Error("AI response contained malformed JSON");
    }

    if (!validateProposalShape(proposal)) {
      throw new Error("AI response JSON does not match expected proposal schema");
    }

    // Track proposal generation event
    await trackServerEvent(
      freelancerName as string,
      "proposal_generated",
      {
        clientName,
        proposalTitle: proposal.title,
        totalPrice: proposal.totalPrice,
        aiGenerated: true,
      }
    );

    return NextResponse.json(proposal);
  } catch (error) {
    console.error("AI generation failed, falling back to template:", error);
    const template = generateTemplate(String(clientName), String(brief), String(timeline || ""), String(budget || ""));

    // Track fallback template generation
    await trackServerEvent(
      freelancerName as string,
      "proposal_generated",
      {
        clientName,
        proposalTitle: template.title,
        totalPrice: template.totalPrice,
        aiGenerated: false,
      }
    );

    return NextResponse.json(template);
  }
}

function generateTemplate(
  clientName: unknown,
  brief: unknown,
  timeline: unknown,
  budget: unknown
) {
  const clientNameStr = String(clientName || "Client");
  const briefStr = String(brief || "");
  const timelineStr = String(timeline || "");
  const budgetStr = String(budget || "");
  const budgetNum = parseInt(budgetStr.replace(/[^0-9]/g, "")) || 5000;
  const today = Date.now();

  return {
    clientName: clientNameStr,
    title: `Project Proposal: ${briefStr.split(".")[0].substring(0, 60)}`,
    brief: briefStr,
    scope: [
      {
        title: "Discovery & Planning",
        description:
          "Deep dive into requirements, technical scoping, and project roadmap creation. Includes stakeholder interviews and competitive analysis.",
        dueDate: new Date(today + 14 * 86400000).toISOString().split("T")[0],
      },
      {
        title: "Core Development",
        description:
          "Implementation of primary features and functionality. Regular check-ins and progress updates throughout this phase.",
        dueDate: new Date(today + 35 * 86400000).toISOString().split("T")[0],
      },
      {
        title: "Refinement & Testing",
        description:
          "Quality assurance, performance optimization, and user acceptance testing. Two rounds of revisions included.",
        dueDate: new Date(today + 49 * 86400000).toISOString().split("T")[0],
      },
      {
        title: "Launch & Handoff",
        description:
          "Deployment to production, documentation, knowledge transfer, and 2 weeks of post-launch support.",
        dueDate: new Date(today + 56 * 86400000).toISOString().split("T")[0],
      },
    ],
    timeline: timelineStr || "8 weeks",
    budget: budgetStr,
    totalPrice: budgetNum,
    terms:
      "Payment split across milestones: 30% upfront, 30% at midpoint, 40% on completion. Two rounds of revisions per milestone included. Additional revisions billed at hourly rate. Net 15 payment terms on all invoices.",
    status: "draft",
    aiGenerated: true,
  };
}
