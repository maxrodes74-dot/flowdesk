"use client";

import { useState, useMemo } from "react";
import { useApp } from "@/lib/store";
import { generateId } from "@/lib/utils";
import { X } from "lucide-react";

interface AddMilestoneModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AddMilestoneModal({ isOpen, onClose }: AddMilestoneModalProps) {
  const { state, dispatch } = useApp();
  const [proposalId, setProposalId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const approvedProposals = useMemo(() => {
    return state.proposals.filter((p) => p.status === "approved");
  }, [state.proposals]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!proposalId || !title || !dueDate) return;

    setIsLoading(true);
    try {
      const milestone = {
        id: `milestone_${generateId()}`,
        proposalId,
        title,
        description,
        dueDate,
        status: "pending" as const,
        sortOrder: state.milestones.filter((m) => m.proposalId === proposalId)
          .length,
        invoiceId: null,
        createdAt: new Date().toISOString(),
      };

      dispatch({
        type: "ADD_MILESTONE",
        payload: milestone,
      });

      setTitle("");
      setDescription("");
      setDueDate("");
      setProposalId("");
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Add Milestone</h2>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 rounded-lg"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Proposal
            </label>
            <select
              value={proposalId}
              onChange={(e) => setProposalId(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select a proposal</option>
              {approvedProposals.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title} - {p.clientName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Design Mockups"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what needs to be done..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Due Date
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
            >
              {isLoading ? "Adding..." : "Add Milestone"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
