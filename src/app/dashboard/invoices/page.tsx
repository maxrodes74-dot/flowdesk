"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useApp } from "@/lib/store";
import { formatCurrency, formatDate, getStatusColor } from "@/lib/utils";
import { Plus, Receipt, AlertTriangle, CheckCircle } from "lucide-react";

type FilterStatus = "all" | "draft" | "sent" | "paid" | "overdue";

export default function InvoicesPage() {
  const { state } = useApp();
  const [filter, setFilter] = useState<FilterStatus>("all");

  const now = new Date();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const thisMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  // Filter invoices
  const filteredInvoices = useMemo(() => {
    if (filter === "all") return state.invoices;
    return state.invoices.filter((inv) => inv.status === filter);
  }, [state.invoices, filter]);

  // Calculate summary stats
  const stats = useMemo(() => {
    const invoices = state.invoices;
    const outstanding = invoices
      .filter((inv) => inv.status !== "paid")
      .reduce((sum, inv) => sum + inv.total, 0);

    const overdue = invoices
      .filter((inv) => inv.status === "overdue")
      .reduce((sum, inv) => sum + inv.total, 0);

    const paid = invoices
      .filter((inv) => inv.status === "paid" && new Date(inv.createdAt) >= thisMonthStart && new Date(inv.createdAt) <= thisMonthEnd)
      .reduce((sum, inv) => sum + inv.total, 0);

    return { outstanding, overdue, paid };
  }, [state.invoices, thisMonthStart, thisMonthEnd]);

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Invoices</h1>
          <Link
            href="/dashboard/invoices/new"
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            <Plus size={20} />
            New Invoice
          </Link>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Total Outstanding</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">
                  {formatCurrency(stats.outstanding)}
                </p>
              </div>
              <Receipt className="text-blue-500" size={32} />
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Total Overdue</p>
                <p className="text-2xl font-bold text-red-600 mt-2">
                  {formatCurrency(stats.overdue)}
                </p>
              </div>
              <AlertTriangle className="text-red-500" size={32} />
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Total Paid (This Month)</p>
                <p className="text-2xl font-bold text-green-600 mt-2">
                  {formatCurrency(stats.paid)}
                </p>
              </div>
              <CheckCircle className="text-green-500" size={32} />
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap gap-2 mb-6 border-b border-gray-200">
          {(["all", "draft", "sent", "paid", "overdue"] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors ${
                filter === status
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>

        {/* Invoices List */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          {filteredInvoices.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-500">No invoices found</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredInvoices.map((invoice) => (
                <Link
                  key={invoice.id}
                  href={`/dashboard/invoices/${invoice.id}`}
                  className="block p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-semibold text-gray-900">
                          {invoice.id.replace("inv_", "INV-").padStart(7, "0")}
                        </span>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                            invoice.status
                          )}`}
                        >
                          {invoice.status.charAt(0).toUpperCase() +
                            invoice.status.slice(1)}
                        </span>
                      </div>
                      <p className="text-gray-600">{invoice.clientName}</p>
                    </div>

                    <div className="hidden md:flex flex-col items-end gap-1">
                      <p className="font-semibold text-gray-900">
                        {formatCurrency(invoice.total)}
                      </p>
                      <p className="text-sm text-gray-500">
                        Due {formatDate(invoice.dueDate)}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
