// ============================================================
// Re-engagement Ping Automation Logic
// ============================================================

import type { Client, Proposal } from "../types";

export interface InactiveClient {
  client: Client;
  daysInactive: number;
  lastProjectDate: string;
  shouldPing: boolean;
}

export function calculateDaysInactive(lastActivityDate: string): number {
  const lastActivity = new Date(lastActivityDate);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - lastActivity.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

export function findInactiveClients(
  clients: Client[],
  proposals: Proposal[],
  threshold: number
): InactiveClient[] {
  return clients
    .map((client) => {
      // Find the most recent proposal for this client
      const clientProposals = proposals.filter((p) => p.clientId === client.id);

      if (clientProposals.length === 0) {
        // No proposals means never worked with them - not "inactive"
        return null;
      }

      const mostRecent = clientProposals.reduce((prev, current) => {
        return new Date(current.createdAt) > new Date(prev.createdAt)
          ? current
          : prev;
      });

      const daysInactive = calculateDaysInactive(mostRecent.createdAt);

      return {
        client,
        daysInactive,
        lastProjectDate: mostRecent.createdAt,
        shouldPing: daysInactive >= threshold,
      };
    })
    .filter((item): item is InactiveClient => item !== null)
    .filter((item) => item.shouldPing);
}

export async function generateReEngagementMessage(
  clientName: string,
  profession: string,
  tone: "professional" | "friendly" | "confident",
  anthropicApiKey: string
): Promise<string> {
  if (!anthropicApiKey) {
    return getDefaultReEngagementMessage(clientName, profession, tone);
  }

  const systemPrompt = `You are a professional freelancer crafting a personalized re-engagement message to a past client.
The message should:
- Be warm and genuine
- Reference the past relationship positively
- Show current industry knowledge or capabilities
- Create interest in working together again
- Be concise (2-3 paragraphs)

Tone: ${tone}

Respond ONLY with the message text, no additional formatting.`;

  const userPrompt = `Client name: ${clientName}
Profession: ${profession}

Write a re-engagement message to reconnect with this past client.`;

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
        max_tokens: 512,
        temperature: 0.7,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
      }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    return data.content[0]?.text || getDefaultReEngagementMessage(clientName, profession, tone);
  } catch (error) {
    console.error("AI message generation failed:", error);
    return getDefaultReEngagementMessage(clientName, profession, tone);
  }
}

function getDefaultReEngagementMessage(
  clientName: string,
  profession: string,
  tone: "professional" | "friendly" | "confident"
): string {
  const messages: Record<string, string> = {
    professional: `Dear ${clientName},

I hope this message finds you well. It's been some time since our last project together, and I've been reflecting on the great work we accomplished. I wanted to reach out and see how things have progressed on your end.

I've continued to develop my expertise in ${profession} and stay current with industry best practices. I'm confident I can bring fresh insights and enhanced capabilities to any new initiatives you might have in the pipeline.

I'd welcome the opportunity to reconnect and discuss how I might support your upcoming projects.

Best regards`,
    friendly: `Hey ${clientName}!

Hope you're doing great! I was thinking back on our project together and realized it's been way too long since we last worked on something. I had such a great time collaborating with you and would love to catch up!

I've been staying busy and picking up some cool new skills in ${profession}. Would love to hear what you're working on these days and see if there's anything I can help with.

Let's grab a call soon and reconnect!

Talk soon`,
    confident: `${clientName},

It's been a minute! I've been crushing it with new projects and expanding my ${profession} capabilities. Thought about reaching out because I know you're the type of client who appreciates quality work and results.

I'm ready to take on bigger, bolder projects. If you've got something brewing, I'm your person.

Let's make something great happen again.

Cheers`,
  };

  return messages[tone];
}
