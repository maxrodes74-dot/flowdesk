"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useApp } from "@/lib/store";
import { formatCurrency, formatDate, getStatusColor, cn } from "@/lib/utils";
import {
  FileText,
  DollarSign,
  MessageCircle,
  Check,
  X,
  ChevronDown,
  ChevronUp,
  Send,
  CheckCircle2,
  AlertCircle,
  Flag,
  Scroll,
} from "lucide-react";

type TabType = "proposals" | "invoices" | "messages" | "milestones" | "contracts";

export default function ClientPortalPage() {
  const params = useParams();
  const { state, dispatch } = useApp();
  const [activeTab, setActiveTab] = useState<TabType>("proposals");
  const [expandedProposal, setExpandedProposal] = useState<string | null>(null);
  const [messageText, setMessageText] = useState("");
  const [paymentModalOpen, setPaymentModalOpen] = useState<string | null>(null);
  const [signingContractId, setSigningContractId] = useState<string | null>(null);
  const [signatureName, setSignatureName] = useState("");

  const clientSlug = params?.clientSlug as string;
  const freelancerSlug = params?.freelancerSlug as string;

  // Find client by portal slug
  const client = state.clients.find((c) => c.portalSlug === clientSlug);

  // Filter data for this client
  const clientProposals = state.proposals.filter(
    (p) => p.clientId === client?.id
  );
  const clientInvoices = state.invoices.filter((i) => i.clientId === client?.id);
  const clientMessages = state.messages.filter((m) => m.clientId === client?.id);

  // Get approved proposals and their milestones
  const approvedProposals = clientProposals.filter((p) => p.status === "approved");
  const clientMilestones = state.milestones.filter((m) =>
    approvedProposals.some((p) => p.id === m.proposalId)
  );

  // Get contracts for this client's proposals
  const clientContracts = state.contracts.filter((c) =>
    clientProposals.some((p) => p.id === c.proposalId)
  );

  // Calculate overall progress
  const totalMilestones = clientMilestones.length;
  const completedMilestones = clientMilestones.filter(
    (m) => m.status === "completed"
  ).length;
  const progressPercentage =
    totalMilestones > 0 ? Math.round((completedMilestones / totalMilestones) * 100) : 0;

  if (!client) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <AlertCircle className="w-16 h-16 text-gray-300" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Portal not found
          </h1>
          <p className="text-gray-600 text-lg">
            Please check the URL or contact your freelancer.
          </p>
        </div>
      </div>
    );
  }

  const brandColor = state.freelancer?.brandColor || "#2563eb";

  const handleApproveProposal = (proposalId: string) => {
    const proposal = state.proposals.find((p) => p.id === proposalId);
    if (proposal) {
      // Update proposal status to approved
      dispatch({
        type: "UPDATE_PROPOSAL",
        payload: { ...proposal, status: "approved" },
      });

      // Create milestones from proposal deliverables
      if (proposal.scope && proposal.scope.length > 0) {
        proposal.scope.forEach((deliverable, index) => {
          const milestone: any = {
            id: `milestone_${Date.now()}_${index}`,
            proposalId: proposal.id,
            title: deliverable.title,
            description: deliverable.description,
            dueDate: deliverable.dueDate,
            status: "pending",
            sortOrder: index,
            invoiceId: null,
            createdAt: new Date().toISOString(),
          };
          dispatch({
            type: "ADD_MILESTONE",
            payload: milestone,
          });
        });
      }
    }
  };

  const handleRequestChanges = (proposalId: string) => {
    const proposal = state.proposals.find((p) => p.id === proposalId);
    if (proposal) {
      dispatch({
        type: "UPDATE_PROPOSAL",
        payload: { ...proposal, status: "viewed" },
      });
    }
  };

  const handleSendMessage = () => {
    if (!messageText.trim()) return;

    dispatch({
      type: "ADD_MESSAGE",
      payload: {
        id: `msg_${Date.now()}`,
        clientId: client.id,
        sender: "client",
        body: messageText,
        createdAt: new Date().toISOString(),
      },
    });

    setMessageText("");
  };

  const handleSignContract = async (contractId: string) => {
    if (!signatureName.trim()) return;

    const contract = state.contracts.find((c) => c.id === contractId);
    if (!contract) return;

    // Get IP from a header or use fallback
    // In a real scenario, you'd get this from the request headers on the server
    const ipAddress = "0.0.0.0"; // Placeholder - would be obtained from API

    // Update contract with signature
    dispatch({
      type: "UPDATE_CONTRACT",
      payload: {
        ...contract,
        signatureName: signatureName,
        signatureIp: ipAddress,
        signedAt: new Date().toISOString(),
      },
    });

    setSigningContractId(null);
    setSignatureName("");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {state.freelancer?.name}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              {state.freelancer?.profession || "Freelancer"}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400">Powered by</p>
            <p className="text-sm font-semibold text-gray-600">FlowDesk</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Tab Navigation */}
        <div className="bg-white rounded-lg border border-gray-200 mb-6 p-1 flex gap-1 w-fit">
          <TabButton
            tab="proposals"
            label="Proposals"
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            icon={<FileText className="w-4 h-4" />}
            brandColor={brandColor}
          />
          <TabButton
            tab="invoices"
            label="Invoices"
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            icon={<DollarSign className="w-4 h-4" />}
            brandColor={brandColor}
          />
          <TabButton
            tab="messages"
            label="Messages"
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            icon={<MessageCircle className="w-4 h-4" />}
            brandColor={brandColor}
          />
          <TabButton
            tab="milestones"
            label="Milestones"
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            icon={<Flag className="w-4 h-4" />}
            brandColor={brandColor}
          />
          <TabButton
            tab="contracts"
            label="Contracts"
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            icon={<Scroll className="w-4 h-4" />}
            brandColor={brandColor}
          />
        </div>

        {/* Proposals Tab */}
        {activeTab === "proposals" && (
          <div className="space-y-4">
            {clientProposals.length === 0 ? (
              <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
                <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No proposals yet</p>
              </div>
            ) : (
              clientProposals.map((proposal) => (
                <ProposalCard
                  key={proposal.id}
                  proposal={proposal}
                  isExpanded={expandedProposal === proposal.id}
                  onToggleExpand={() =>
                    setExpandedProposal(
                      expandedProposal === proposal.id ? null : proposal.id
                    )
                  }
                  onApprove={() => handleApproveProposal(proposal.id)}
                  onRequestChanges={() => handleRequestChanges(proposal.id)}
                  brandColor={brandColor}
                />
              ))
            )}
          </div>
        )}

        {/* Invoices Tab */}
        {activeTab === "invoices" && (
          <div className="space-y-4">
            {clientInvoices.length === 0 ? (
              <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
                <DollarSign className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No invoices yet</p>
              </div>
            ) : (
              clientInvoices.map((invoice) => (
                <InvoiceCard
                  key={invoice.id}
                  invoice={invoice}
                  onPayNow={() => setPaymentModalOpen(invoice.id)}
                  brandColor={brandColor}
                />
              ))
            )}
          </div>
        )}

        {/* Messages Tab */}
        {activeTab === "messages" && (
          <div className="bg-white rounded-lg border border-gray-200 flex flex-col h-96">
            {/* Messages List */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {clientMessages.length === 0 ? (
                <div className="h-full flex items-center justify-center text-gray-500">
                  <p>No messages yet. Start the conversation!</p>
                </div>
              ) : (
                clientMessages.map((message) => (
                  <div
                    key={message.id}
                    className={cn(
                      "flex",
                      message.sender === "freelancer"
                        ? "justify-start"
                        : "justify-end"
                    )}
                  >
                    <div
                      className={cn(
                        "max-w-xs px-4 py-2 rounded-lg",
                        message.sender === "freelancer"
                          ? "bg-gray-100 text-gray-900"
                          : "bg-blue-500 text-white"
                      )}
                    >
                      <p className="text-sm">{message.body}</p>
                      <p
                        className={cn(
                          "text-xs mt-1",
                          message.sender === "freelancer"
                            ? "text-gray-500"
                            : "text-blue-100"
                        )}
                      >
                        {formatDate(message.createdAt)}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Message Input */}
            <div className="border-t border-gray-200 p-4 flex gap-2">
              <input
                type="text"
                placeholder="Type your message..."
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    handleSendMessage();
                  }
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={handleSendMessage}
                disabled={!messageText.trim()}
                style={{
                  backgroundColor: messageText.trim() ? brandColor : "#e5e7eb",
                  color: messageText.trim() ? "white" : "#9ca3af",
                }}
                className="px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4" />
                Send
              </button>
            </div>
          </div>
        )}

        {/* Milestones Tab */}
        {activeTab === "milestones" && (
          <div className="space-y-6">
            {/* Overall Progress Bar */}
            {clientMilestones.length > 0 && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Project Progress
                  </h3>
                  <span
                    className="text-2xl font-bold"
                    style={{ color: brandColor }}
                  >
                    {progressPercentage}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${progressPercentage}%`,
                      backgroundColor: brandColor,
                    }}
                  />
                </div>
                <p className="text-sm text-gray-600 mt-3">
                  {completedMilestones} of {totalMilestones} milestones completed
                </p>
              </div>
            )}

            {/* Milestones List */}
            {clientMilestones.length === 0 ? (
              <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
                <Flag className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">
                  No milestones yet. Approve a proposal to create milestones.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {clientMilestones.map((milestone) => (
                  <div
                    key={milestone.id}
                    className="bg-white rounded-lg border border-gray-200 p-6"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="text-lg font-semibold text-gray-900">
                            {milestone.title}
                          </h4>
                          <span
                            className={cn(
                              "px-3 py-1 rounded-full text-xs font-medium",
                              milestone.status === "completed"
                                ? "bg-green-100 text-green-800"
                                : milestone.status === "in_progress"
                                  ? "bg-blue-100 text-blue-800"
                                  : "bg-gray-100 text-gray-800"
                            )}
                          >
                            {milestone.status === "pending"
                              ? "Pending"
                              : milestone.status === "in_progress"
                                ? "In Progress"
                                : "Completed"}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-3">
                          {milestone.description}
                        </p>
                      </div>
                    </div>

                    {/* Due Date */}
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <span className="font-medium">Due:</span>
                      <span>{formatDate(milestone.dueDate)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Contracts Tab */}
        {activeTab === "contracts" && (
          <div className="space-y-4">
            {clientContracts.length === 0 ? (
              <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
                <Scroll className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No contracts yet</p>
              </div>
            ) : (
              clientContracts.map((contract) => {
                const proposal = clientProposals.find(
                  (p) => p.id === contract.proposalId
                );
                return (
                  <ContractCard
                    key={contract.id}
                    contract={contract}
                    proposal={proposal}
                    isSigning={signingContractId === contract.id}
                    signatureName={signatureName}
                    onSigningChange={setSigningContractId}
                    onSignatureNameChange={setSignatureName}
                    onSign={() => handleSignContract(contract.id)}
                    brandColor={brandColor}
                  />
                );
              })
            )}
          </div>
        )}
      </main>

      {/* Payment Modal */}
      {paymentModalOpen && (
        <PaymentModal
          invoiceId={paymentModalOpen}
          invoices={clientInvoices}
          onClose={() => setPaymentModalOpen(null)}
          brandColor={brandColor}
        />
      )}
    </div>
  );
}

interface TabButtonProps {
  tab: TabType;
  label: string;
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  icon: React.ReactNode;
  brandColor: string;
}

function TabButton({
  tab,
  label,
  activeTab,
  setActiveTab,
  icon,
  brandColor,
}: TabButtonProps) {
  const isActive = activeTab === tab;

  return (
    <button
      onClick={() => setActiveTab(tab)}
      style={
        isActive
          ? {
              backgroundColor: brandColor,
              color: "white",
            }
          : {}
      }
      className={cn(
        "px-4 py-2 rounded-md font-medium text-sm flex items-center gap-2 transition-colors",
        isActive
          ? "text-white"
          : "text-gray-700 hover:text-gray-900 hover:bg-gray-100"
      )}
    >
      {icon}
      {label}
    </button>
  );
}

interface ProposalCardProps {
  proposal: any;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onApprove: () => void;
  onRequestChanges: () => void;
  brandColor: string;
}

function ProposalCard({
  proposal,
  isExpanded,
  onToggleExpand,
  onApprove,
  onRequestChanges,
  brandColor,
}: ProposalCardProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <button
        onClick={onToggleExpand}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <div className="flex-1 text-left">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold text-gray-900">
              {proposal.title}
            </h3>
            <span
              className={cn(
                "px-3 py-1 rounded-full text-xs font-medium",
                getStatusColor(proposal.status)
              )}
            >
              {proposal.status.charAt(0).toUpperCase() + proposal.status.slice(1)}
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            {formatDate(proposal.createdAt)}
          </p>
        </div>
        <div className="text-right mr-4">
          <p className="text-lg font-bold" style={{ color: brandColor }}>
            {formatCurrency(proposal.totalPrice)}
          </p>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-gray-400" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-400" />
        )}
      </button>

      {isExpanded && (
        <div className="border-t border-gray-200 px-6 py-6 space-y-6">
          {/* Brief */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-2">Brief</h4>
            <p className="text-sm text-gray-600">{proposal.brief}</p>
          </div>

          {/* Scope */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-3">
              Scope & Deliverables
            </h4>
            <ul className="space-y-3">
              {proposal.scope.map(
                (deliverable: any, index: number) => (
                  <li key={index} className="text-sm">
                    <div className="font-medium text-gray-900">
                      {index + 1}. {deliverable.title}
                    </div>
                    <p className="text-gray-600 mt-1">{deliverable.description}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Due: {formatDate(deliverable.dueDate)}
                    </p>
                  </li>
                )
              )}
            </ul>
          </div>

          {/* Timeline & Budget */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-2">
                Timeline
              </h4>
              <p className="text-sm text-gray-600">{proposal.timeline}</p>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-2">
                Budget
              </h4>
              <p className="text-sm text-gray-600">{proposal.budget}</p>
            </div>
          </div>

          {/* Terms */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-2">Terms</h4>
            <p className="text-sm text-gray-600">{proposal.terms}</p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            {proposal.status === "sent" && (
              <>
                <button
                  onClick={onApprove}
                  style={{ backgroundColor: brandColor }}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  Approve Proposal
                </button>
                <button
                  onClick={onRequestChanges}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                >
                  <AlertCircle className="w-4 h-4" />
                  Request Changes
                </button>
              </>
            )}
            {proposal.status === "approved" && (
              <div className="w-full flex items-center justify-center gap-2 text-green-600 font-medium">
                <CheckCircle2 className="w-5 h-5" />
                Approved
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

interface InvoiceCardProps {
  invoice: any;
  onPayNow: () => void;
  brandColor: string;
}

function InvoiceCard({ invoice, onPayNow, brandColor }: InvoiceCardProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Invoice #{invoice.id.replace("inv_", "")}
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            Due: {formatDate(invoice.dueDate)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold" style={{ color: brandColor }}>
            {formatCurrency(invoice.total)}
          </p>
          <span
            className={cn(
              "inline-block mt-2 px-3 py-1 rounded-full text-xs font-medium",
              getStatusColor(invoice.status)
            )}
          >
            {invoice.status === "paid"
              ? "Paid"
              : invoice.status === "sent"
                ? "Not Paid"
                : "Overdue"}
          </span>
        </div>
      </div>

      {/* Line Items */}
      <div className="mt-6 border-t border-gray-200 pt-4">
        <h4 className="text-sm font-semibold text-gray-900 mb-3">
          Line Items
        </h4>
        <ul className="space-y-2">
          {invoice.lineItems.map(
            (item: any, index: number) => (
              <li
                key={index}
                className="flex justify-between text-sm text-gray-600"
              >
                <span>{item.description}</span>
                <span className="font-medium text-gray-900">
                  {formatCurrency(item.rate)}
                </span>
              </li>
            )
          )}
        </ul>
      </div>

      {/* Paid Date or Action */}
      <div className="mt-6 pt-4 border-t border-gray-200 flex items-center justify-between">
        {invoice.status === "paid" ? (
          <div className="flex items-center gap-2 text-green-600 font-medium">
            <CheckCircle2 className="w-5 h-5" />
            Paid on {formatDate(invoice.paidAt)}
          </div>
        ) : (
          <button
            onClick={onPayNow}
            style={{ backgroundColor: brandColor }}
            className="px-6 py-2 text-white rounded-lg font-medium hover:opacity-90 transition-opacity"
          >
            Pay Now
          </button>
        )}
      </div>
    </div>
  );
}

interface PaymentModalProps {
  invoiceId: string;
  invoices: any[];
  onClose: () => void;
  brandColor: string;
}

function PaymentModal({
  invoiceId,
  invoices,
  onClose,
  brandColor,
}: PaymentModalProps) {
  const invoice = invoices.find((i) => i.id === invoiceId);

  if (!invoice) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Payment</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-900 text-center font-medium">
            Stripe payment integration will be connected here
          </p>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Amount</span>
            <span className="font-semibold text-gray-900">
              {formatCurrency(invoice.total)}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Invoice #</span>
            <span className="font-semibold text-gray-900">
              {invoice.id.replace("inv_", "")}
            </span>
          </div>
        </div>

        <button
          disabled
          className="w-full px-4 py-2 bg-gray-300 text-gray-600 rounded-lg font-medium cursor-not-allowed text-center"
        >
          Pay {formatCurrency(invoice.total)}
        </button>

        <button
          onClick={onClose}
          className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
}

interface ContractCardProps {
  contract: any;
  proposal: any;
  isSigning: boolean;
  signatureName: string;
  onSigningChange: (contractId: string | null) => void;
  onSignatureNameChange: (name: string) => void;
  onSign: () => void;
  brandColor: string;
}

function ContractCard({
  contract,
  proposal,
  isSigning,
  signatureName,
  onSigningChange,
  onSignatureNameChange,
  onSign,
  brandColor,
}: ContractCardProps) {
  const isUnsigned = !contract.signedAt;

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900">
              {proposal?.title || "Contract"}
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Created {formatDate(contract.createdAt)}
            </p>
          </div>
          <span
            className={cn(
              "px-3 py-1 rounded-full text-xs font-medium",
              isUnsigned
                ? "bg-yellow-100 text-yellow-800"
                : "bg-green-100 text-green-800"
            )}
          >
            {isUnsigned ? "Unsigned" : "Signed"}
          </span>
        </div>
      </div>

      <div className="px-6 py-6 space-y-6">
        {/* Contract Clauses */}
        {contract.clauses && contract.clauses.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-4">
              Contract Terms
            </h4>
            <div className="space-y-4">
              {contract.clauses.map((clause: any, index: number) => (
                <div
                  key={index}
                  className="bg-gray-50 rounded-lg p-4 border border-gray-200"
                >
                  <h5 className="font-medium text-gray-900 text-sm mb-2">
                    {clause.name}
                  </h5>
                  <p className="text-sm text-gray-600 whitespace-pre-wrap">
                    {clause.content}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Signature Status or Form */}
        {isUnsigned ? (
          <div className="border-t border-gray-200 pt-6">
            <h4 className="text-sm font-semibold text-gray-900 mb-4">
              Sign Agreement
            </h4>

            {!isSigning ? (
              <button
                onClick={() => onSigningChange(contract.id)}
                style={{ backgroundColor: brandColor }}
                className="w-full px-4 py-2 text-white rounded-lg font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4" />
                I Agree
              </button>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Your Name (Signature)
                  </label>
                  <input
                    type="text"
                    value={signatureName}
                    onChange={(e) => onSignatureNameChange(e.target.value)}
                    placeholder="Enter your full name"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={onSign}
                    disabled={!signatureName.trim()}
                    style={{
                      backgroundColor: signatureName.trim()
                        ? brandColor
                        : "#d1d5db",
                    }}
                    className="flex-1 px-4 py-2 text-white rounded-lg font-medium hover:opacity-90 transition-opacity disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <Check className="w-4 h-4" />
                    Confirm Signature
                  </button>
                  <button
                    onClick={() => {
                      onSigningChange(null);
                      onSignatureNameChange("");
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="border-t border-gray-200 pt-6">
            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
                <div>
                  <h5 className="font-medium text-green-900">
                    Agreement Signed
                  </h5>
                  <p className="text-sm text-green-700 mt-1">
                    Signed by {contract.signatureName}
                  </p>
                  <p className="text-xs text-green-600 mt-1">
                    {formatDate(contract.signedAt)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
