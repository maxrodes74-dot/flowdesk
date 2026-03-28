"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/lib/store";
import { createClient } from "@/lib/supabase/client";
import { rowToProposal } from "@/lib/supabase/data";
import type { Json } from "@/lib/supabase/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Proposal } from "@/lib/types";
import {
  Sparkles,
  ArrowLeft,
  RotateCcw,
  Save,
  Send,
  Edit2,
  Loader,
} from "lucide-react";

type Phase = "input" | "preview";

interface FormData {
  clientName: string;
  clientEmail: string;
  isNewClient: boolean;
  projectBrief: string;
  timeline: string;
  budgetRange: string;
}

export default function NewProposalPage() {
  const router = useRouter();
  const { state, dispatch } = useApp();
  const [phase, setPhase] = useState<Phase>("input");
  const [isLoading, setIsLoading] = useState(false);
  const [editingField, setEditingField] = useState<string | null>(null);

  const [formData, setFormData] = useState<FormData>({
    clientName: "",
    clientEmail: "",
    isNewClient: false,
    projectBrief: "",
    timeline: "",
    budgetRange: "",
  });

  const [generatedProposal, setGeneratedProposal] = useState<
    Omit<Proposal, "id" | "freelancerId" | "clientId" | "createdAt"> | null
  >(null);

  const [editedProposal, setEditedProposal] = useState<
    Omit<Proposal, "id" | "freelancerId" | "clientId" | "createdAt"> | null
  >(null);

  const handleClientSelect = (clientName: string, clientEmail: string) => {
    setFormData((prev) => ({
      ...prev,
      clientName,
      clientEmail,
      isNewClient: false,
    }));
  };

  const handleNewClient = () => {
    setFormData((prev) => ({
      ...prev,
      isNewClient: true,
      clientName: "",
      clientEmail: "",
    }));
  };

  const [validationError, setValidationError] = useState<string | null>(null);

  const handleGenerateProposal = async () => {
    setValidationError(null);

    // Client-side validation
    if (formData.clientName.length > 200) {
      setValidationError("Client name must be under 200 characters.");
      return;
    }
    if (formData.projectBrief.length > 5000) {
      setValidationError("Project brief must be under 5,000 characters.");
      return;
    }
    if (formData.projectBrief.trim().length < 10) {
      setValidationError("Project brief should be at least 10 characters.");
      return;
    }
    if (formData.timeline.length > 200) {
      setValidationError("Timeline must be under 200 characters.");
      return;
    }
    if (formData.budgetRange.length > 200) {
      setValidationError("Budget range must be under 200 characters.");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/generate-proposal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientName: formData.clientName,
          brief: formData.projectBrief,
          timeline: formData.timeline,
          budget: formData.budgetRange,
          freelancerName: state.freelancer?.name,
          profession: state.freelancer?.profession,
          tone: state.freelancer?.tone,
          services: state.freelancer?.services,
          hourlyRate: state.freelancer?.hourlyRate,
        }),
      });

      if (!res.ok) throw new Error("Generation failed");

      const generated = await res.json();
      setGeneratedProposal(generated);
      setEditedProposal(generated);
      setPhase("preview");
    } catch {
      // Fallback: generate a template locally if API fails
      const budgetNum =
        parseInt(formData.budgetRange.replace(/[^0-9]/g, "")) || 5000;
      const fallback = {
        clientName: formData.clientName,
        title: `Project Proposal: ${formData.projectBrief.split(".")[0].substring(0, 60)}`,
        brief: formData.projectBrief,
        scope: [
          {
            title: "Discovery & Planning",
            description:
              "Deep dive into requirements, technical scoping, and project roadmap creation.",
            dueDate: new Date(Date.now() + 14 * 86400000)
              .toISOString()
              .split("T")[0],
          },
          {
            title: "Core Development",
            description:
              "Implementation of primary features and functionality with regular check-ins.",
            dueDate: new Date(Date.now() + 35 * 86400000)
              .toISOString()
              .split("T")[0],
          },
          {
            title: "Refinement & Testing",
            description:
              "QA, performance optimization, and user acceptance testing. Two rounds of revisions.",
            dueDate: new Date(Date.now() + 49 * 86400000)
              .toISOString()
              .split("T")[0],
          },
          {
            title: "Launch & Handoff",
            description:
              "Deployment, documentation, knowledge transfer, and post-launch support.",
            dueDate: new Date(Date.now() + 56 * 86400000)
              .toISOString()
              .split("T")[0],
          },
        ],
        timeline: formData.timeline || "8 weeks",
        budget: formData.budgetRange,
        totalPrice: budgetNum,
        terms:
          "Payment split across milestones: 30% upfront, 30% at midpoint, 40% on completion. Two rounds of revisions per milestone. Net 15 payment terms.",
        status: "draft" as const,
        aiGenerated: true,
      };
      setGeneratedProposal(fallback);
      setEditedProposal(fallback);
      setPhase("preview");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegenerate = async () => {
    setPhase("input");
    setGeneratedProposal(null);
    setEditedProposal(null);
  };

  const saveProposal = async (status: "draft" | "sent") => {
    if (!state.freelancer || !editedProposal) return;

    const supabase = createClient();

    // Find or create client
    let clientId: string;
    const existingClient = state.clients.find(
      (c) => c.name === formData.clientName
    );

    if (existingClient) {
      clientId = existingClient.id;
    } else {
      // Create new client with unique portal slug
      let baseSlug = formData.clientName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

      // Check for slug collisions and append suffix if needed
      let slug = baseSlug;
      let slugSuffix = 0;
      const { data: existingSlugs } = await supabase
        .from("clients")
        .select("portal_slug")
        .eq("freelancer_id", state.freelancer.id)
        .like("portal_slug", `${baseSlug}%`);

      if (existingSlugs && existingSlugs.length > 0) {
        const takenSlugs = new Set(existingSlugs.map((r) => r.portal_slug));
        while (takenSlugs.has(slug)) {
          slugSuffix++;
          slug = `${baseSlug}-${slugSuffix}`;
        }
      }

      const { data: newClient, error: clientError } = await supabase
        .from("clients")
        .insert({
          freelancer_id: state.freelancer.id,
          name: formData.clientName,
          email: formData.clientEmail || "",
          company: "",
          portal_slug: slug,
        })
        .select()
        .single();

      if (clientError || !newClient) {
        alert("Failed to create client: " + clientError?.message);
        return;
      }

      clientId = newClient.id;
      dispatch({
        type: "ADD_CLIENT",
        payload: {
          id: newClient.id,
          freelancerId: newClient.freelancer_id,
          name: newClient.name,
          email: newClient.email,
          company: newClient.company || "",
          portalSlug: newClient.portal_slug,
          createdAt: newClient.created_at,
        },
      });
    }

    // Insert proposal
    const { data: proposalRow, error: proposalError } = await supabase
      .from("proposals")
      .insert({
        freelancer_id: state.freelancer.id,
        client_id: clientId,
        title: editedProposal.title,
        brief: editedProposal.brief,
        scope_json: editedProposal.scope as unknown as Json,
        timeline: editedProposal.timeline,
        budget: editedProposal.budget,
        total_price: editedProposal.totalPrice,
        terms: editedProposal.terms,
        status,
        ai_generated: editedProposal.aiGenerated,
      })
      .select()
      .single();

    if (proposalError || !proposalRow) {
      alert("Failed to save proposal: " + proposalError?.message);
      return;
    }

    const proposal = rowToProposal(proposalRow, formData.clientName);
    dispatch({ type: "ADD_PROPOSAL", payload: proposal });

    router.push("/dashboard/proposals");
  };

  const handleSaveDraft = () => saveProposal("draft");
  const handleSendToClient = () => saveProposal("sent");

  if (phase === "input") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <button
            onClick={() => router.push("/dashboard/proposals")}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-8 transition-colors"
          >
            <ArrowLeft size={20} />
            Back to Proposals
          </button>

          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-4xl font-bold text-slate-900">
                Create a New Proposal
              </h1>
              <Sparkles size={32} className="text-blue-600" />
            </div>
            <p className="text-lg text-slate-600">
              Describe your project in a few sentences. AI will handle the rest.
            </p>
          </div>

          {/* Form Card */}
          <div className="bg-white rounded-lg shadow-lg p-8 border border-slate-200">
            {/* Client Selection */}
            <div className="mb-8">
              <label className="block text-sm font-semibold text-slate-900 mb-3">
                Client
              </label>
              {!formData.isNewClient ? (
                <>
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    {state.clients.map((client) => (
                      <button
                        key={client.id}
                        onClick={() =>
                          handleClientSelect(client.name, client.email)
                        }
                        className={`p-3 rounded-lg border-2 text-left transition-all ${
                          formData.clientName === client.name
                            ? "border-blue-600 bg-blue-50"
                            : "border-slate-200 hover:border-slate-300 bg-slate-50"
                        }`}
                      >
                        <p className="font-medium text-slate-900">
                          {client.name}
                        </p>
                        <p className="text-sm text-slate-600">{client.email}</p>
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={handleNewClient}
                    className="w-full py-3 px-4 border-2 border-dashed border-slate-300 text-slate-700 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all font-medium"
                  >
                    + New Client
                  </button>
                </>
              ) : (
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="Client Name"
                    value={formData.clientName}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        clientName: e.target.value,
                      }))
                    }
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500"
                  />
                  <input
                    type="email"
                    placeholder="Client Email"
                    value={formData.clientEmail}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        clientEmail: e.target.value,
                      }))
                    }
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500"
                  />
                  <button
                    onClick={() =>
                      setFormData((prev) => ({
                        ...prev,
                        isNewClient: false,
                        clientName: "",
                        clientEmail: "",
                      }))
                    }
                    className="w-full py-2 text-slate-600 hover:text-slate-900 text-sm font-medium"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>

            {/* Project Brief */}
            <div className="mb-8">
              <label className="block text-sm font-semibold text-slate-900 mb-3">
                Project Brief
              </label>
              <textarea
                placeholder="e.g., Redesign the company website with a modern look, improve the checkout flow, and make it mobile-friendly."
                value={formData.projectBrief}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    projectBrief: e.target.value,
                  }))
                }
                maxLength={5000}
                rows={6}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500 resize-none"
              />
              <p className="text-xs text-slate-500 mt-1 text-right">
                {formData.projectBrief.length}/5,000
              </p>
            </div>

            {/* Timeline */}
            <div className="mb-8">
              <label className="block text-sm font-semibold text-slate-900 mb-3">
                Estimated Timeline
              </label>
              <input
                type="text"
                placeholder="e.g., 6 weeks, 2 months"
                value={formData.timeline}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    timeline: e.target.value,
                  }))
                }
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Budget Range */}
            <div className="mb-8">
              <label className="block text-sm font-semibold text-slate-900 mb-3">
                Budget Range
              </label>
              <input
                type="text"
                placeholder="e.g., $5,000 - $8,000"
                value={formData.budgetRange}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    budgetRange: e.target.value,
                  }))
                }
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Validation Error */}
            {validationError && (
              <div className="mb-6 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3">
                {validationError}
              </div>
            )}

            {/* Generate Button */}
            <button
              onClick={handleGenerateProposal}
              disabled={
                !formData.clientName ||
                !formData.projectBrief ||
                !formData.timeline ||
                !formData.budgetRange ||
                isLoading
              }
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white py-4 rounded-lg font-bold text-lg flex items-center justify-center gap-2 transition-colors"
            >
              {isLoading ? (
                <>
                  <Loader size={20} className="animate-spin" />
                  AI is crafting your proposal...
                </>
              ) : (
                <>
                  <Sparkles size={20} />
                  Generate Proposal with AI
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Preview Phase
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <button
          onClick={handleRegenerate}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-8 transition-colors"
        >
          <ArrowLeft size={20} />
          Back to Editing
        </button>

        {/* Document Preview */}
        <div className="bg-white rounded-lg shadow-2xl p-12 border border-slate-200">
          {editedProposal && (
            <>
              {/* Title Section */}
              <div className="mb-8 pb-8 border-b-2 border-slate-200">
                <h1 className="text-4xl font-bold text-slate-900 mb-2">
                  {editedProposal.title}
                </h1>
                <p className="text-xl text-slate-600">
                  For: <span className="font-semibold">{formData.clientName}</span>
                </p>
                <p className="text-sm text-slate-500 mt-2">
                  {formatDate(new Date().toISOString())}
                </p>
              </div>

              {/* Scope Section */}
              <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold text-slate-900">
                    Deliverables & Timeline
                  </h2>
                  {editingField !== "scope" && (
                    <button
                      onClick={() => setEditingField("scope")}
                      className="flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                      <Edit2 size={16} />
                      Edit
                    </button>
                  )}
                </div>

                {editingField === "scope" ? (
                  <div className="space-y-4 bg-blue-50 p-4 rounded-lg">
                    {editedProposal.scope.map((item, idx) => (
                      <div key={idx} className="space-y-2">
                        <input
                          type="text"
                          value={item.title}
                          onChange={(e) => {
                            const updated = [...editedProposal.scope];
                            updated[idx].title = e.target.value;
                            setEditedProposal({
                              ...editedProposal,
                              scope: updated,
                            });
                          }}
                          className="w-full px-3 py-2 border border-slate-300 rounded font-semibold text-slate-900"
                        />
                        <textarea
                          value={item.description}
                          onChange={(e) => {
                            const updated = [...editedProposal.scope];
                            updated[idx].description = e.target.value;
                            setEditedProposal({
                              ...editedProposal,
                              scope: updated,
                            });
                          }}
                          className="w-full px-3 py-2 border border-slate-300 rounded text-slate-700 resize-none"
                          rows={2}
                        />
                      </div>
                    ))}
                    <button
                      onClick={() => setEditingField(null)}
                      className="w-full py-2 mt-4 bg-slate-900 text-white rounded hover:bg-slate-800 text-sm font-medium"
                    >
                      Done Editing
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {editedProposal.scope.map((item, idx) => (
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
                          <p className="text-slate-700 mt-1">
                            {item.description}
                          </p>
                          <p className="text-sm text-slate-500 mt-2">
                            Due: {formatDate(item.dueDate)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Timeline & Budget Section */}
              <div className="grid grid-cols-2 gap-8 mb-8 p-6 bg-slate-50 rounded-lg">
                <div>
                  <h3 className="font-bold text-slate-900 mb-2">Timeline</h3>
                  <p className="text-2xl font-bold text-blue-600">
                    {editedProposal.timeline}
                  </p>
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 mb-2">Total Budget</h3>
                  <p className="text-2xl font-bold text-blue-600">
                    {formatCurrency(editedProposal.totalPrice)}
                  </p>
                  <p className="text-sm text-slate-600 mt-1">
                    {editedProposal.budget}
                  </p>
                </div>
              </div>

              {/* Terms Section */}
              <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold text-slate-900">
                    Terms & Conditions
                  </h2>
                  {editingField !== "terms" && (
                    <button
                      onClick={() => setEditingField("terms")}
                      className="flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                      <Edit2 size={16} />
                      Edit
                    </button>
                  )}
                </div>

                {editingField === "terms" ? (
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <textarea
                      value={editedProposal.terms}
                      onChange={(e) =>
                        setEditedProposal({
                          ...editedProposal,
                          terms: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-slate-300 rounded text-slate-700 resize-none"
                      rows={4}
                    />
                    <button
                      onClick={() => setEditingField(null)}
                      className="w-full py-2 mt-4 bg-slate-900 text-white rounded hover:bg-slate-800 text-sm font-medium"
                    >
                      Done Editing
                    </button>
                  </div>
                ) : (
                  <p className="text-slate-700 whitespace-pre-wrap">
                    {editedProposal.terms}
                  </p>
                )}
              </div>
            </>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 mt-8 justify-center">
          <button
            onClick={handleRegenerate}
            className="flex items-center gap-2 px-6 py-3 border border-slate-300 text-slate-900 rounded-lg hover:bg-slate-100 font-semibold transition-colors"
          >
            <RotateCcw size={20} />
            Regenerate
          </button>
          <button
            onClick={handleSaveDraft}
            className="flex items-center gap-2 px-6 py-3 border border-blue-300 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 font-semibold transition-colors"
          >
            <Save size={20} />
            Save as Draft
          </button>
          <button
            onClick={handleSendToClient}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition-colors"
          >
            <Send size={20} />
            Send to Client
          </button>
        </div>
      </div>
    </div>
  );
}
