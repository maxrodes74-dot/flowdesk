"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ChevronRight, ExternalLink, MessageSquare, FileText, Receipt, CheckCircle, MessageCircle } from "lucide-react";
import { useApp } from "@/lib/store";
import { formatCurrency, formatDate, getStatusColor } from "@/lib/utils";
import { cn } from "@/lib/utils";

type TabType = "proposals" | "invoices" | "messages" | "activity";

interface TimelineEvent {
  id: string;
  type: "proposal_created" | "proposal_sent" | "proposal_approved" | "proposal_declined" |
        "invoice_created" | "invoice_sent" | "invoice_paid" |
        "milestone_completed" | "message";
  title: string;
  description: string;
  timestamp: string;
  icon: React.ComponentType<{ size: number; className: string }>;
  color: "blue" | "green" | "orange" | "purple" | "gray";
  metadata?: Record<string, unknown>;
}

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
  const milestones = state.milestones.filter((m) => {
    const proposal = state.proposals.find((p) => p.id === m.proposalId);
    return proposal?.clientId === clientId;
  });

  // Create unified activity timeline
  const activityTimeline = useMemo(() => {
    const events: TimelineEvent[] = [];

    // Add proposal events
    proposals.forEach((proposal) => {
      events.push({
        id: `${proposal.id}-created`,
        type: "proposal_created",
        title: "Proposal Created",
        description: `Proposal "${proposal.title}" has been created.`,
        timestamp: proposal.createdAt,
        icon: FileText,
        color: "blue",
        metadata: { proposalId: proposal.id, amount: proposal.totalPrice },
      });

      if (proposal.status !== "draft") {
        events.push({
          id: `${proposal.id}-sent`,
          type: "proposal_sent",
          title: "Proposal Sent",
          description: `Proposal "${proposal.title}" has been sent to the client.`,
          timestamp: proposal.createdAt,
          icon: FileText,
          color: "blue",
          metadata: { proposalId: proposal.id },
        });
      }

      if (proposal.status === "approved") {
        events.push({
          id: `${proposal.id}-approved`,
          type: "proposal_approved",
          title: "Proposal Approved",
          description: `Proposal "${proposal.title}" has been approved by the client.`,
          timestamp: proposal.createdAt,
          icon: CheckCircle,
          color: "green",
          metadata: { proposalId: proposal.id },
        });
      }

      if (proposal.status === "declined") {
        events.push({
          id: `${proposal.id}-declined`,
          type: "proposal_declined",
          title: "Proposal Declined",
          description: `Proposal "${proposal.title}" has been declined.`,
          timestamp: proposal.createdAt,
          icon: FileText,
          color: "orange",
          metadata: { proposalId: proposal.id },
        });
      }
    });

    // Add invoice events
    invoices.forEach((invoice) => {
      events.push({
        id: `${invoice.id}-created`,
        type: "invoice_created",
        title: "Invoice Created",
        description: `Invoice #${invoice.id.substring(0, 8)} for ${formatCurrency(invoice.total)} has been created.`,
        timestamp: invoice.createdAt,
        icon: Receipt,
        color: "purple",
        metadata: { invoiceId: invoice.id, amount: invoice.total },
      });

      if (invoice.status !== "draft") {
        events.push({
          id: `${invoice.id}-sent`,
          type: "invoice_sent",
          title: "Invoice Sent",
          description: `Invoice #${invoice.id.substring(0, 8)} for ${formatCurrency(invoice.total)} has been sent.`,
          timestamp: invoice.createdAt,
          icon: Receipt,
          color: "purple",
          metadata: { invoiceId: invoice.id },
        });
      }

      if (invoice.status === "paid" && invoice.paidAt) {
        events.push({
          id: `${invoice.id}-paid`,
          type: "invoice_paid",
          title: "Payment Received",
          description: `Invoice #${invoice.id.substring(0, 8)} for ${formatCurrency(invoice.total)} has been paid.`,
          timestamp: invoice.paidAt,
          icon: CheckCircle,
          color: "green",
          metadata: { invoiceId: invoice.id, amount: invoice.total },
        });
      }
    });

    // Add milestone events
    milestones.forEach((milestone) => {
      if (milestone.status === "completed") {
        events.push({
          id: `${milestone.id}-completed`,
          type: "milestone_completed",
          title: "Milestone Completed",
          description: `Milestone "${milestone.title}" has been completed.`,
          timestamp: milestone.createdAt,
          icon: CheckCircle,
          color: "orange",
          metadata: { milestoneId: milestone.id },
        });
      }
    });

    // Add message events
    messages.forEach((message) => {
      if (message.type !== "activity") {
        events.push({
          id: message.id,
          type: "message",
          title: message.sender === "freelancer" ? "Message Sent" : "Message Received",
          description: message.body,
          timestamp: message.createdAt,
          icon: MessageCircle,
          color: "gray",
          metadata: { sender: message.sender },
        });
      }
    });

    // Sort by timestamp, newest first
    return events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [proposals, invoices, milestones, messages, clientId, state.proposals]);

  const tabs: Array<{ id: TabType; label: string; count: number }> = [
    { id: "proposals", label: "Proposals", count: proposals.length },
    { id: "invoices", label: "Invoices", count: invoices.length },
    { id: "activity", label: "Activity", count: activityTimeline.length },
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

          {/* Activity Tab */}
          {activeTab === "activity" && (
            <div className="space-y-4">
              {activityTimeline.length > 0 ? (
                <div className="relative">
                  {activityTimeline.map((event, idx) => {
                    const Icon = event.icon;
                    const bgColors = {
                      blue: "bg-blue-50 border-l-blue-500",
                      green: "bg-green-50 border-l-green-500",
                      orange: "bg-orange-50 border-l-orange-500",
                      purple: "bg-purple-50 border-l-purple-500",
                      gray: "bg-gray-50 border-l-gray-500",
                    };
                    const iconColors = {
                      blue: "text-blue-600 bg-blue-100",
                      green: "text-green-600 bg-green-100",
                      orange: "text-orange-600 bg-orange-100",
                      purple: "text-purple-600 bg-purple-100",
                      gray: "text-gray-600 bg-gray-100",
                    };
                    const textColors = {
                      blue: "text-blue-900",
                      green: "text-green-900",
                      orange: "text-orange-900",
                      purple: "text-purple-900",
                      gray: "text-gray-700",
                    };

                    return (
                      <div
                        key={event.id}
                        className={cn(
                          "p-4 rounded-lg border-l-4 border flex items-start gap-4",
                          bgColors[event.color]
                        )}
                      >
                        <div className={cn("p-2 rounded-lg flex-shrink-0 mt-0.5", iconColors[event.color])}>
                          <Icon size={18} className="text-current" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-semibold text-gray-900">
                            {event.title}
                          </h4>
                          <p className={cn("text-sm mt-1", textColors[event.color])}>
                            {event.description}
                          </p>
                        </div>
                        <span className="text-xs text-gray-500 ml-4 flex-shrink-0 whitespace-nowrap">
                          {formatDate(event.timestamp)}
                        </span>
                      </div>
                    );
                  })}
                </div>
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
