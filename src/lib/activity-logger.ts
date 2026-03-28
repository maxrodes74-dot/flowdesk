// Activity logging utility for tracking business events
import { Message } from "./types";

export type ActivityType =
  | "proposal_sent"
  | "proposal_approved"
  | "proposal_declined"
  | "invoice_sent"
  | "invoice_paid"
  | "milestone_completed"
  | "contract_signed"
  | "milestone_created"
  | "time_entry_logged";

export interface ActivityLog {
  id: string;
  clientId: string;
  type: ActivityType;
  title: string;
  description: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export function createActivityMessage(
  activity: ActivityLog
): Omit<Message, "id" | "createdAt"> {
  return {
    clientId: activity.clientId,
    sender: "freelancer",
    body: `[${activity.type}] ${activity.title}: ${activity.description}`,
    type: "activity",
  };
}

export function createActivityLog(
  clientId: string,
  type: ActivityType,
  title: string,
  description: string,
  metadata?: Record<string, unknown>
): ActivityLog {
  return {
    id: `activity_${Date.now()}`,
    clientId,
    type,
    title,
    description,
    metadata,
    createdAt: new Date().toISOString(),
  };
}

export const ACTIVITY_TEMPLATES: Record<ActivityType, (data: Record<string, unknown>) => { title: string; description: string }> = {
  proposal_sent: (data) => ({
    title: "Proposal Sent",
    description: `Proposal "${data.proposalTitle}" has been sent to the client.`,
  }),
  proposal_approved: (data) => ({
    title: "Proposal Approved",
    description: `Proposal "${data.proposalTitle}" has been approved by the client.`,
  }),
  proposal_declined: (data) => ({
    title: "Proposal Declined",
    description: `Proposal "${data.proposalTitle}" has been declined.`,
  }),
  invoice_sent: (data) => ({
    title: "Invoice Sent",
    description: `Invoice #${data.invoiceNumber} for ${data.amount} has been sent.`,
  }),
  invoice_paid: (data) => ({
    title: "Invoice Paid",
    description: `Invoice #${data.invoiceNumber} has been paid.`,
  }),
  milestone_completed: (data) => ({
    title: "Milestone Completed",
    description: `Milestone "${data.milestoneName}" has been marked as completed.`,
  }),
  contract_signed: (data) => ({
    title: "Contract Signed",
    description: `Contract has been signed and is now active.`,
  }),
  milestone_created: (data) => ({
    title: "Milestone Created",
    description: `New milestone "${data.milestoneName}" has been created.`,
  }),
  time_entry_logged: (data) => ({
    title: "Time Entry Logged",
    description: `${data.duration} of work has been logged.`,
  }),
};
