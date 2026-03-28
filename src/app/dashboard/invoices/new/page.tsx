"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/lib/store";
import { createClient } from "@/lib/supabase/client";
import { rowToInvoice } from "@/lib/supabase/data";
import type { Json } from "@/lib/supabase/types";
import { formatCurrency } from "@/lib/utils";
import { Plus, Trash2, Send, Save } from "lucide-react";

interface LineItem {
  description: string;
  quantity: number;
  rate: number;
}

const PAYMENT_TERMS = [
  { label: "Due on Receipt", value: "due_on_receipt", days: 0 },
  { label: "Net 15", value: "net_15", days: 15 },
  { label: "Net 30", value: "net_30", days: 30 },
];

export default function NewInvoicePage() {
  const router = useRouter();
  const { state, dispatch } = useApp();

  const [clientId, setClientId] = useState(state.clients[0]?.id || "");
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { description: "", quantity: 1, rate: 0 },
  ]);
  const [paymentTerms, setPaymentTerms] = useState("net_30");
  const [dueDate, setDueDate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedClient = state.clients.find((c) => c.id === clientId);

  // Auto-calculate due date based on payment terms
  const calculateDueDate = (terms: string) => {
    const today = new Date();
    const termDays =
      PAYMENT_TERMS.find((t) => t.value === terms)?.days || 30;
    const dueDay = new Date(today.getTime() + termDays * 86400000);
    return dueDay.toISOString().split("T")[0];
  };

  const handlePaymentTermsChange = (newTerms: string) => {
    setPaymentTerms(newTerms);
    setDueDate(calculateDueDate(newTerms));
  };

  // Calculate totals
  const subtotal = useMemo(
    () => lineItems.reduce((sum, item) => sum + item.quantity * item.rate, 0),
    [lineItems]
  );

  const updateLineItem = (
    index: number,
    field: keyof LineItem,
    value: string | number
  ) => {
    const updated = [...lineItems];
    updated[index] = { ...updated[index], [field]: value };
    setLineItems(updated);
  };

  const addLineItem = () => {
    setLineItems([...lineItems, { description: "", quantity: 1, rate: 0 }]);
  };

  const removeLineItem = (index: number) => {
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  const saveInvoice = async (status: "draft" | "sent") => {
    if (!clientId || lineItems.every((item) => !item.description)) {
      alert("Please select a client and add at least one line item");
      return;
    }
    if (!state.freelancer) return;

    setIsSubmitting(true);

    const supabase = createClient();
    const finalDueDate = dueDate || calculateDueDate(paymentTerms);

    const { data: invoiceRow, error } = await supabase
      .from("invoices")
      .insert({
        freelancer_id: state.freelancer.id,
        client_id: clientId,
        line_items: lineItems as unknown as Json,
        total: subtotal,
        status,
        due_date: finalDueDate,
        payment_terms: paymentTerms,
      })
      .select()
      .single();

    if (error || !invoiceRow) {
      alert("Failed to save invoice: " + error?.message);
      setIsSubmitting(false);
      return;
    }

    const invoice = rowToInvoice(invoiceRow, selectedClient?.name || "");
    dispatch({ type: "ADD_INVOICE", payload: invoice });
    setIsSubmitting(false);
    router.push("/dashboard/invoices");
  };

  const handleSaveAsDraft = () => saveInvoice("draft");
  const handleSendInvoice = () => saveInvoice("sent");

  // Initialize due date on component mount
  if (!dueDate) {
    setDueDate(calculateDueDate(paymentTerms));
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Create Invoice</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form Section */}
          <div className="lg:col-span-2 space-y-6">
            {/* Client Selection */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Client
              </label>
              <select
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a client...</option>
                {state.clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name} ({client.company})
                  </option>
                ))}
              </select>
            </div>

            {/* Line Items */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Line Items
              </h2>

              <div className="space-y-4">
                {lineItems.map((item, index) => (
                  <div key={index} className="flex gap-4 items-end">
                    <div className="flex-1">
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Description
                      </label>
                      <input
                        type="text"
                        value={item.description}
                        onChange={(e) =>
                          updateLineItem(index, "description", e.target.value)
                        }
                        placeholder="e.g., Web Design - 40 hours"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div className="w-24">
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Qty
                      </label>
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) =>
                          updateLineItem(
                            index,
                            "quantity",
                            parseFloat(e.target.value) || 0
                          )
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div className="w-32">
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Rate
                      </label>
                      <div className="flex items-center">
                        <span className="text-gray-500 mr-2">$</span>
                        <input
                          type="number"
                          value={item.rate}
                          onChange={(e) =>
                            updateLineItem(
                              index,
                              "rate",
                              parseFloat(e.target.value) || 0
                            )
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    <div className="w-24">
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Subtotal
                      </label>
                      <p className="text-sm font-semibold text-gray-900">
                        {formatCurrency(item.quantity * item.rate)}
                      </p>
                    </div>

                    <button
                      onClick={() => removeLineItem(index)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
              </div>

              <button
                onClick={addLineItem}
                className="mt-6 flex items-center gap-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors font-medium text-sm"
              >
                <Plus size={18} />
                Add Line Item
              </button>
            </div>

            {/* Payment Terms & Due Date */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Payment Terms
                </label>
                <select
                  value={paymentTerms}
                  onChange={(e) => handlePaymentTermsChange(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {PAYMENT_TERMS.map((term) => (
                    <option key={term.value} value={term.value}>
                      {term.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Due Date
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Preview Section */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg border border-gray-200 p-6 sticky top-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">
                Invoice Preview
              </h2>

              <div className="space-y-6 border-b border-gray-200 pb-6">
                <div>
                  <p className="text-xs uppercase tracking-widest font-bold text-gray-500">
                    Invoice
                  </p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {`INV-${String(state.invoices.length + 1).padStart(3, "0")}`}
                  </p>
                </div>

                {state.freelancer && (
                  <div>
                    <p className="text-xs uppercase tracking-widest font-bold text-gray-500">
                      From
                    </p>
                    <p className="font-semibold text-gray-900 mt-1">
                      {state.freelancer.name}
                    </p>
                    <p className="text-sm text-gray-600">{state.freelancer.email}</p>
                  </div>
                )}

                {selectedClient && (
                  <div>
                    <p className="text-xs uppercase tracking-widest font-bold text-gray-500">
                      To
                    </p>
                    <p className="font-semibold text-gray-900 mt-1">
                      {selectedClient.name}
                    </p>
                    <p className="text-sm text-gray-600">{selectedClient.company}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Invoice Date</p>
                    <p className="font-semibold text-gray-900">
                      {new Date().toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Due Date</p>
                    <p className="font-semibold text-gray-900">
                      {dueDate
                        ? new Date(dueDate).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })
                        : "TBD"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Line Items Preview */}
              <div className="py-6 border-b border-gray-200">
                <p className="text-xs uppercase tracking-widest font-bold text-gray-500 mb-4">
                  Items
                </p>
                <div className="space-y-3">
                  {lineItems
                    .filter((item) => item.description)
                    .map((item, index) => (
                      <div
                        key={index}
                        className="flex justify-between text-sm gap-2"
                      >
                        <div className="flex-1">
                          <p className="text-gray-900 font-medium text-xs leading-tight">
                            {item.description}
                          </p>
                          <p className="text-gray-600 text-xs">
                            {item.quantity} × {formatCurrency(item.rate)}
                          </p>
                        </div>
                        <p className="font-semibold text-gray-900 whitespace-nowrap">
                          {formatCurrency(item.quantity * item.rate)}
                        </p>
                      </div>
                    ))}
                </div>
              </div>

              {/* Total */}
              <div className="py-6 border-b border-gray-200">
                <div className="flex justify-between items-baseline">
                  <p className="text-gray-600 font-medium">Total</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {formatCurrency(subtotal)}
                  </p>
                </div>
              </div>

              {/* Payment Terms Display */}
              <div className="py-6">
                <p className="text-xs uppercase tracking-widest font-bold text-gray-500 mb-2">
                  Payment Terms
                </p>
                <p className="text-sm text-gray-900">
                  {
                    PAYMENT_TERMS.find((t) => t.value === paymentTerms)
                      ?.label
                  }
                </p>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3 pt-6 border-t border-gray-200">
                <button
                  onClick={handleSaveAsDraft}
                  disabled={isSubmitting}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50"
                >
                  <Save size={18} />
                  Save as Draft
                </button>
                <button
                  onClick={handleSendInvoice}
                  disabled={isSubmitting}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
                >
                  <Send size={18} />
                  Send Invoice
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
