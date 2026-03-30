"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { formatDate, getStatusColor, formatCurrency } from "@/lib/utils";
import {
  ArrowLeft,
  Send,
  Download,
  Trash2,
  Clock,
  GitBranch,
  FileText,
} from "lucide-react";
import type { Document, DocumentVersion } from "@/lib/documents/types";

interface DocumentDetail {
  document: Document;
  versions: Pick<DocumentVersion, "id" | "version" | "created_by" | "created_at">[];
  lineage: {
    parent: { id: string; type: string; title: string; status: string } | null;
    children: { id: string; type: string; title: string; status: string; created_at: string }[];
  };
}

export default function DocumentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [data, setData] = useState<DocumentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    fetchDocument();
  }, [params.id]);

  async function fetchDocument() {
    setLoading(true);
    try {
      const res = await fetch(`/api/documents/${params.id}`);
      if (res.ok) {
        setData(await res.json());
      }
    } catch (err) {
      console.error("Failed to fetch document:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSend() {
    setSending(true);
    try {
      await fetch(`/api/documents/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "sent" }),
      });
      await fetchDocument();
    } finally {
      setSending(false);
    }
  }

  async function handleExport() {
    setExporting(true);
    try {
      const res = await fetch(`/api/documents/${params.id}/export`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ format: "pdf" }),
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${data?.document.title || "document"}.${res.headers.get("Content-Type")?.includes("pdf") ? "pdf" : "html"}`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } finally {
      setExporting(false);
    }
  }

  async function handleArchive() {
    if (!confirm("Archive this document?")) return;
    await fetch(`/api/documents/${params.id}`, { method: "DELETE" });
    router.push("/dashboard/documents");
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8 flex items-center justify-center">
        <div className="text-slate-400">Loading document...</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8 flex items-center justify-center">
        <div className="text-slate-400">Document not found</div>
      </div>
    );
  }

  const { document: doc, versions, lineage } = data;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      <div className="max-w-5xl mx-auto">
        {/* Back link */}
        <Link
          href="/dashboard/documents"
          className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-indigo-600 transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Documents
        </Link>

        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold text-slate-900">{doc.title}</h1>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(doc.status)}`}>
                  {doc.status}
                </span>
              </div>
              <div className="flex items-center gap-4 text-sm text-slate-500">
                <span className="capitalize">{doc.type.replace(/_/g, " ")}</span>
                <span>v{doc.version}</span>
                <span>Created {formatDate(doc.created_at)}</span>
                {doc.ai_generated && (
                  <span className="text-indigo-600 font-medium">AI generated</span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleExport}
                disabled={exporting}
                className="px-4 py-2 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors text-sm font-medium flex items-center gap-1.5"
              >
                <Download className="w-4 h-4" />
                {exporting ? "Exporting..." : "Export PDF"}
              </button>
              {doc.status === "draft" && (
                <button
                  onClick={handleSend}
                  disabled={sending}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium flex items-center gap-1.5"
                >
                  <Send className="w-4 h-4" />
                  {sending ? "Sending..." : "Send to Client"}
                </button>
              )}
              <button
                onClick={handleArchive}
                className="px-3 py-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6">
          {/* Content (2/3 width) */}
          <div className="col-span-2 bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Content</h2>
            <div className="prose prose-sm max-w-none">
              {Object.entries(doc.content).map(([key, value]) => (
                <div key={key} className="mb-4">
                  <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    {key.replace(/_/g, " ")}
                  </h3>
                  {typeof value === "string" ? (
                    <p className="text-slate-600 whitespace-pre-wrap">{value}</p>
                  ) : Array.isArray(value) ? (
                    <ul className="list-disc pl-5 text-slate-600">
                      {value.map((item, i) => (
                        <li key={i}>
                          {typeof item === "string" ? item : JSON.stringify(item)}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <pre className="bg-slate-50 rounded-lg p-3 text-xs overflow-x-auto">
                      {JSON.stringify(value, null, 2)}
                    </pre>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Sidebar (1/3 width) */}
          <div className="space-y-6">
            {/* Metadata */}
            {Object.keys(doc.metadata).length > 0 && (
              <div className="bg-white rounded-xl shadow-sm p-5">
                <h3 className="text-sm font-semibold text-slate-900 mb-3">Metadata</h3>
                <dl className="space-y-2">
                  {Object.entries(doc.metadata).map(([key, value]) => (
                    <div key={key} className="flex justify-between text-sm">
                      <dt className="text-slate-500 capitalize">{key.replace(/_/g, " ")}</dt>
                      <dd className="text-slate-900 font-medium">
                        {typeof value === "number" && key.includes("price")
                          ? formatCurrency(value)
                          : String(value)}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}

            {/* Lineage */}
            {(lineage.parent || lineage.children.length > 0) && (
              <div className="bg-white rounded-xl shadow-sm p-5">
                <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-1.5">
                  <GitBranch className="w-4 h-4" /> Document Lineage
                </h3>
                {lineage.parent && (
                  <div className="mb-3">
                    <div className="text-xs text-slate-400 mb-1">Parent</div>
                    <Link
                      href={`/dashboard/documents/${lineage.parent.id}`}
                      className="flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-700"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      {lineage.parent.title}
                      <span className="text-slate-400 capitalize">({lineage.parent.type})</span>
                    </Link>
                  </div>
                )}
                {lineage.children.length > 0 && (
                  <div>
                    <div className="text-xs text-slate-400 mb-1">Derived documents</div>
                    <div className="space-y-1.5">
                      {lineage.children.map((child) => (
                        <Link
                          key={child.id}
                          href={`/dashboard/documents/${child.id}`}
                          className="flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-700"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          {child.title}
                          <span className="text-slate-400 capitalize">({child.type})</span>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Version history */}
            <div className="bg-white rounded-xl shadow-sm p-5">
              <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-1.5">
                <Clock className="w-4 h-4" /> Version History
              </h3>
              {versions.length === 0 ? (
                <p className="text-sm text-slate-400">No versions recorded</p>
              ) : (
                <div className="space-y-2">
                  {versions.map((v) => (
                    <div
                      key={v.id}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="text-slate-700 font-medium">v{v.version}</span>
                      <span className="text-slate-400">{v.created_by}</span>
                      <span className="text-slate-400">{formatDate(v.created_at)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
