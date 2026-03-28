import { generateId } from "./utils";
import type { Proposal, ProposalDeliverable } from "./types";

/**
 * Creates milestones from proposal deliverables when a proposal is approved
 * @param proposal - The proposal that was approved
 * @returns Array of milestone objects to be created
 */
export function createMilestonesFromProposal(proposal: Proposal) {
  return proposal.scope.map((deliverable: ProposalDeliverable, index: number) => ({
    id: generateId(),
    proposalId: proposal.id,
    title: deliverable.title,
    description: deliverable.description,
    dueDate: deliverable.dueDate,
    status: "pending" as const,
    sortOrder: index,
    createdAt: new Date().toISOString(),
    invoiceId: null,
  }));
}

/**
 * Handles the side effects when a proposal is marked as approved
 * This function should be called when proposal status changes to "approved"
 * @param proposal - The proposal that was approved
 * @returns Object with milestones to create and notification message
 */
export function handleProposalApproved(proposal: Proposal) {
  const milestones = createMilestonesFromProposal(proposal);

  return {
    success: true,
    milestones,
    message: `Project approved! Created ${milestones.length} milestones from the proposal deliverables.`,
    notificationType: "success" as const,
  };
}

/**
 * Validates if a proposal can be regenerated for a specific section
 */
export type ProposalSection = "scope" | "timeline" | "pricing" | "terms";

export function isValidProposalSection(section: unknown): section is ProposalSection {
  return ["scope", "timeline", "pricing", "terms"].includes(String(section));
}

/**
 * Prepares context for regenerating a specific proposal section
 */
export function getSectionRegenerationContext(proposal: Proposal, section: ProposalSection) {
  return {
    section,
    proposal: {
      title: proposal.title,
      clientName: proposal.clientName,
      brief: proposal.brief,
      currentScope: proposal.scope,
      currentTimeline: proposal.timeline,
      currentBudget: proposal.budget,
      currentPrice: proposal.totalPrice,
      currentTerms: proposal.terms,
    },
  };
}
