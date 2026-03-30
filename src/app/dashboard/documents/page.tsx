"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { formatDate, getStatusColor } from "@/lib/utils";
import {
  Plus,
  FileText,
  Receipt,
  FileSignature,
  ClipboardList,
  BookOpen,
  Search,
  Filter,
} from "lucide-react";
import type { Document } from "@/lib/documents/types";

const TYPE_CONFIG: Record<
  string,
  { label: string; icon: typeof FileText; color: string }
> = {
  proposal: { label: "Proposal", icon: FileText, color: "text-blue-600 bg-blue-50" },
  invoice: { label: "Invoice", icon: Receipt, color: "text-green-600 bg-green-50" },
  contract: { label: "Contract", icon: FileSignature, color: "text-purple-600 bg-purple-50" },
  sow: { label: "SOW", icon: ClipboardList, color: "text-orange-600 bg-orange-50" },
  prd: { label: "PRD", icon: BookOpen, color: "text-red-600 bg-red-50" },
  brief: { label: "Brief", icon: FileText, color: "text-teal-600 bg-teal-50" },
  change_order: { label: "Change Order", icon: FileText, color: "text-amber-600 bg-amber-50" },
  project_plan: { label: "Project Plan", icon: ClipboardList, color: "text-indigo-600 bg-indigo-50" },
  meeting_notes: { label: "Meeting Notes", icon: FileText, color: "text-gray-600 bg-gray-50" },
  report: { label: "Report", icon: FileText, color: "text-cyan-600 bg-cyan-50" },
};

type FilterType = "all" | string;
type FilterStatus = "all" | string;

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<FilterType>("all");
  const [statusFilter, setStatusFilter] = useState<FilterStatus>("all");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchDocuments();
  }, [typeFilter, statusFilter]);

  async function fetchDocuments() {
    setLoading(true);
    const params = new URLSearchParams();
    if (typeFilter !== "all") params.set("type", typeFilter);
    if (statusFilter !== "all") params.set("status", statusFilter);
    params.set("limit", "100");

    try {
      const res = await fetch(`/api/documents?${params}`);
      if (res.ok) {
        const data = await res.json();
        setDocuments(data.documents || []);
      }
    } catch (err) {
      console.error("Failed to fetch documents:", err);
    } finally {
      setLoading(false);
    }
  }

  const filtered = searchQuery
    ? documents.filter(
        (d) =>
          d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          d.type.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : documents;

  const typeFilters = [
    { label: "All", value: "all" },
    { label: "Proposals", value: "proposal" },
    { label: "Invoices", value: "invoice" },
    { label: "SOWs", value: "sow" },
    { label: "Contracts", value: "contract" },
    { label: "PRDs", value: "prd" },
    { label: "Briefs", value: "brief" },
  ];

  const statusFilters = [
    { label: "All", value: "all" },
    { label: "Draft", value: "draft" },
    { label: "Sent", value: "sent" },
    { label: "Approved", value: "approved" },
    { label: "Completed", value: "completed" },
    { label: "Paid", value: "paid" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-slate-900">Documents</h1>
            <p className="text-slate-500 mt-1">
              {documents.length} document{documents.length !== 1 ? "s" : ""}
            </p>
          </div>
          <Link
            href="/dashboard/documents/new"
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            <Plus size={20} />
            New Document
          </Link>
        </div>

        {/* Search + Filters */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search documents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            {/* Type filter pills */}
            <div className="flex gap-1.5 flex-wrap">
              {typeFilters.map((f) => (
                <button
                  key={f.value}
                  onClick={() => setTypeFilter(f.value)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
                    typeFilter === f.value
                      ? "bg-indigo-600 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Status filter */}
          <div className="flex gap-1.5 mt-3 flex-wrap">
            <Filter className="w-4 h-4 text-slate-400 mt-1" />
            {statusFilters.map((f) => (
              <button
                key={f.value}
                onClick={() => setStatusFilter(f.value)}
                className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                  statusFilter === f.value
                    ? "bg-slate-800 text-white"
                    : "bg-slate-50 text-slate-500 hover:bg-slate-100"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Document List */}
        {loading ? (
          <div className="text-center py-20 text-slate-400">Loading documents...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-600 mb-2">No documents yet</h3>
            <p className="text-slate-400 mb-6">
              Create your first document to get started.
            </p>
            <Link
              href="/dashboard/documents/new"
              className="inline-flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
            >
              <Plus size={18} />
              Create Document
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Document</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Type</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Version</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Updated</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((doc) => {
                  const config = TYPE_CONFIG[doc.type] || TYPE_CONFIG.proposal;
                  const Icon = config.icon;
                  return (
                    <tr
                      key={doc.id}
                      className="border-b border-slate-50 hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      <td className="px-6 py-4">
                        <Link
                          href={`/dashboard/documents/${doc.id}`}
                          className="flex items-center gap-3"
                        >
                          <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${config.color}`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="font-medium text-slate-900">{doc.title}</div>
                            {doc.client_id && (
                              <div className="text-xs text-slate-400 mt-0.5">Client linked</div>
                            )}
                          </div>
                        </Link>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-slate-600">{config.label}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(doc.status)}`}>
                          {doc.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-slate-500">v{doc.version}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-slate-500">{formatDate(doc.updated_at)}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
