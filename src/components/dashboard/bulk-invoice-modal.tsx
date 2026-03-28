"use client";

import { useState, useMemo } from "react";
import { useApp } from "@/lib/store";
import { generateId, formatCurrency, formatTime } from "@/lib/utils";
import { X } from "lucide-react";

interface BulkInvoiceModalProps {
  isOpen: boolean;
  selectedEntryIds: string[];
  onClose: () => void;
}

export function BulkInvoiceModal({
  isOpen,
  selectedEntryIds,
  onClose,
}: BulkInvoiceModalProps) {
  const { state, dispatch } = useApp();
  const [isLoading, setIsLoading] = useState(false);

  const selectedEntries = useMemo(() => {
    return state.timeEntries.filter((e) =>
      selectedEntryIds.includes(e.id)
    );
  }, [state.timeEntries, selectedEntryIds]);

  const groupedByClient = useMemo(() => {
    const groups: Record<
      string,
      { entries: typeof selectedEntries; client: typeof state.clients[0] }
    > = {};

    selectedEntries.forEach((entry) => {
      if (!groups[entry.clientId]) {
        const client = state.clients.find((c) => c.id === entry.clientId);
        groups[entry.clientId] = {
          entries: [],
          client: client || { id: "", name: "Unknown", email: "", company: "", freelancerId: "", portalSlug: "", createdAt: "" },
        };
      }
      groups[entry.clientId].entries.push(entry);
    });

    return Object.values(groups);
  }, [selectedEntries, state.clients]);

  const hourlyRate = state.freelancer?.hourlyRate || 50;

  const handleCreateInvoice = async (
    clientId: string,
    entries: typeof selectedEntries
  ) => {
    const client = state.clients.find((c) => c.id === clientId);
    if (!client) return;

    setIsLoading(true);
    try {
      const lineItems = entries.map((entry) => {
        const hours = entry.durationMinutes / 60;
        return {
          description: entry.description || `Work on ${new Date(entry.date).toLocaleDateString()}`,
          quantity: 1,
          rate: hours * hourlyRate,
        };
      });

      const total = lineItems.reduce((sum, item) => sum + item.rate, 0);
      const invoiceId = `inv_${generateId()}`;

      const invoice = {
        id: invoiceId,
        freelancerId: state.freelancer?.id || "",
        clientId,
        clientName: client.name,
        lineItems,
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

      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white">
          <h2 className="text-lg font-semibold text-gray-900">
            Create Invoices from Time Entries
          </h2>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 rounded-lg"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {groupedByClient.map(({ client, entries }) => {
            const totalMinutes = entries.reduce(
              (sum, e) => sum + e.durationMinutes,
              0
            );
            const totalHours = totalMinutes / 60;
            const total = totalHours * hourlyRate;

            return (
              <div key={client.id} className="border border-gray-200 rounded-lg p-4">
                <div className="mb-4">
                  <h3 className="font-semibold text-gray-900">{client.name}</h3>
                  <p className="text-sm text-gray-600">{client.email}</p>
                </div>

                <div className="space-y-2 mb-4 bg-gray-50 p-3 rounded">
                  {entries.map((entry) => {
                    const hours = entry.durationMinutes / 60;
                    const amount = hours * hourlyRate;
                    return (
                      <div
                        key={entry.id}
                        className="flex justify-between text-sm"
                      >
                        <div>
                          <p className="text-gray-900">
                            {entry.description ||
                              new Date(entry.date).toLocaleDateString()}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatTime(entry.durationMinutes)}
                          </p>
                        </div>
                        <p className="font-medium text-gray-900">
                          {formatCurrency(amount)}
                        </p>
                      </div>
                    );
                  })}
                </div>

                <div className="flex justify-between items-center mb-4 py-2 border-t border-gray-200">
                  <div>
                    <p className="text-sm text-gray-600">Total:</p>
                    <p className="font-semibold text-gray-900">
                      {totalHours.toFixed(1)}h
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Amount:</p>
                    <p className="font-semibold text-gray-900">
                      {formatCurrency(total)}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => handleCreateInvoice(client.id, entries)}
                  disabled={isLoading}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
                >
                  {isLoading ? "Creating..." : "Create Invoice"}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
