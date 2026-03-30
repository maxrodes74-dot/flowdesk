/**
 * Webhook types and interfaces for ScopePad
 * MTR-291: Webhook system with event-driven architecture
 */

export type WebhookEvent =
  | 'document.created'
  | 'document.updated'
  | 'document.sent'
  | 'document.approved'
  | 'document.declined'
  | 'invoice.paid'
  | 'client.created';

export const ALL_WEBHOOK_EVENTS: WebhookEvent[] = [
  'document.created',
  'document.updated',
  'document.sent',
  'document.approved',
  'document.declined',
  'invoice.paid',
  'client.created',
];

/**
 * Webhook configuration stored in database
 */
export interface Webhook {
  id: string;
  freelancer_id: string;
  url: string;
  secret: string;
  events: WebhookEvent[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Webhook delivery record for audit trail and retry tracking
 */
export interface WebhookDelivery {
  id: string;
  webhook_id: string;
  event: WebhookEvent;
  payload: Record<string, unknown>;
  status_code: number | null;
  response_body: string | null;
  attempt: number;
  success: boolean;
  delivered_at: string;
}

/**
 * Input validation for creating/updating webhooks
 */
export interface CreateWebhookInput {
  url: string;
  events: WebhookEvent[];
}

export interface UpdateWebhookInput {
  url?: string;
  events?: WebhookEvent[];
  is_active?: boolean;
}

/**
 * Webhook payload sent to endpoint
 */
export interface WebhookPayload {
  event: WebhookEvent;
  timestamp: string;
  data: Record<string, unknown>;
}

/**
 * Response format for webhook list endpoints
 */
export interface WebhookWithDeliveries extends Webhook {
  recent_deliveries?: WebhookDelivery[];
}
