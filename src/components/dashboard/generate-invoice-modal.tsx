"use client";

import { useState, useMemo } from "react";
import { useApp } from "@/lib/store";
import { generateId, formatCurrency } from "@/lib/utils";
import { X } from "lucide-react";

interface GenerateInvoiceModalProps {
  isOpen: boolean;
  milestoneId: string;
  onClose: () => void;
}

export function GenerateInvoiceModal({
  isOpen,
  milestoneId,
  onClose,
}: GenerateInvoiceModalProps) {
  const { state, dispatch } = useApp();
  const [isLoading, setIsLoading] = useState(false);
  const [amount, setAmount] = useState("");

  const milestone = useMemo(
    () => state.milestones.find((m) => m.id === milestoneId),
    [state.milestones, milestoneId]
  );

  const proposal = useMemo(
    () =>
      milestone
        ? state.proposals.find((p) => p.id === milestone.proposalId)
        : null,
    [milestone, state.proposals]
  );

  const client = useMemo(
    () =>
      proposal
        ? state.clients.find((c) => c.id === proposal.clientId)
        : null,
    [proposal, state.clients]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!milestone || !proposal || !client || !amount) return;

    setIsLoading(true);
    try {
      const invoiceId = `inv_${generateId()}`;
      const total = parseFloat(amount);

      const invoice = {
        id: invoiceId,
        freelancerId: state.freelancer?.id || "",
        clientId: client.id,
        clientName: client.name,
        lineItems: [
          {
            description: `${proposal.title} - ${milestone.title}`,
            quantity: 1,
            rate: total,
          },
        ],
        total,
        status: "draft" as const,
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0],
        paidAt: null,
        paymentTerms: "Net 30",
        stripePaymentId: null,
        createdAt: new Date().toISOString(),
      };

      dispatch({
        type: "ADD_INVOICE",
        payload: invoice,
      });

      // Update milestone with invoice reference
      dispatch({
        type: "UPDATE_MILESTONE",
        payload: {
          ...milestone,
          invoiceId,
        },
      });

      setAmount("");
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen || !milestone || !proposal || !client) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Generate Invoice
          </h2>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 rounded-lg"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <div>
              <p className="text-xs text-gray-600">Milestone</p>
              <p className="font-medium text-gray-900">{milestone.title}</p>
            </div>
            <div>
              <p className="text-xs text-gray-600">Proposal</p>
              <p className="font-medium text-gray-900">{proposal.title}</p>
            </div>
            <div>
              <p className="text-xs text-gray-600">Client</p>
              <p className="font-medium text-gray-900">{client.name}</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Invoice Amount
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-gray-500">$</span>
              <input
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                required
                className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            {amount && (
              <p className="text-sm text-gray-600 mt-2">
                Total: {formatCurrency(parseFloat(amount))}
              </p>
            )}
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
              disabled={isLoading || !amount}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
            >
              {isLoading ? "Creating..." : "Create Invoice"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
