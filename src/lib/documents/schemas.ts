// =============================================================
// MTR-281: Type-specific content & metadata schemas
// Zod validation + TypeScript types for all document types
// =============================================================

import { z } from "zod";

// ---- Shared types ----

export const DocumentType = z.enum([
  "proposal",
  "invoice",
  "contract",
  "prd",
  "sow",
  "brief",
  "change_order",
  "project_plan",
  "meeting_notes",
  "report",
]);
export type DocumentType = z.infer<typeof DocumentType>;

export const DocumentStatus = z.enum([
  "draft",
  "review",
  "approved",
  "sent",
  "completed",
  "archived",
  "paid",
  "declined",
  "expired",
]);
export type DocumentStatus = z.infer<typeof DocumentStatus>;

export const FileType = z.enum(["pdf", "docx", "pptx", "xlsx"]);
export type FileType = z.infer<typeof FileType>;

// ---- Proposal ----

export const ProposalDeliverable = z.object({
  title: z.string().min(1),
  description: z.string(),
  due_date: z.string().optional(),
});

export const ProposalContent = z.object({
  overview: z.string().min(1),
  deliverables: z.array(ProposalDeliverable).min(1),
  timeline: z.string(),
  pricing: z.string(),
  terms: z.string(),
});
export type ProposalContent = z.infer<typeof ProposalContent>;

export const ProposalMetadata = z.object({
  total_price: z.number().min(0),
  budget: z.string().optional(),
  timeline: z.string().optional(),
  terms: z.string().optional(),
  payment_terms: z.string().optional(),
});
export type ProposalMetadata = z.infer<typeof ProposalMetadata>;

// ---- Invoice ----

export const InvoiceLineItem = z.object({
  description: z.string().min(1),
  quantity: z.number().min(0),
  rate: z.number().min(0),
});

export const InvoiceContent = z.object({
  line_items: z.array(InvoiceLineItem).min(1),
  notes: z.string().optional(),
  payment_terms: z.string().optional(),
});
export type InvoiceContent = z.infer<typeof InvoiceContent>;

export const InvoiceMetadata = z.object({
  line_items: z.array(InvoiceLineItem),
  total: z.number().min(0),
  due_date: z.string(),
  paid_at: z.string().nullable().optional(),
  stripe_payment_id: z.string().nullable().optional(),
  payment_terms: z.string().optional(),
});
export type InvoiceMetadata = z.infer<typeof InvoiceMetadata>;

// ---- Contract / SOW ----

export const ContractClause = z.object({
  id: z.string(),
  name: z.string().min(1),
  content: z.string().min(1),
});

export const ContractContent = z.object({
  clauses: z.array(ContractClause).min(1),
  additional_terms: z.string().optional(),
});
export type ContractContent = z.infer<typeof ContractContent>;

export const ContractMetadata = z.object({
  clauses: z.array(ContractClause).optional(),
  signature_name: z.string().nullable().optional(),
  signature_ip: z.string().nullable().optional(),
  signed_at: z.string().nullable().optional(),
});
export type ContractMetadata = z.infer<typeof ContractMetadata>;

// ---- SOW ----

export const SOWPhase = z.object({
  phase: z.string().min(1),
  description: z.string(),
  deliverables: z.array(z.string()),
});

export const SOWTimeline = z.object({
  phase: z.string(),
  start: z.string(),
  end: z.string(),
  milestones: z.array(z.string()).optional(),
});

export const PaymentScheduleItem = z.object({
  milestone: z.string(),
  amount: z.number().min(0),
  due: z.string(),
});

export const SOWContent = z.object({
  project_overview: z.string().min(1),
  objectives: z.array(z.string()),
  scope_of_work: z.array(SOWPhase),
  timeline: z.array(SOWTimeline),
  assumptions: z.array(z.string()),
  exclusions: z.array(z.string()),
  acceptance_process: z.string().optional(),
  payment_schedule: z.array(PaymentScheduleItem).optional(),
});
export type SOWContent = z.infer<typeof SOWContent>;

export const SOWMetadata = z.object({
  deliverables: z.array(z.string()).optional(),
  assumptions: z.array(z.string()).optional(),
  exclusions: z.array(z.string()).optional(),
  payment_schedule: z.array(PaymentScheduleItem).optional(),
});
export type SOWMetadata = z.infer<typeof SOWMetadata>;

// ---- PRD ----

export const UserStory = z.object({
  as_a: z.string(),
  i_want: z.string(),
  so_that: z.string(),
});

export const Requirement = z.object({
  id: z.string(),
  description: z.string(),
  priority: z.enum(["must", "should", "could"]),
});

export const PRDContent = z.object({
  overview: z.string().min(1),
  problem_statement: z.string(),
  user_stories: z.array(UserStory),
  requirements: z.array(Requirement),
  acceptance_criteria: z
    .array(
      z.object({
        requirement_id: z.string(),
        criteria: z.array(z.string()),
      })
    )
    .optional(),
  out_of_scope: z.array(z.string()).optional(),
  technical_notes: z.string().optional(),
});
export type PRDContent = z.infer<typeof PRDContent>;

export const PRDMetadata = z.object({
  priority: z.string().optional(),
  target_audience: z.string().optional(),
  success_metrics: z.array(z.string()).optional(),
  constraints: z.array(z.string()).optional(),
});
export type PRDMetadata = z.infer<typeof PRDMetadata>;

// ---- Brief ----

export const BriefContent = z.object({
  overview: z.string().min(1),
  objectives: z.array(z.string()),
  target_audience: z.string(),
  tone: z.string(),
  references: z.array(z.string()).optional(),
  constraints: z.string().optional(),
  deliverables: z.array(z.string()).optional(),
});
export type BriefContent = z.infer<typeof BriefContent>;

export const BriefMetadata = z.object({
  objectives: z.array(z.string()).optional(),
  target_audience: z.string().optional(),
  tone: z.string().optional(),
  references: z.array(z.string()).optional(),
  constraints: z.string().optional(),
});
export type BriefMetadata = z.infer<typeof BriefMetadata>;

// ---- Change Order ----

export const ChangeItem = z.object({
  description: z.string(),
  type: z.enum(["addition", "modification", "removal"]),
});

export const ChangeOrderContent = z.object({
  summary: z.string().min(1),
  changes: z.array(ChangeItem),
  reason: z.string(),
  impact_analysis: z.string().optional(),
});
export type ChangeOrderContent = z.infer<typeof ChangeOrderContent>;

export const ChangeOrderMetadata = z.object({
  original_document_id: z.string().optional(),
  changes: z.array(ChangeItem).optional(),
  cost_impact: z.number().optional(),
  timeline_impact: z.string().optional(),
  reason: z.string().optional(),
});
export type ChangeOrderMetadata = z.infer<typeof ChangeOrderMetadata>;

// ---- Project Plan ----

export const ProjectPhase = z.object({
  name: z.string(),
  description: z.string(),
  start: z.string(),
  end: z.string(),
  tasks: z.array(z.string()).optional(),
});

export const ProjectPlanContent = z.object({
  overview: z.string().min(1),
  phases: z.array(ProjectPhase),
  dependencies: z.array(z.string()).optional(),
  risks: z.array(z.string()).optional(),
  resources: z.array(z.string()).optional(),
});
export type ProjectPlanContent = z.infer<typeof ProjectPlanContent>;

export const ProjectPlanMetadata = z.object({
  phases: z.array(ProjectPhase).optional(),
  dependencies: z.array(z.string()).optional(),
  risks: z.array(z.string()).optional(),
  resources: z.array(z.string()).optional(),
});
export type ProjectPlanMetadata = z.infer<typeof ProjectPlanMetadata>;

// ---- Meeting Notes ----

export const ActionItem = z.object({
  description: z.string(),
  assignee: z.string().optional(),
  due_date: z.string().optional(),
});

export const MeetingNotesContent = z.object({
  summary: z.string().min(1),
  attendees: z.array(z.string()),
  agenda_items: z.array(z.string()),
  discussion: z.string(),
  action_items: z.array(ActionItem),
  next_meeting: z.string().optional(),
});
export type MeetingNotesContent = z.infer<typeof MeetingNotesContent>;

export const MeetingNotesMetadata = z.object({
  attendees: z.array(z.string()).optional(),
  agenda_items: z.array(z.string()).optional(),
  action_items: z.array(ActionItem).optional(),
  next_meeting: z.string().optional(),
});
export type MeetingNotesMetadata = z.infer<typeof MeetingNotesMetadata>;

// ---- Report ----

export const ReportContent = z.object({
  summary: z.string().min(1),
  period: z.string(),
  highlights: z.array(z.string()),
  metrics: z.array(z.object({ name: z.string(), value: z.string() })).optional(),
  issues: z.array(z.string()).optional(),
  recommendations: z.array(z.string()).optional(),
});
export type ReportContent = z.infer<typeof ReportContent>;

export const ReportMetadata = z.object({
  period: z.string().optional(),
  metrics: z.array(z.object({ name: z.string(), value: z.string() })).optional(),
  highlights: z.array(z.string()).optional(),
  issues: z.array(z.string()).optional(),
  recommendations: z.array(z.string()).optional(),
});
export type ReportMetadata = z.infer<typeof ReportMetadata>;

// ---- Content schema registry ----

export const contentSchemas: Record<DocumentType, z.ZodType> = {
  proposal: ProposalContent,
  invoice: InvoiceContent,
  contract: ContractContent,
  sow: SOWContent,
  prd: PRDContent,
  brief: BriefContent,
  change_order: ChangeOrderContent,
  project_plan: ProjectPlanContent,
  meeting_notes: MeetingNotesContent,
  report: ReportContent,
};

export const metadataSchemas: Record<DocumentType, z.ZodType> = {
  proposal: ProposalMetadata,
  invoice: InvoiceMetadata,
  contract: ContractMetadata,
  sow: SOWMetadata,
  prd: PRDMetadata,
  brief: BriefMetadata,
  change_order: ChangeOrderMetadata,
  project_plan: ProjectPlanMetadata,
  meeting_notes: MeetingNotesMetadata,
  report: ReportMetadata,
};

// ---- Validate content for a given document type ----

export function validateDocumentContent(
  type: DocumentType,
  content: unknown
): { success: true; data: unknown } | { success: false; error: z.ZodError } {
  const schema = contentSchemas[type];
  if (!schema) return { success: false, error: new z.ZodError([{ code: "custom", message: `Unknown document type: ${type}`, path: ["type"] }]) };
  const result = schema.safeParse(content);
  return result;
}

export function validateDocumentMetadata(
  type: DocumentType,
  metadata: unknown
): { success: true; data: unknown } | { success: false; error: z.ZodError } {
  const schema = metadataSchemas[type];
  if (!schema) return { success: false, error: new z.ZodError([{ code: "custom", message: `Unknown document type: ${type}`, path: ["type"] }]) };
  const result = schema.safeParse(metadata);
  return result;
}
