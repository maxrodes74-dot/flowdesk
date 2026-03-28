"use client";

import { useState } from "react";
import Link from "next/link";
import { useApp } from "@/lib/store";
import { formatDate, formatCurrency, getStatusColor } from "@/lib/utils";
import { Sparkles, FileText } from "lucide-react";

type FilterStatus = "all" | "draft" | "sent" | "viewed" | "approved" | "declined";

export default function ProposalsPage() {
  const { state } = useApp();
  const [activeFilter, setActiveFilter] = useState<FilterStatus>("all");

  const filteredProposals =
    activeFilter === "all"
      ? state.proposals
      : state.proposals.filter((p) => p.status === activeFilter);

  const filters: { label: string; value: FilterStatus }[] = [
    { label: "All", value: "all" },
    { label: "Draft", value: "draft" },
    { label: "Sent", value: "sent" },
    { label: "Approved", value: "approved" },
    { label: "Declined", value: "declined" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold text-slate-900">Proposals</h1>
          <Link
            href="/dashboard/proposals/new"
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            <Sparkles size={20} />
            New Proposal
          </Link>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-8 border-b border-slate-300">
          {filters.map((filter) => (
            <button
              key={filter.value}
              onClick={() => setActiveFilter(filter.value)}
              className={`px-4 py-3 font-medium transition-all border-b-2 ${
                activeFilter === filter.value
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-slate-600 hover:text-slate-900"
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {/* Proposals List */}
        {filteredProposals.length === 0 ? (
          <div className="text-center py-12">
            <FileText size={48} className="mx-auto mb-4 text-slate-300" />
            <p className="text-slate-600 text-lg">No proposals yet</p>
            <p className="text-slate-500 text-sm">
              Create your first proposal to get started
            </p>
          </div>
        ) : (
          <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {filteredProposals.map((proposal) => (
              <Link
                key={proposal.id}
                href={`/dashboard/proposals/${proposal.id}`}
                className="block bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6 border border-slate-200 hover:border-blue-300"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-bold text-lg text-slate-900 line-clamp-2">
                      {proposal.title}
                    </h3>
                    <p className="text-sm text-slate-600 mt-1">
                      {proposal.clientName}
                    </p>
                  </div>
                  {proposal.aiGenerated && (
                    <div className="ml-2 flex-shrink-0">
                      <Sparkles
                        size={16}
                        className="text-yellow-500"
                        aria-label="AI Generated"
                      />
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between mb-4">
                  <span
                    className={`text-xs font-semibold px-3 py-1 rounded-full ${getStatusColor(
                      proposal.status
                    )}`}
                  >
                    {proposal.status.charAt(0).toUpperCase() +
                      proposal.status.slice(1)}
                  </span>
                  {proposal.aiGenerated && (
                    <span className="text-xs bg-yellow-50 text-yellow-700 px-2 py-1 rounded">
                      AI Generated
                    </span>
                  )}
                </div>

                <div className="space-y-2 text-sm text-slate-600">
                  <div className="flex justify-between">
                    <span>Created:</span>
                    <span className="font-medium">
                      {formatDate(proposal.createdAt)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Price:</span>
                    <span className="font-medium">
                      {formatCurrency(proposal.totalPrice)}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
