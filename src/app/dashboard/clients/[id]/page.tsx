"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ChevronRight, ExternalLink, MessageSquare } from "lucide-react";
import { useApp } from "@/lib/store";
import { formatCurrency, formatDate, getStatusColor } from "@/lib/utils";
import { cn } from "@/lib/utils";

type TabType = "proposals" | "invoices" | "messages" | "timeline";

export default function ClientDetailPage() {
  const params = useParams();
  const clientId = params.id as string;
  const [activeTab, setActiveTab] = useState<TabType>("proposals");
  const { state } = useApp();

  const client = state.clients.find((c) => c.id === clientId);

  if (!client) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold text-gray-900">Client not found</h1>
        <Link
          href="/dashboard/clients"
          className="mt-4 text-blue-600 hover:text-blue-800"
        >
          Back to Clients
        </Link>
      </div>
    );
  }

  const proposals = state.proposals.filter((p) => p.clientId === clientId);
  const invoices = state.invoices.filter((i) => i.clientId === clientId);
  const messages = state.messages.filter((m) => m.clientId === clientId);

  // Create timeline combining messages and activity logs
  const timeline = useMemo(() => {
    return messages
      .map((msg) => ({
        type: msg.type || "message" as const,
        timestamp: msg.createdAt,
        content: msg,
      }))
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [messages]);

  const tabs: Array<{ id: TabType; label: string; count: number }> = [
    { id: "proposals", label: "Proposals", count: proposals.length },
    { id: "invoices", label: "Invoices", count: invoices.length },
    { id: "timeline", label: "Timeline", count: timeline.length },
    { id: "messages", label: "Messages", count: messages.length },
  ];

  const portalUrl = `/portal/${client.portalSlug}`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{client.name}</h1>
          <p className="text-gray-600 mt-1">{client.company}</p>
          <div className="flex flex-col gap-1 mt-3 text-sm text-gray-600">
            <p>Email: {client.email}</p>
            <p className="text-xs text-gray-500">
              Added on {formatDate(client.createdAt)}
            </p>
          </div>
        </div>
        <Link
          href={portalUrl}
          target="_blank"
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors self-start md:self-auto"
        >
          View Client Portal
          <ExternalLink size={18} />
        </Link>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="flex border-b border-gray-200">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex-1 px-4 py-3 text-sm font-medium transition-colors border-b-2",
                activeTab === tab.id
                  ? "text-blue-600 border-blue-600 bg-blue-50"
                  : "text-gray-600 border-transparent hover:text-gray-900"
              )}
            >
              {tab.label}
              <span className="ml-2 text-xs bg-gray-200 px-2 py-1 rounded-full">
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {/* Proposals Tab */}
          {activeTab === "proposals" && (
            <div className="space-y-4">
              {proposals.length > 0 ? (
                proposals.map((proposal) => (
                  <Link
                    key={proposal.id}
                    href={`/dashboard/proposals/${proposal.id}`}
                    className="block p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">
                          {proposal.title}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                          {proposal.brief.substring(0, 100)}...
                        </p>
                        <div className="flex items-center gap-4 mt-3">
                          <span className="text-sm font-medium text-gray-900">
                            {formatCurrency(proposal.totalPrice)}
                          </span>
                          <span className="text-xs text-gray-500">
                            {formatDate(proposal.createdAt)}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span
                          className={cn(
                            "px-3 py-1 rounded-full text-xs font-medium",
                            getStatusColor(proposal.status)
                          )}
                        >
                          {proposal.status.charAt(0).toUpperCase() +
                            proposal.status.slice(1)}
                        </span>
                        <ChevronRight size={18} className="text-gray-400" />
                      </div>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="text-center py-8 text-gray-600">
                  No proposals for this client
                </div>
              )}
            </div>
          )}

          {/* Invoices Tab */}
          {activeTab === "invoices" && (
            <div className="space-y-4">
              {invoices.length > 0 ? (
                invoices.map((invoice) => (
                  <Link
                    key={invoice.id}
                    href={`/dashboard/invoices/${invoice.id}`}
                    className="block p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">
                          Invoice #{invoice.id.substring(0, 8)}
                        </h3>
                        <div className="flex items-center gap-4 mt-3">
                          <span className="text-sm font-medium text-gray-900">
                            {formatCurrency(invoice.total)}
                          </span>
                          <span className="text-xs text-gray-500">
                            Due {formatDate(invoice.dueDate)}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span
                          className={cn(
                            "px-3 py-1 rounded-full text-xs font-medium",
                            getStatusColor(invoice.status)
                          )}
                        >
                          {invoice.status.charAt(0).toUpperCase() +
                            invoice.status.slice(1)}
                        </span>
                        <ChevronRight size={18} className="text-gray-400" />
                      </div>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="text-center py-8 text-gray-600">
                  No invoices for this client
                </div>
              )}
            </div>
          )}

          {/* Timeline Tab */}
          {activeTab === "timeline" && (
            <div className="space-y-4">
              {timeline.length > 0 ? (
                timeline.map((item) => {
                  const message = item.content;
                  const isActivity = item.type === "activity";

                  return (
                    <div
                      key={message.id}
                      className={cn(
                        "p-4 rounded-lg border-l-4",
                        isActivity
                          ? "bg-amber-50 border-l-amber-500 border border-amber-200"
                          : message.sender === "freelancer"
                          ? "bg-blue-50 border-l-blue-500 border border-blue-200"
                          : "bg-gray-50 border-l-gray-500 border border-gray-200"
                      )}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-gray-900">
                            {isActivity
                              ? "Activity"
                              : message.sender === "freelancer"
                              ? state.freelancer?.name || "You"
                              : client.name}
                          </p>
                          <p className={cn("text-sm mt-2", isActivity ? "text-amber-900 font-medium" : "text-gray-700")}>
                            {message.body}
                          </p>
                        </div>
                        <span className="text-xs text-gray-500 ml-4 flex-shrink-0">
                          {formatDate(message.createdAt)}
                        </span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8 text-gray-600">
                  No activity yet
                </div>
              )}
            </div>
          )}

          {/* Messages Tab */}
          {activeTab === "messages" && (
            <div className="space-y-4">
              {messages.length > 0 ? (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={cn(
                      "p-4 rounded-lg",
                      message.sender === "freelancer"
                        ? "bg-blue-50 border border-blue-200"
                        : "bg-gray-50 border border-gray-200"
                    )}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-gray-900">
                          {message.sender === "freelancer"
                            ? state.freelancer?.name || "You"
                            : client.name}
                        </p>
                        <p className="text-sm text-gray-700 mt-2">
                          {message.body}
                        </p>
                      </div>
                      <span className="text-xs text-gray-500 ml-4 flex-shrink-0">
                        {formatDate(message.createdAt)}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-600">
                  No messages yet
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
