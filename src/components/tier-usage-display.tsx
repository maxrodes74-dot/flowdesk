"use client";

import React from "react";
import { AlertCircle } from "lucide-react";
import type { SubscriptionTier } from "@/lib/types";
import {
  getTierLimits,
  getClientLimitMessage,
  getAiGenerationLimitMessage,
} from "@/lib/tier-limits";

interface TierUsageDisplayProps {
  tier: SubscriptionTier;
  activeClientsCount: number;
  aiGenerationsUsedThisMonth: number;
  className?: string;
}

export function TierUsageDisplay({
  tier,
  activeClientsCount,
  aiGenerationsUsedThisMonth,
  className = "",
}: TierUsageDisplayProps) {
  const limits = getTierLimits(tier);
  const clientMessage = getClientLimitMessage(tier, activeClientsCount);
  const aiMessage = getAiGenerationLimitMessage(
    tier,
    aiGenerationsUsedThisMonth
  );

  const clientPercentage =
    limits.maxActiveClients === Infinity
      ? 0
      : (activeClientsCount / limits.maxActiveClients) * 100;

  const aiPercentage =
    limits.maxAiGenerationsPerMonth === Infinity
      ? 0
      : (aiGenerationsUsedThisMonth / limits.maxAiGenerationsPerMonth) * 100;

  const showClientWarning =
    limits.maxActiveClients !== Infinity &&
    activeClientsCount >= limits.maxActiveClients;

  const showAiWarning =
    limits.maxAiGenerationsPerMonth !== Infinity &&
    aiGenerationsUsedThisMonth >= limits.maxAiGenerationsPerMonth;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Current Plan */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm font-semibold text-blue-900">
          Current Plan: <span className="text-blue-600">{limits.name}</span>
        </p>
        <p className="text-xs text-blue-700 mt-1">{limits.description}</p>
      </div>

      {/* Client Usage */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-gray-900">
            Active Clients
          </label>
          <span className="text-sm text-gray-600">{clientMessage}</span>
        </div>
        {limits.maxActiveClients !== Infinity && (
          <>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${
                  clientPercentage >= 100
                    ? "bg-red-600"
                    : clientPercentage >= 75
                      ? "bg-yellow-600"
                      : "bg-green-600"
                }`}
                style={{ width: `${Math.min(clientPercentage, 100)}%` }}
              ></div>
            </div>
            {showClientWarning && (
              <div className="flex items-center gap-2 mt-2 p-2 bg-red-50 border border-red-200 rounded">
                <AlertCircle size={14} className="text-red-600 flex-shrink-0" />
                <p className="text-xs text-red-600">
                  You've reached your client limit. Upgrade to add more clients.
                </p>
              </div>
            )}
          </>
        )}
      </div>

      {/* AI Generation Usage */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-gray-900">
            AI Generations
          </label>
          <span className="text-sm text-gray-600">{aiMessage}</span>
        </div>
        {limits.maxAiGenerationsPerMonth !== Infinity && (
          <>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${
                  aiPercentage >= 100
                    ? "bg-red-600"
                    : aiPercentage >= 75
                      ? "bg-yellow-600"
                      : "bg-green-600"
                }`}
                style={{ width: `${Math.min(aiPercentage, 100)}%` }}
              ></div>
            </div>
            {showAiWarning && (
              <div className="flex items-center gap-2 mt-2 p-2 bg-red-50 border border-red-200 rounded">
                <AlertCircle size={14} className="text-red-600 flex-shrink-0" />
                <p className="text-xs text-red-600">
                  You've reached your AI generation limit this month. Upgrade for
                  unlimited generations.
                </p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Automations Info */}
      {!limits.hasAutomations && (
        <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
          <p className="text-xs text-purple-900">
            <span className="font-semibold">Pro+ Feature:</span> Workflow automations
            are available on Pro+ plans.
          </p>
        </div>
      )}
    </div>
  );
}
