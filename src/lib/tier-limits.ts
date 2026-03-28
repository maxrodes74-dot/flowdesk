import type { SubscriptionTier } from "./types";

export interface TierLimits {
  maxActiveClients: number;
  maxAiGenerationsPerMonth: number;
  hasAutomations: boolean;
  name: string;
  description: string;
}

const tierLimitsMap: Record<SubscriptionTier, TierLimits> = {
  free: {
    maxActiveClients: 3,
    maxAiGenerationsPerMonth: 5,
    hasAutomations: false,
    name: "Free",
    description: "Basic features for getting started",
  },
  pro: {
    maxActiveClients: Infinity,
    maxAiGenerationsPerMonth: Infinity,
    hasAutomations: false,
    name: "Pro",
    description: "Unlimited clients and AI generations",
  },
  "pro+": {
    maxActiveClients: Infinity,
    maxAiGenerationsPerMonth: Infinity,
    hasAutomations: true,
    name: "Pro+",
    description: "Everything in Pro plus workflow automations",
  },
};

export function getTierLimits(tier: SubscriptionTier): TierLimits {
  return tierLimitsMap[tier];
}

export function canCreateClient(
  tier: SubscriptionTier,
  currentActiveClients: number
): boolean {
  const limits = getTierLimits(tier);
  return currentActiveClients < limits.maxActiveClients;
}

export function canGenerateProposal(
  tier: SubscriptionTier,
  generationsUsedThisMonth: number
): boolean {
  const limits = getTierLimits(tier);
  return generationsUsedThisMonth < limits.maxAiGenerationsPerMonth;
}

export function hasAutomations(tier: SubscriptionTier): boolean {
  return getTierLimits(tier).hasAutomations;
}

export function getClientLimitMessage(tier: SubscriptionTier, current: number): string {
  const limits = getTierLimits(tier);
  if (limits.maxActiveClients === Infinity) {
    return "Unlimited clients available";
  }
  return `${current}/${limits.maxActiveClients} active clients used`;
}

export function getAiGenerationLimitMessage(
  tier: SubscriptionTier,
  current: number
): string {
  const limits = getTierLimits(tier);
  if (limits.maxAiGenerationsPerMonth === Infinity) {
    return "Unlimited AI generations this month";
  }
  return `${current}/${limits.maxAiGenerationsPerMonth} AI generations used this month`;
}
