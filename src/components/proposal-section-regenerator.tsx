"use client";

import React, { useState } from "react";
import { RotateCw, Loader } from "lucide-react";
import type { Proposal, ProposalDeliverable } from "@/lib/types";

export type ProposalSection = "scope" | "timeline" | "pricing" | "terms";

interface SectionRegeneratorProps {
  proposal: Proposal;
  section: ProposalSection;
  onRegenerate?: (data: unknown) => void;
  freelancerName: string;
  freelancerEmail?: string;
  profession: string;
  tone: "professional" | "friendly" | "confident";
  services: string;
  hourlyRate: number;
}

export function ProposalSectionRegenerator({
  proposal,
  section,
  onRegenerate,
  freelancerName,
  profession,
  tone,
  services,
  hourlyRate,
}: SectionRegeneratorProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRegenerate = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/proposals/regenerate-section", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          section,
          clientName: proposal.clientName,
          brief: proposal.brief,
          currentScope: proposal.scope,
          currentTimeline: proposal.timeline,
          currentBudget: proposal.budget,
          currentTerms: proposal.terms,
          freelancerName,
          profession,
          tone,
          services,
          hourlyRate,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || "Failed to regenerate section"
        );
      }

      const data = await response.json();
      onRegenerate?.(data);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "An error occurred";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const sectionLabels: Record<ProposalSection, string> = {
    scope: "Deliverables",
    timeline: "Timeline",
    pricing: "Pricing",
    terms: "Terms",
  };

  return (
    <div>
      <button
        onClick={handleRegenerate}
        disabled={isLoading}
        className="flex items-center gap-2 px-3 py-1 text-sm bg-slate-100 text-slate-900 rounded hover:bg-slate-200 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        title={`Regenerate ${sectionLabels[section]} section`}
      >
        {isLoading ? (
          <>
            <Loader size={14} className="animate-spin" />
            Regenerating...
          </>
        ) : (
          <>
            <RotateCw size={14} />
            Regenerate
          </>
        )}
      </button>
      {error && (
        <p className="text-xs text-red-600 mt-2">Error: {error}</p>
      )}
    </div>
  );
}
