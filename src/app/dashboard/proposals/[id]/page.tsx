"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useApp } from "@/lib/store";
import { formatDate, formatCurrency, getStatusColor, slugify } from "@/lib/utils";
import {
  ArrowLeft,
  Edit2,
  Send,
  Check,
  FileText,
  Copy,
  CheckCircle,
} from "lucide-react";
import { useState } from "react";

export default function ProposalDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { state, dispatch } = useApp();
  const [copied, setCopied] = useState(false);

  const proposalId = params.id as string;
  const proposal = state.proposals.find((p) => p.id === proposalId);

  if (!proposal) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
        <div className="max-w-4xl mx-auto text-center py-12">
          <FileText size={48} className="mx-auto mb-4 text-slate-300" />
          <h1 className="text-2xl font-bold text-slate-900 mb-2">
            Proposal not found
          </h1>
          <Link
            href="/dashboard/proposals"
            className="text-blue-600 hover:text-blue-700 font-semibold"
          >
            Back to Proposals
          </Link>
        </div>
      </div>
    );
  }

  const portalLink = `scopepad.app/portal/alex-rivera/${slugify(proposal.clientName)}`;

  const handleCopyPortalLink = () => {
    navigator.clipboard.writeText(portalLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleMarkApproved = () => {
    dispatch({
      type: "UPDATE_PROPOSAL",
      payload: {
        ...proposal,
        status: "approved",
      },
    });
  };

  const handleResend = () => {
    // In a real app, this would send an email to the client
    alert("Proposal resent to " + proposal.clientName);
  };

  // Get action buttons based on status
  const getActionButtons = () => {
    switch (proposal.status) {
      case "draft":
        return (
          <>
            <button
              onClick={() =>
                router.push(`/dashboard/proposals/${proposal.id}/edit`)
              }
              className="flex items-center gap-2 px-6 py-3 bg-slate-200 text-slate-900 rounded-lg hover:bg-slate-300 font-semibold transition-colors"
            >
              <Edit2 size={20} />
              Edit
            </button>
            <button
              onClick={() => router.push(`/dashboard/proposals/${proposal.id}`)}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition-colors"
            >
              <Send size={20} />
              Send to Client
            </button>
          </>
        );
      case "sent":
        return (
          <>
            <button
              onClick={handleMarkApproved}
              className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold transition-colors"
            >
              <Check size={20} />
              Mark as Approved
            </button>
            <button
              onClick={handleResend}
              className="flex items-center gap-2 px-6 py-3 border border-slate-300 text-slate-900 rounded-lg hover:bg-slate-100 font-semibold transition-colors"
            >
              <Send size={20} />
              Resend
            </button>
          </>
        );
      case "approved":
        return (
          <>
            <button
              onClick={() =>
                router.push("/dashboard/invoices/new")
              }
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition-colors"
            >
              <FileText size={20} />
              Create Invoice
            </button>
            <button className="flex items-center gap-2 px-6 py-3 border border-slate-300 text-slate-900 rounded-lg hover:bg-slate-100 font-semibold transition-colors">
              <CheckCircle size={20} />
              View Milestones
            </button>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <button
          onClick={() => router.push("/dashboard/proposals")}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-8 transition-colors"
        >
          <ArrowLeft size={20} />
          Back to Proposals
        </button>

        {/* Status Badge */}
        <div className="flex items-center justify-between mb-8">
          <span
            className={`text-sm font-bold px-4 py-2 rounded-full ${getStatusColor(
              proposal.status
            )}`}
          >
            {proposal.status.charAt(0).toUpperCase() + proposal.status.slice(1)}
          </span>
          {proposal.aiGenerated && (
            <div className="flex items-center gap-2 text-yellow-600">
              <div className="w-2 h-2 bg-yellow-600 rounded-full"></div>
              <span className="text-sm font-medium">AI Generated</span>
            </div>
          )}
        </div>

        {/* Document Preview */}
        <div className="bg-white rounded-lg shadow-2xl p-12 border border-slate-200 mb-8">
          {/* Title Section */}
          <div className="mb-8 pb-8 border-b-2 border-slate-200">
            <h1 className="text-4xl font-bold text-slate-900 mb-2">
              {proposal.title}
            </h1>
            <p className="text-xl text-slate-600">
              For: <span className="font-semibold">{proposal.clientName}</span>
            </p>
            <p className="text-sm text-slate-500 mt-2">
              {formatDate(proposal.createdAt)}
            </p>
          </div>

          {/* Scope Section */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">
              Deliverables & Timeline
            </h2>
            <div className="space-y-4">
              {proposal.scope.map((item, idx) => (
                <div key={idx} className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-10 w-10 rounded-full bg-blue-600 text-white font-bold">
                      {idx + 1}
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-slate-900 text-lg">
                      {item.title}
                    </h3>
                    <p className="text-slate-700 mt-1">{item.description}</p>
                    <p className="text-sm text-slate-500 mt-2">
                      Due: {formatDate(item.dueDate)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Timeline & Budget Section */}
          <div className="grid grid-cols-2 gap-8 mb-8 p-6 bg-slate-50 rounded-lg">
            <div>
              <h3 className="font-bold text-slate-900 mb-2">Timeline</h3>
              <p className="text-2xl font-bold text-blue-600">
                {proposal.timeline}
              </p>
            </div>
            <div>
              <h3 className="font-bold text-slate-900 mb-2">Total Budget</h3>
              <p className="text-2xl font-bold text-blue-600">
                {formatCurrency(proposal.totalPrice)}
              </p>
              <p className="text-sm text-slate-600 mt-1">{proposal.budget}</p>
            </div>
          </div>

          {/* Terms Section */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">
              Terms & Conditions
            </h2>
            <p className="text-slate-700 whitespace-pre-wrap">
              {proposal.terms}
            </p>
          </div>
        </div>

        {/* Portal Link Section */}
        <div className="bg-white rounded-lg shadow p-6 border border-slate-200 mb-8">
          <h3 className="text-lg font-bold text-slate-900 mb-3">Share Portal</h3>
          <p className="text-slate-600 text-sm mb-3">
            Share this link with your client to view the proposal:
          </p>
          <div className="flex gap-2">
            <div className="flex-1 px-4 py-3 bg-slate-50 border border-slate-300 rounded-lg font-mono text-sm text-slate-700 overflow-auto">
              {portalLink}
            </div>
            <button
              onClick={handleCopyPortalLink}
              className={`flex items-center gap-2 px-4 py-3 rounded-lg font-semibold transition-colors ${
                copied
                  ? "bg-green-600 text-white"
                  : "bg-slate-200 text-slate-900 hover:bg-slate-300"
              }`}
            >
              {copied ? (
                <>
                  <Check size={20} />
                  Copied
                </>
              ) : (
                <>
                  <Copy size={20} />
                  Copy
                </>
              )}
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 justify-center">
          {getActionButtons()}
        </div>
      </div>
    </div>
  );
}
