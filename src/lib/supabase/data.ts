// Helper functions to convert between Supabase snake_case rows and our camelCase types

import type { Freelancer, Client, Proposal, Invoice, Message, ProposalDeliverable, SubscriptionTier } from "../types";

export function rowToFreelancer(row: Record<string, unknown>): Freelancer {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    name: row.name as string,
    email: row.email as string,
    profession: row.profession as Freelancer["profession"],
    hourlyRate: row.hourly_rate as number,
    tone: row.tone as Freelancer["tone"],
    services: row.services as string,
    brandColor: row.brand_color as string,
    logoUrl: (row.logo_url as string) || null,
    portfolioUrl: (row.portfolio_url as string) || null,
    stripeAccountId: (row.stripe_account_id as string) || null,
    subscriptionTier: (row.subscription_tier as SubscriptionTier) || "free",
    aiGenerationsUsedThisMonth: (row.ai_generations_used_this_month as number) || 0,
    createdAt: row.created_at as string,
  };
}

export function rowToClient(row: Record<string, unknown>): Client {
  return {
    id: row.id as string,
    freelancerId: row.freelancer_id as string,
    name: row.name as string,
    email: row.email as string,
    company: (row.company as string) || "",
    portalSlug: row.portal_slug as string,
    createdAt: row.created_at as string,
  };
}

export function rowToProposal(
  row: Record<string, unknown>,
  clientName: string
): Proposal {
  const scopeJson = row.scope_json as ProposalDeliverable[] | null;
  return {
    id: row.id as string,
    freelancerId: row.freelancer_id as string,
    clientId: row.client_id as string,
    clientName,
    title: row.title as string,
    brief: row.brief as string,
    scope: Array.isArray(scopeJson) ? scopeJson : [],
    timeline: row.timeline as string,
    budget: row.budget as string,
    totalPrice: row.total_price as number,
    terms: row.terms as string,
    status: row.status as Proposal["status"],
    aiGenerated: row.ai_generated as boolean,
    createdAt: row.created_at as string,
  };
}

export function rowToInvoice(
  row: Record<string, unknown>,
  clientName: string
): Invoice {
  return {
    id: row.id as string,
    freelancerId: row.freelancer_id as string,
    clientId: row.client_id as string,
    clientName,
    lineItems: (row.line_items as Invoice["lineItems"]) || [],
    total: row.total as number,
    status: row.status as Invoice["status"],
    dueDate: row.due_date as string,
    paidAt: (row.paid_at as string) || null,
    paymentTerms: row.payment_terms as string,
    stripePaymentId: (row.stripe_payment_id as string) || null,
    createdAt: row.created_at as string,
  };
}

export function rowToMessage(row: Record<string, unknown>): Message {
  return {
    id: row.id as string,
    clientId: row.client_id as string,
    sender: row.sender as Message["sender"],
    body: row.body as string,
    createdAt: row.created_at as string,
  };
}

export function rowToAutomation(row: Record<string, unknown>) {
  return {
    id: row.id as string,
    freelancerId: row.freelancer_id as string,
    type: row.type as string,
    enabled: row.enabled as boolean,
    config: row.config as Record<string, unknown>,
    createdAt: row.created_at as string,
  };
}
