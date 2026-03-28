"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useApp } from "@/lib/store";
import { formatDate, getStatusColor } from "@/lib/utils";
import {
  Plus,
  CheckSquare,
  ChevronDown,
  ChevronUp,
  Zap,
} from "lucide-react";
import { AddMilestoneModal } from "@/components/dashboard/add-milestone-modal";
import { EditMilestoneModal } from "@/components/dashboard/edit-milestone-modal";
import { GenerateInvoiceModal } from "@/components/dashboard/generate-invoice-modal";

export default function MilestonesPage() {
  const { state } = useApp();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState<string | null>(null);
  const [invoiceForMilestone, setInvoiceForMilestone] = useState<string | null>(
    null
  );

  // Group milestones by proposal
  const milestonesByProposal = useMemo(() => {
    const grouped: Record<
      string,
      {
        proposal: typeof state.proposals[0];
        milestones: typeof state.milestones;
        client: typeof state.clients[0];
      }
    > = {};

    state.milestones.forEach((milestone) => {
      const proposal = state.proposals.find((p) => p.id === milestone.proposalId);
      if (!proposal) return;

      if (!grouped[proposal.id]) {
        const client = state.clients.find((c) => c.id === proposal.clientId);
        grouped[proposal.id] = {
          proposal,
          milestones: [],
          client: client || { id: "", name: "Unknown", email: "", company: "", freelancerId: "", portalSlug: "", createdAt: "" },
        };
      }
      grouped[proposal.id].milestones.push(milestone);
    });

    return Object.values(grouped);
  }, [state.milestones, state.proposals, state.clients]);

  // Calculate progress per proposal
  const getProgressPercentage = (milestones: typeof state.milestones): number => {
    if (milestones.length === 0) return 0;
    const completed = milestones.filter(
      (m) => m.status === "completed"
    ).length;
    return Math.round((completed / milestones.length) * 100);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Milestones</h1>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            <Plus size={20} />
            New Milestone
          </button>
        </div>

        {/* Projects with Milestones */}
        {milestonesByProposal.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <CheckSquare size={48} className="mx-auto text-gray-400 mb-4" />
            <h2 className="text-lg font-semibold text-gray-900">
              No milestones yet
            </h2>
            <p className="text-gray-600 mt-2">
              Create milestones to track project progress
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-block mt-4 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create Your First Milestone
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {milestonesByProposal.map(
              ({ proposal, milestones, client }) => {
                const progress = getProgressPercentage(milestones);
                const sortedMilestones = milestones.sort(
                  (a, b) => a.sortOrder - b.sortOrder
                );

                return (
                  <div
                    key={proposal.id}
                    className="bg-white rounded-lg border border-gray-200 overflow-hidden"
                  >
                    {/* Project Header */}
                    <div className="p-6 border-b border-gray-200">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <Link
                            href={`/dashboard/proposals/${proposal.id}`}
                            className="text-lg font-semibold text-gray-900 hover:text-blue-600 transition-colors"
                          >
                            {proposal.title}
                          </Link>
                          <p className="text-sm text-gray-600 mt-1">
                            {client.name}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-gray-900">
                            {progress}%
                          </p>
                          <p className="text-xs text-gray-500">Complete</p>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="mt-4 w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-blue-600 h-full transition-all duration-300"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>

                    {/* Milestones List */}
                    <div className="divide-y divide-gray-200">
                      {sortedMilestones.map((milestone, index) => (
                        <div
                          key={milestone.id}
                          className="p-4 hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-3 mb-2">
                                <h3 className="font-semibold text-gray-900">
                                  {milestone.title}
                                </h3>
                                <span
                                  className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                                    milestone.status
                                  )}`}
                                >
                                  {milestone.status
                                    .replace(/_/g, " ")
                                    .charAt(0)
                                    .toUpperCase() +
                                    milestone.status
                                      .replace(/_/g, " ")
                                      .slice(1)}
                                </span>
                              </div>
                              <p className="text-sm text-gray-600">
                                {milestone.description}
                              </p>
                              <p className="text-xs text-gray-500 mt-2">
                                Due {formatDate(milestone.dueDate)}
                              </p>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-2">
                              {milestone.status === "completed" &&
                                !milestone.invoiceId && (
                                  <button
                                    onClick={() =>
                                      setInvoiceForMilestone(milestone.id)
                                    }
                                    className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                                    title="Generate invoice"
                                  >
                                    <Zap size={18} />
                                  </button>
                                )}
                              <button
                                onClick={() =>
                                  setEditingMilestone(milestone.id)
                                }
                                className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded transition-colors"
                              >
                                Edit
                              </button>
                              {index > 0 && (
                                <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg transition-colors">
                                  <ChevronUp size={18} />
                                </button>
                              )}
                              {index < sortedMilestones.length - 1 && (
                                <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg transition-colors">
                                  <ChevronDown size={18} />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              }
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      <AddMilestoneModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
      />
      {editingMilestone && (
        <EditMilestoneModal
          isOpen={true}
          milestoneId={editingMilestone}
          onClose={() => setEditingMilestone(null)}
        />
      )}
      {invoiceForMilestone && (
        <GenerateInvoiceModal
          isOpen={true}
          milestoneId={invoiceForMilestone}
          onClose={() => setInvoiceForMilestone(null)}
        />
      )}
    </div>
  );
}
