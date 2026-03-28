"use client";

import React, { useState } from "react";
import { Download, Loader } from "lucide-react";
import type { Proposal } from "@/lib/types";

interface ProposalExportPdfProps {
  proposal: Proposal;
  freelancerName?: string;
  freelancerEmail?: string;
  className?: string;
}

export function ProposalExportPdf({
  proposal,
  freelancerName,
  freelancerEmail,
  className = "",
}: ProposalExportPdfProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleExport = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/proposals/export-pdf", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: proposal.title,
          clientName: proposal.clientName,
          brief: proposal.brief,
          scope: proposal.scope,
          timeline: proposal.timeline,
          budget: proposal.budget,
          totalPrice: proposal.totalPrice,
          terms: proposal.terms,
          freelancerName,
          freelancerEmail,
          createdAt: proposal.createdAt,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to generate PDF");
      }

      const data = await response.json();
      const { html, filename } = data;

      // Create a blob and download
      const blob = new Blob([html], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "An error occurred";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={className}>
      <button
        onClick={handleExport}
        disabled={isLoading}
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? (
          <>
            <Loader size={18} className="animate-spin" />
            Generating...
          </>
        ) : (
          <>
            <Download size={18} />
            Export PDF
          </>
        )}
      </button>
      {error && <p className="text-xs text-red-600 mt-2">{error}</p>}
      <p className="text-xs text-gray-600 mt-2">
        Download this proposal as an HTML file that can be printed to PDF
      </p>
    </div>
  );
}
