import { NextResponse } from "next/server";
import { ALL_CLAUSES } from "@/lib/contract-clauses";

// Validate the shape of AI-generated contract clauses
function validateContractShape(data: unknown): data is {
  clauseIds: string[];
  customClause?: string;
} {
  if (!data || typeof data !== "object") return false;
  const obj = data as Record<string, unknown>;

  if (!Array.isArray(obj.clauseIds)) return false;
  if (
    obj.customClause !== undefined &&
    typeof obj.customClause !== "string"
  ) return false;

  for (const id of obj.clauseIds) {
    if (typeof id !== "string") return false;
    const exists = ALL_CLAUSES.find((c) => c.id === id);
    if (!exists) return false;
  }

  return true;
}

// Input length limits
const MAX_BRIEF_LENGTH = 5000;
const MAX_CUSTOM_CLAUSE_LENGTH = 2000;

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

  // Validate required fields
  const { projectBrief, clientType } = body;

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

  // For now, return a mock response with pre-selected clauses
  // In a real implementation, this would call Claude API to generate clauses
  try {
    // Default clause selections based on client type
    const defaultClauses = {
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

    const selectedClauseIds =
      defaultClauses[clientType as keyof typeof defaultClauses] ||
      defaultClauses.individual;

    return NextResponse.json({
      clauseIds: selectedClauseIds,
      customClauses: [],
      reasoning:
        "Contract clauses selected based on project requirements and client type",
    });
  } catch (error) {
    console.error("Error generating contract:", error);
    return NextResponse.json(
      { error: "Failed to generate contract" },
      { status: 500 }
    );
  }
}
