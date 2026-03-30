"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import {
  Check,
  X,
  Download,
  FileText,
  Receipt,
  FileSignature,
  ClipboardList,
  AlertCircle,
  CheckCircle2,
  XCircle,
} from "lucide-react";

interface PortalDocument {
  id: string;
  type: string;
  title: string;
  content: Record<string, unknown>;
  metadata: Record<string, unknown>;
  status: string;
  version: number;
  file_url: string | null;
  created_at: string;
  sent_at: string | null;
  approved_at: string | null;
}

interface Freelancer {
  name: string;
  email: string;
  brand_color: string;
  logo_url: string | null;
}

interface Client {
  name: string;
  email: string;
  company: string;
}

const TYPE_ICONS: Record<string, typeof FileText> = {
  proposal: FileText,
  invoice: Receipt,
  contract: FileSignature,
  sow: ClipboardList,
};

export default function PortalDocumentPage() {
  const params = useParams();
  const [doc, setDoc] = useState<PortalDocument | null>(null);
  const [freelancer, setFreelancer] = useState<Freelancer | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [actionResult, setActionResult] = useState<{
    type: "approve" | "decline";
    success: boolean;
  } | null>(null);

  useEffect(() => {
    fetchDocument();
  }, [params.documentId]);

  async function fetchDocument() {
    try {
      const res = await fetch(`/api/portal/${params.documentId}`);
      if (!res.ok) {
        setError("Document not found or not available.");
        return;
      }
      const data = await res.json();
      setDoc(data.document);
      setFreelancer(data.freelancer);
      setClient(data.client);
    } catch {
      setError("Failed to load document.");
    } finally {
      setLoading(false);
    }
  }

  async function handleAction(action: "approve" | "decline") {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/portal/${params.documentId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, message: message || undefined }),
      });
      if (res.ok) {
        setActionResult({ type: action, success: true });
        await fetchDocument();
      } else {
        setActionResult({ type: action, success: false });
      }
    } catch {
      setActionResult({ type: action, success: false });
    } finally {
      setActionLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-400 text-lg">Loading document...</div>
      </div>
    );
  }

  if (error || !doc) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <AlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Document not available</h1>
          <p className="text-gray-500">
            This link may have expired or the document hasn&apos;t been shared yet.
          </p>
        </div>
      </div>
    );
  }

  const brandColor = freelancer?.brand_color || "#6366f1";
  const Icon = TYPE_ICONS[doc.type] || FileText;
  const canAct = doc.status === "sent";

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header
        className="border-b"
        style={{ borderColor: brandColor + "33", backgroundColor: brandColor + "08" }}
      >
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {freelancer?.logo_url ? (
              <img
                src={freelancer.logo_url}
                alt={freelancer.name}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                style={{ backgroundColor: brandColor }}
              >
                {freelancer?.name?.[0] || "S"}
              </div>
            )}
            <div>
              <div className="font-semibold text-gray-900">{freelancer?.name}</div>
              <div className="text-sm text-gray-500">{freelancer?.email}</div>
            </div>
          </div>
          <div className="text-sm text-gray-400">
            Powered by <span className="font-semibold text-indigo-600">ScopePad</span>
          </div>
        </div>
      </header>

      {/* Document */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Status banner */}
        {doc.status === "approved" && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
            <span className="text-green-800 font-medium">
              This document was approved on{" "}
              {doc.approved_at
                ? new Date(doc.approved_at).toLocaleDateString()
                : "recently"}
            </span>
          </div>
        )}
        {doc.status === "declined" && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-center gap-3">
            <XCircle className="w-5 h-5 text-red-600" />
            <span className="text-red-800 font-medium">This document was declined.</span>
          </div>
        )}

        {/* Action result */}
        {actionResult && (
          <div
            className={`rounded-lg p-4 mb-6 flex items-center gap-3 ${
              actionResult.success
                ? actionResult.type === "approve"
                  ? "bg-green-50 border border-green-200"
                  : "bg-amber-50 border border-amber-200"
                : "bg-red-50 border border-red-200"
            }`}
          >
            {actionResult.success ? (
              <>
                <CheckCircle2
                  className={`w-5 h-5 ${
                    actionResult.type === "approve" ? "text-green-600" : "text-amber-600"
                  }`}
                />
                <span className="font-medium">
                  Document {actionResult.type === "approve" ? "approved" : "declined"} successfully.
                </span>
              </>
            ) : (
              <>
                <AlertCircle className="w-5 h-5 text-red-600" />
                <span className="text-red-800 font-medium">
                  Failed to {actionResult.type} document. Please try again.
                </span>
              </>
            )}
          </div>
        )}

        {/* Document header */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex items-center gap-3 mb-3">
            <Icon className="w-6 h-6" style={{ color: brandColor }} />
            <span className="text-sm font-medium text-gray-500 uppercase tracking-wider">
              {doc.type.replace(/_/g, " ")}
            </span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{doc.title}</h1>
          {client && (
            <p className="text-gray-500">
              Prepared for {client.name}
              {client.company ? ` at ${client.company}` : ""}
            </p>
          )}
          <p className="text-sm text-gray-400 mt-2">
            Sent{" "}
            {doc.sent_at
              ? new Date(doc.sent_at).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })
              : "recently"}
          </p>
        </div>

        {/* Document content */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          {Object.entries(doc.content).map(([key, value]) => (
            <div key={key} className="mb-6 last:mb-0">
              <h2
                className="text-lg font-semibold mb-2 capitalize"
                style={{ color: brandColor }}
              >
                {key.replace(/_/g, " ")}
              </h2>
              {typeof value === "string" ? (
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{value}</p>
              ) : Array.isArray(value) ? (
                <ul className="space-y-2">
                  {value.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-gray-700">
                      <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-gray-400 flex-shrink-0" />
                      {typeof item === "string" ? (
                        item
                      ) : typeof item === "object" && item !== null ? (
                        <div>
                          {Object.entries(item).map(([k, v]) => (
                            <span key={k} className="mr-3">
                              <span className="text-gray-500 text-sm">{k}:</span>{" "}
                              <span className="font-medium">{String(v)}</span>
                            </span>
                          ))}
                        </div>
                      ) : (
                        String(item)
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <pre className="bg-gray-50 rounded-lg p-4 text-sm overflow-x-auto">
                  {JSON.stringify(value, null, 2)}
                </pre>
              )}
            </div>
          ))}
        </div>

        {/* Metadata summary (for invoices, show totals) */}
        {doc.type === "invoice" && doc.metadata && (
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold text-gray-900">Total</span>
              <span className="text-3xl font-bold" style={{ color: brandColor }}>
                ${Number(doc.metadata.total || 0).toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                })}
              </span>
            </div>
            {(doc.metadata.due_date as any) && (
              <p className="text-sm text-gray-500 mt-2">Due: {String(doc.metadata.due_date)}</p>
            )}
          </div>
        )}

        {/* Approve / Decline actions */}
        {canAct && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Your response</h2>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Add an optional message..."
              className="w-full border border-gray-200 rounded-lg p-3 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
              rows={3}
            />
            <div className="flex gap-3">
              <button
                onClick={() => handleAction("approve")}
                disabled={actionLoading}
                className="flex-1 py-3 font-semibold rounded-lg text-white transition-colors flex items-center justify-center gap-2"
                style={{ backgroundColor: brandColor }}
              >
                <Check className="w-5 h-5" />
                {actionLoading ? "Processing..." : "Approve"}
              </button>
              <button
                onClick={() => handleAction("decline")}
                disabled={actionLoading}
                className="flex-1 py-3 font-semibold rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
              >
                <X className="w-5 h-5" />
                Decline
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 mt-12 py-6 text-center text-sm text-gray-400">
        Powered by <span className="font-semibold text-indigo-600">ScopePad</span>
      </footer>
    </div>
  );
}
