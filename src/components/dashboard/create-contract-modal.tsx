"use client";

import { useState, useMemo } from "react";
import { useApp } from "@/lib/store";
import { generateId } from "@/lib/utils";
import {
  CLAUSE_CATEGORIES,
  ALL_CLAUSES,
} from "@/lib/contract-clauses";
import { X } from "lucide-react";

interface CreateContractModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateContractModal({
  isOpen,
  onClose,
}: CreateContractModalProps) {
  const { state, dispatch } = useApp();
  const [proposalId, setProposalId] = useState("");
  const [selectedClauses, setSelectedClauses] = useState<Set<string>>(
    new Set()
  );
  const [isLoading, setIsLoading] = useState(false);

  const approvedProposals = useMemo(() => {
    return state.proposals.filter((p) => p.status === "approved");
  }, [state.proposals]);

  const toggleClause = (clauseId: string) => {
    const newSet = new Set(selectedClauses);
    if (newSet.has(clauseId)) {
      newSet.delete(clauseId);
    } else {
      newSet.add(clauseId);
    }
    setSelectedClauses(newSet);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!proposalId || selectedClauses.size === 0) return;

    setIsLoading(true);
    try {
      const clauses = Array.from(selectedClauses)
        .map((id) => ALL_CLAUSES.find((c) => c.id === id))
        .filter(Boolean) as typeof ALL_CLAUSES;

      const contract = {
        id: `contract_${generateId()}`,
        proposalId,
        clauses,
        signatureName: null,
        signatureIp: null,
        signedAt: null,
        createdAt: new Date().toISOString(),
      };

      dispatch({
        type: "ADD_CONTRACT",
        payload: contract,
      });

      setProposalId("");
      setSelectedClauses(new Set());
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white">
          <h2 className="text-lg font-semibold text-gray-900">
            Create Contract
          </h2>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 rounded-lg"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Select Proposal
            </label>
            <select
              value={proposalId}
              onChange={(e) => setProposalId(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Choose an approved proposal</option>
              {approvedProposals.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title} - {p.clientName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-4">
              Select Contract Clauses
            </h3>
            <div className="space-y-4">
              {Object.entries(CLAUSE_CATEGORIES).map(
                ([category, clauses]) => (
                  <div key={category}>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">
                      {category}
                    </h4>
                    <div className="space-y-2 ml-2">
                      {clauses.map((clause) => (
                        <label
                          key={clause.id}
                          className="flex items-start gap-3 cursor-pointer p-3 rounded-lg hover:bg-gray-50 border border-transparent hover:border-gray-200"
                        >
                          <input
                            type="checkbox"
                            checked={selectedClauses.has(clause.id)}
                            onChange={() => toggleClause(clause.id)}
                            className="mt-1 w-4 h-4 rounded border-gray-300 accent-blue-600"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900">
                              {clause.name}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {clause.content.substring(0, 100)}...
                            </p>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                )
              )}
            </div>

            {selectedClauses.size === 0 && (
              <p className="text-sm text-red-600 mt-4">
                Please select at least one clause
              </p>
            )}
          </div>

          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || selectedClauses.size === 0}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
            >
              {isLoading ? "Creating..." : "Create Contract"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
