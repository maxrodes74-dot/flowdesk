"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useApp } from "@/lib/store";
import { formatDate } from "@/lib/utils";
import { Plus, FileSignature, CheckCircle, AlertCircle } from "lucide-react";
import { CreateContractModal } from "@/components/dashboard/create-contract-modal";

export default function ContractsPage() {
  const { state } = useApp();
  const [showCreateModal, setShowCreateModal] = useState(false);

  const contracts = useMemo(() => {
    return state.contracts.map((contract) => {
      const proposal = state.proposals.find((p) => p.id === contract.proposalId);
      const client = proposal
        ? state.clients.find((c) => c.id === proposal.clientId)
        : null;

      return {
        contract,
        proposal,
        client,
      };
    });
  }, [state.contracts, state.proposals, state.clients]);

  const signedContracts = contracts.filter((c) => c.contract.signedAt);
  const pendingContracts = contracts.filter((c) => !c.contract.signedAt);

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Contracts</h1>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            <Plus size={20} />
            New Contract
          </button>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">
                  Pending Signature
                </p>
                <p className="text-2xl font-bold text-gray-900 mt-2">
                  {pendingContracts.length}
                </p>
              </div>
              <AlertCircle className="text-amber-500" size={32} />
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Signed</p>
                <p className="text-2xl font-bold text-green-600 mt-2">
                  {signedContracts.length}
                </p>
              </div>
              <CheckCircle className="text-green-500" size={32} />
            </div>
          </div>
        </div>

        {/* Contracts List */}
        {contracts.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <FileSignature size={48} className="mx-auto text-gray-400 mb-4" />
            <h2 className="text-lg font-semibold text-gray-900">
              No contracts yet
            </h2>
            <p className="text-gray-600 mt-2">
              Create contracts from approved proposals
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-block mt-4 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create Your First Contract
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Pending Contracts */}
            {pendingContracts.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Awaiting Signature
                </h2>
                <div className="space-y-3">
                  {pendingContracts.map(({ contract, proposal, client }) => (
                    <div
                      key={contract.id}
                      className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <Link
                            href={`/dashboard/contracts/${contract.id}`}
                            className="font-semibold text-gray-900 hover:text-blue-600 transition-colors"
                          >
                            {proposal?.title || "Contract"}
                          </Link>
                          <p className="text-sm text-gray-600 mt-1">
                            {client?.name || "Unknown Client"}
                          </p>
                          <p className="text-xs text-gray-500 mt-2">
                            Created {formatDate(contract.createdAt)}
                          </p>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="px-3 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                            Pending
                          </span>
                          <Link
                            href={`/portal/${state.freelancer?.id}/${client?.portalSlug}?contract=${contract.id}`}
                            className="px-3 py-1 text-sm text-blue-600 hover:text-blue-800 font-medium"
                          >
                            View
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Signed Contracts */}
            {signedContracts.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Signed Contracts
                </h2>
                <div className="space-y-3">
                  {signedContracts.map(({ contract, proposal, client }) => (
                    <div
                      key={contract.id}
                      className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <Link
                            href={`/dashboard/contracts/${contract.id}`}
                            className="font-semibold text-gray-900 hover:text-blue-600 transition-colors"
                          >
                            {proposal?.title || "Contract"}
                          </Link>
                          <p className="text-sm text-gray-600 mt-1">
                            {client?.name || "Unknown Client"}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <p className="text-xs text-gray-500">
                              Signed by {contract.signatureName}
                            </p>
                            <p className="text-xs text-gray-500">
                              on {formatDate(contract.signedAt || "")}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                            Signed
                          </span>
                          <Link
                            href={`/dashboard/contracts/${contract.id}`}
                            className="px-3 py-1 text-sm text-blue-600 hover:text-blue-800 font-medium"
                          >
                            View
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      <CreateContractModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />
    </div>
  );
}
