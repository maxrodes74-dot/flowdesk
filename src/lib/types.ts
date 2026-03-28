// ============================================================
// FlowDesk Type Definitions
// ============================================================

export type Profession =
  | "developer"
  | "designer"
  | "writer"
  | "consultant"
  | "photographer"
  | "videographer"
  | "other";

export type TonePreference =
  | "professional"
  | "friendly"
  | "confident";

export type SubscriptionTier = "free" | "pro" | "pro+";

export interface Freelancer {
  id: string;
  userId: string;
  name: string;
  email: string;
  profession: Profession;
  hourlyRate: number;
  tone: TonePreference;
  services: string;
  brandColor: string;
  logoUrl: string | null;
  portfolioUrl: string | null;
  stripeAccountId: string | null;
  subscriptionTier: SubscriptionTier;
  aiGenerationsUsedThisMonth: number;
  createdAt: string;
}

export interface Client {
  id: string;
  freelancerId: string;
  name: string;
  email: string;
  company: string;
  portalSlug: string;
  createdAt: string;
}

export type ProposalStatus = "draft" | "sent" | "viewed" | "approved" | "declined";

export interface ProposalDeliverable {
  title: string;
  description: string;
  dueDate: string;
}

export interface Proposal {
  id: string;
  freelancerId: string;
  clientId: string;
  clientName: string;
  title: string;
  brief: string;
  scope: ProposalDeliverable[];
  timeline: string;
  budget: string;
  totalPrice: number;
  terms: string;
  status: ProposalStatus;
  aiGenerated: boolean;
  createdAt: string;
}

export type InvoiceStatus = "draft" | "sent" | "viewed" | "paid" | "overdue";

export interface InvoiceLineItem {
  description: string;
  quantity: number;
  rate: number;
}

export interface Invoice {
  id: string;
  freelancerId: string;
  clientId: string;
  clientName: string;
  lineItems: InvoiceLineItem[];
  total: number;
  status: InvoiceStatus;
  dueDate: string;
  paidAt: string | null;
  paymentTerms: string;
  stripePaymentId: string | null;
  createdAt: string;
}

export interface Message {
  id: string;
  clientId: string;
  sender: "freelancer" | "client";
  body: string;
  type?: "message" | "activity";
  createdAt: string;
}

export type MilestoneStatus = "pending" | "in_progress" | "completed";

export interface Milestone {
  id: string;
  proposalId: string;
  title: string;
  description: string;
  dueDate: string;
  status: MilestoneStatus;
  sortOrder: number;
  invoiceId: string | null;
  createdAt: string;
}

export interface TimeEntry {
  id: string;
  freelancerId: string;
  clientId: string;
  date: string;
  durationMinutes: number;
  description: string;
  milestoneId: string | null;
  createdAt: string;
}

export interface ContractClause {
  id: string;
  name: string;
  content: string;
}

export interface Contract {
  id: string;
  proposalId: string;
  clauses: ContractClause[];
  signatureName: string | null;
  signatureIp: string | null;
  signedAt: string | null;
  createdAt: string;
}

export interface DashboardStats {
  activeClients: number;
  proposalsSent: number;
  proposalsApproved: number;
  totalRevenue: number;
  pendingInvoices: number;
  overdueInvoices: number;
}

// ============================================================
// Automation Types
// ============================================================

export type AutomationType =
  | "payment_reminders"
  | "scope_creep_detection"
  | "project_wrap_up"
  | "re_engagement_ping";

export interface PaymentReminderConfig {
  enabled: boolean;
  escalationSchedule: {
    day1: boolean;
    day7: boolean;
    day14: boolean;
  };
  lateFee?: {
    type: "percentage" | "flat";
    amount: number;
  };
}

export interface ScopeCreepConfig {
  enabled: boolean;
  sensitivityLevel: "strict" | "moderate" | "relaxed";
  autoDraftChangeOrder: boolean;
}

export interface ProjectWrapUpConfig {
  enabled: boolean;
  delayDays: number;
  includeTestimonialRequest: boolean;
  includeReferralAsk: boolean;
}

export interface ReEngagementConfig {
  enabled: boolean;
  inactivityThresholdDays: number;
}

export interface Automation {
  id: string;
  freelancerId: string;
  type: AutomationType;
  enabled: boolean;
  config:
    | PaymentReminderConfig
    | ScopeCreepConfig
    | ProjectWrapUpConfig
    | ReEngagementConfig;
  createdAt: string;
}

// ============================================================
// Testimonial Types
// ============================================================

export interface Testimonial {
  id: string;
  clientId: string;
  freelancerId: string;
  rating: 1 | 2 | 3 | 4 | 5;
  text: string;
  clientName: string;
  permissionToPublish: boolean;
  createdAt: string;
}

export interface TestimonialRequest {
  id: string;
  freelancerId: string;
  clientId: string;
  token: string;
  email: string;
  expiresAt: string;
  completed: boolean;
  createdAt: string;
}

// ============================================================
// Referral Types
// ============================================================

export interface Referral {
  id: string;
  freelancerId: string;
  referrerClientId: string;
  referredClientId: string | null;
  code: string;
  incentiveType: "discount" | "credit";
  incentiveValue: number;
  conversionStatus: "pending" | "converted" | "expired";
  createdAt: string;
}

export interface ReferralSettings {
  freelancerId: string;
  enabled: boolean;
  incentiveType: "discount" | "credit";
  incentiveValue: number;
  description: string;
  createdAt: string;
}
