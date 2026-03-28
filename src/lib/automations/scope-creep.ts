// ============================================================
// Scope Creep Detection Automation Logic
// ============================================================

import type { Proposal, ScopeCreepConfig } from "../types";

export interface ScopeCreepAnalysis {
  isScopeCreep: boolean;
  confidence: number; // 0-1
  explanation: string;
  suggestedResponse: string;
  changeOrderDraft?: {
    description: string;
    estimatedHours: number;
    costPerHour: number;
  };
}

const SENSITIVITY_KEYWORDS = {
  strict: [
    "also",
    "additionally",
    "while you're at it",
    "can you",
    "could you",
    "would you mind",
    "quick",
    "small change",
    "one more",
    "modification",
    "update",
    "improve",
    "add",
    "integrate",
    "connect",
  ],
  moderate: [
    "also add",
    "additionally provide",
    "can you add",
    "could you also",
    "would you include",
    "one more thing",
    "new feature",
    "extra",
    "bonus",
    "another",
  ],
  relaxed: [
    "completely new feature",
    "different service",
    "additional service",
    "out of scope",
    "new project",
    "separate work",
  ],
};

export async function analyzeScopeCreep(
  clientMessage: string,
  proposal: Proposal,
  config: ScopeCreepConfig,
  anthropicApiKey: string
): Promise<ScopeCreepAnalysis> {
  const scopeItems = proposal.scope
    .map((item) => `- ${item.title}: ${item.description}`)
    .join("\n");

  const sensitivityLevel = config.sensitivityLevel;

  const systemPrompt = `You are an expert at identifying scope creep in freelance projects.
Analyze a client message against the original proposal scope and determine if the request goes beyond the agreed scope.

Sensitivity level: ${sensitivityLevel}
- strict: flag even small additions or changes
- moderate: flag meaningful additions
- relaxed: only flag major changes or entirely new features

Respond ONLY with valid JSON in this exact format:
{
  "isScopeCreep": boolean,
  "confidence": number (0-1),
  "explanation": "brief explanation",
  "suggestedResponse": "professional response addressing the request"
}`;

  const userPrompt = `Original proposal scope:
${scopeItems}

Client's new message:
"${clientMessage}"

Does this message request work outside the original scope?`;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": anthropicApiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1024,
        temperature: 0.5,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
      }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    const text = data.content[0]?.text || "";

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No valid JSON in AI response");
    }

    const analysis = JSON.parse(jsonMatch[0]);

    return {
      isScopeCreep: analysis.isScopeCreep,
      confidence: analysis.confidence || 0.5,
      explanation: analysis.explanation || "",
      suggestedResponse: analysis.suggestedResponse || "",
    };
  } catch (error) {
    console.error("AI analysis failed:", error);
    // Fallback to keyword analysis
    return performKeywordAnalysis(clientMessage, proposal, config);
  }
}

function performKeywordAnalysis(
  message: string,
  proposal: Proposal,
  config: ScopeCreepConfig
): ScopeCreepAnalysis {
  const messageLower = message.toLowerCase();
  const keywords = SENSITIVITY_KEYWORDS[config.sensitivityLevel];

  const foundKeywords = keywords.filter((kw) => messageLower.includes(kw));
  const keywordScore = Math.min(foundKeywords.length * 0.2, 1);

  const hasQuestionMarks = message.includes("?");
  const isQuestion = hasQuestionMarks;

  const isScopeCreep =
    config.sensitivityLevel === "strict"
      ? keywordScore > 0.2 && isQuestion
      : config.sensitivityLevel === "moderate"
        ? keywordScore > 0.4 && isQuestion
        : keywordScore > 0.6;

  return {
    isScopeCreep,
    confidence: Math.min(keywordScore, 0.8),
    explanation: isScopeCreep
      ? "Client message contains indicators of scope creep. Verify this request is covered in your original agreement."
      : "Message appears to be within original scope.",
    suggestedResponse:
      "Thank you for the request. Let me review this against our original agreement and get back to you with a timeline and estimate.",
  };
}

export function generateChangeOrderDraft(
  newRequest: string,
  hourlyRate: number
): {
  description: string;
  estimatedHours: number;
  costPerHour: number;
} {
  // Simple heuristic: estimate hours based on message length and keywords
  const messageLength = newRequest.length;
  let estimatedHours = 2;

  if (messageLength > 500) estimatedHours = 4;
  if (messageLength > 1000) estimatedHours = 8;

  const complexityKeywords = [
    "integration",
    "api",
    "database",
    "design",
    "testing",
  ];
  const hasComplexity = complexityKeywords.some((kw) =>
    newRequest.toLowerCase().includes(kw)
  );

  if (hasComplexity) {
    estimatedHours = Math.ceil(estimatedHours * 1.5);
  }

  return {
    description: `Scope Addition: ${newRequest.substring(0, 100)}...`,
    estimatedHours,
    costPerHour: hourlyRate,
  };
}
