"use client";

import { useMemo } from "react";
import { useApp } from "@/lib/store";
import { useParams } from "next/navigation";
import { formatDate } from "@/lib/utils";
import Link from "next/link";
import { ArrowLeft, CheckCircle, AlertCircle } from "lucide-react";

export default function ContractDetailPage() {
  const params = useParams();
  const contractId = params.id as string;
  const { state } = useApp();

  const contractData = useMemo(() => {
    const contract = state.contracts.find((c) => c.id === contractId);
    if (!contract) return null;

    const proposal = state.proposals.find((p) => p.id === contract.proposalId);
    const client = proposal
      ? state.clients.find((c) => c.id === proposal.clientId)
      : null;

    return { contract, proposal, client };
  }, [contractId, state.contracts, state.proposals, state.clients]);

  if (!contractData) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 md:p-8">
        <div className="max-w-3xl mx-auto">
          <Link
            href="/dashboard/contracts"
            className="flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-8"
          >
            <ArrowLeft size={20} />
            Back to Contracts
          </Link>
          <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
            <p className="text-gray-600">Contract not found</p>
          </div>
        </div>
      </div>
    );
  }

  const { contract, proposal, client } = contractData;

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <Link
          href="/dashboard/contracts"
          className="flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-8"
        >
          <ArrowLeft size={20} />
          Back to Contracts
        </Link>

        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          {/* Contract Header */}
          <div className="p-8 border-b border-gray-200">
            <div className="flex items-start justify-between gap-4 mb-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {proposal?.title || "Contract"}
                </h1>
                <p className="text-gray-600 mt-2">{client?.name}</p>
              </div>

              <div className="text-right">
                {contract.signedAt ? (
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle size={24} />
                    <div>
                      <p className="font-semibold">Signed</p>
                      <p className="text-sm">
                        {formatDate(contract.signedAt)}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-amber-600">
                    <AlertCircle size={24} />
                    <div>
                      <p className="font-semibold">Pending</p>
                      <p className="text-sm">Awaiting signature</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="text-sm text-gray-600">
              <p>Created: {formatDate(contract.createdAt)}</p>
              {contract.signedAt && (
                <>
                  <p>Signed by: {contract.signatureName}</p>
                  <p>IP: {contract.signatureIp}</p>
                </>
              )}
            </div>
          </div>

          {/* Contract Content */}
          <div className="p-8 space-y-8 max-h-[calc(100vh-400px)] overflow-y-auto">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Agreement Details
              </h2>
              <div className="bg-gray-50 p-4 rounded-lg text-sm text-gray-600 space-y-3">
                <p>
                  <strong>Freelancer:</strong> {state.freelancer?.name}
                </p>
                <p>
                  <strong>Client:</strong> {client?.name} ({client?.email})
                </p>
                <p>
                  <strong>Company:</strong> {client?.company}
                </p>
                <p>
                  <strong>Project:</strong> {proposal?.title}
                </p>
                <p>
                  <strong>Budget:</strong> {proposal?.budget}
                </p>
              </div>
            </div>

            {/* Clauses */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Contract Terms
              </h2>
              <div className="space-y-6">
                {contract.clauses.map((clause, index) => (
                  <div key={clause.id} className="border-l-4 border-blue-500 pl-4">
                    <h3 className="font-semibold text-gray-900 mb-2">
                      {index + 1}. {clause.name}
                    </h3>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">
                      {clause.content}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Signature Block */}
            <div className="pt-6 border-t border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-4">
                Signature Block
              </h3>
              {contract.signedAt ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-sm text-green-800">
                    <strong>Signed:</strong> {contract.signatureName}
                  </p>
                  <p className="text-sm text-green-800">
                    <strong>Date:</strong> {formatDate(contract.signedAt)}
                  </p>
                  <p className="text-xs text-green-600 mt-2">
                    IP: {contract.signatureIp}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-gray-600">
                  Awaiting client signature via client portal
                </p>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="p-8 border-t border-gray-200 flex gap-4">
            <Link
              href="/dashboard/contracts"
              className="flex-1 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium text-center"
            >
              Back to List
            </Link>
            {!contract.signedAt && (
              <Link
                href={`/portal/${state.freelancer?.id}/${client?.portalSlug}?contract=${contract.id}`}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-center"
              >
                Send to Client
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
