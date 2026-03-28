"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useApp } from "@/lib/store";
import { formatCurrency, formatDate, getStatusColor } from "@/lib/utils";
import {
  ArrowLeft,
  Send,
  Check,
  Clock,
  AlertTriangle,
  DollarSign,
  Share2,
  Download,
} from "lucide-react";

export default function InvoiceDetailPage() {
  const params = useParams();
  const invoiceId = params.id as string;
  const { state, dispatch } = useApp();
  const [showShareModal, setShowShareModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const invoice = state.invoices.find((inv) => inv.id === invoiceId);
  const client = state.clients.find((c) => c.id === invoice?.clientId);

  if (!invoice || !client) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 md:p-8 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Invoice not found</p>
          <Link
            href="/dashboard/invoices"
            className="mt-4 text-blue-600 hover:underline"
          >
            Back to Invoices
          </Link>
        </div>
      </div>
    );
  }

  const getPaymentTermsLabel = (terms: string): string => {
    const labels: Record<string, string> = {
      due_on_receipt: "Due on Receipt",
      net_15: "Net 15",
      net_30: "Net 30",
    };
    return labels[terms] || terms;
  };

  const handleMarkAsPaid = () => {
    setIsProcessing(true);
    const updated = {
      ...invoice,
      status: "paid" as const,
      paidAt: new Date().toISOString(),
    };
    dispatch({ type: "UPDATE_INVOICE", payload: updated });
    setIsProcessing(false);
  };

  const handleSendReminder = () => {
    setIsProcessing(true);
    // In a real app, this would send an email
    setTimeout(() => {
      alert("Invoice reminder sent to " + client.email);
      setIsProcessing(false);
    }, 500);
  };

  const handleSendInvoice = () => {
    setIsProcessing(true);
    const updated = {
      ...invoice,
      status: "sent" as const,
    };
    dispatch({ type: "UPDATE_INVOICE", payload: updated });
    setIsProcessing(false);
  };

  const portalUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/portal/${client.portalSlug}`;

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Link
            href="/dashboard/invoices"
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
          >
            <ArrowLeft size={20} />
            Back
          </Link>
        </div>

        {/* Invoice Document */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-8 md:p-12">
            {/* Invoice Header */}
            <div className="flex justify-between items-start mb-12">
              <div>
                <p className="text-xs uppercase tracking-widest font-bold text-gray-500 mb-2">
                  Invoice
                </p>
                <p className="text-4xl font-bold text-gray-900">
                  {invoice.id.replace("inv_", "INV-").padStart(7, "0")}
                </p>
              </div>
              <div className="text-right">
                <span
                  className={`inline-block px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(
                    invoice.status
                  )}`}
                >
                  {invoice.status.charAt(0).toUpperCase() +
                    invoice.status.slice(1)}
                </span>
              </div>
            </div>

            {/* From/To Section */}
            <div className="grid grid-cols-2 gap-12 mb-12 pb-8 border-b border-gray-200">
              <div>
                <p className="text-xs uppercase tracking-widest font-bold text-gray-500 mb-4">
                  From
                </p>
                {state.freelancer && (
                  <div>
                    <p className="text-lg font-semibold text-gray-900">
                      {state.freelancer.name}
                    </p>
                    <p className="text-gray-600">{state.freelancer.email}</p>
                  </div>
                )}
              </div>

              <div>
                <p className="text-xs uppercase tracking-widest font-bold text-gray-500 mb-4">
                  Bill To
                </p>
                <div>
                  <p className="text-lg font-semibold text-gray-900">
                    {client.name}
                  </p>
                  <p className="text-gray-600">{client.company}</p>
                  <p className="text-gray-600">{client.email}</p>
                </div>
              </div>
            </div>

            {/* Invoice Dates */}
            <div className="grid grid-cols-3 gap-8 mb-12 pb-8 border-b border-gray-200">
              <div>
                <p className="text-sm text-gray-600 mb-1">Invoice Date</p>
                <p className="text-lg font-semibold text-gray-900">
                  {formatDate(invoice.createdAt)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Due Date</p>
                <p className="text-lg font-semibold text-gray-900">
                  {formatDate(invoice.dueDate)}
                </p>
              </div>
              {invoice.paidAt && (
                <div>
                  <p className="text-sm text-gray-600 mb-1">Paid Date</p>
                  <p className="text-lg font-semibold text-green-600">
                    {formatDate(invoice.paidAt)}
                  </p>
                </div>
              )}
            </div>

            {/* Line Items Table */}
            <div className="mb-12">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-gray-900">
                    <th className="text-left text-xs uppercase tracking-widest font-bold text-gray-900 pb-3">
                      Description
                    </th>
                    <th className="text-right text-xs uppercase tracking-widest font-bold text-gray-900 pb-3 w-20">
                      Qty
                    </th>
                    <th className="text-right text-xs uppercase tracking-widest font-bold text-gray-900 pb-3 w-24">
                      Rate
                    </th>
                    <th className="text-right text-xs uppercase tracking-widest font-bold text-gray-900 pb-3 w-28">
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.lineItems.map((item, index) => (
                    <tr key={index} className="border-b border-gray-200">
                      <td className="py-4 text-gray-900">{item.description}</td>
                      <td className="py-4 text-right text-gray-900">
                        {item.quantity}
                      </td>
                      <td className="py-4 text-right text-gray-900">
                        {formatCurrency(item.rate)}
                      </td>
                      <td className="py-4 text-right font-semibold text-gray-900">
                        {formatCurrency(item.quantity * item.rate)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="flex justify-end mb-12">
              <div className="w-full md:w-80">
                <div className="border-t-2 border-gray-900 pt-4">
                  <div className="flex justify-between items-center">
                    <p className="text-xl font-bold text-gray-900">Total</p>
                    <p className="text-4xl font-bold text-gray-900">
                      {formatCurrency(invoice.total)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Terms */}
            <div className="mb-8 pb-8 border-b border-gray-200">
              <p className="text-sm text-gray-600 mb-2">Payment Terms</p>
              <p className="text-gray-900 font-medium">
                {getPaymentTermsLabel(invoice.paymentTerms)}
              </p>
            </div>

            {/* Notes */}
            <div>
              <p className="text-xs uppercase tracking-widest font-bold text-gray-500 mb-2">
                Notes
              </p>
              <p className="text-gray-700">
                Thank you for your business! Please remit payment by the due
                date. If you have any questions, feel free to reach out.
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-wrap gap-3">
          {invoice.status === "draft" && (
            <>
              <button
                onClick={handleSendInvoice}
                disabled={isProcessing}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
              >
                <Send size={18} />
                Send Invoice
              </button>
            </>
          )}

          {invoice.status === "sent" && (
            <>
              <button
                onClick={handleMarkAsPaid}
                disabled={isProcessing}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50"
              >
                <Check size={18} />
                Mark as Paid
              </button>
              <button
                onClick={handleSendReminder}
                disabled={isProcessing}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50"
              >
                <Clock size={18} />
                Send Reminder
              </button>
            </>
          )}

          {invoice.status === "overdue" && (
            <>
              <button
                onClick={handleSendReminder}
                disabled={isProcessing}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50"
              >
                <AlertTriangle size={18} />
                Send Reminder
              </button>
              <button
                onClick={handleMarkAsPaid}
                disabled={isProcessing}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50"
              >
                <Check size={18} />
                Mark as Paid
              </button>
            </>
          )}

          {invoice.status === "paid" && (
            <button
              disabled
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-500 rounded-lg bg-gray-50 font-medium cursor-not-allowed"
            >
              <Download size={18} />
              Download Receipt
            </button>
          )}

          <button
            onClick={() => setShowShareModal(!showShareModal)}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium ml-auto"
          >
            <Share2 size={18} />
            Share Link
          </button>
        </div>

        {/* Share Modal */}
        {showShareModal && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-gray-700 mb-3">
              Share this invoice link with your client:
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={portalUrl}
                readOnly
                className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm"
              />
              <button
                onClick={() => {
                  navigator.clipboard.writeText(portalUrl);
                  alert("Link copied to clipboard!");
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
              >
                Copy
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
