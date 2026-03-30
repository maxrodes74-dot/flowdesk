/**
 * Webhook delivery system with retry logic
 * Handles signing, dispatching, and tracking webhook deliveries
 * MTR-291
 */

import { createHash, randomUUID } from 'crypto';
import { createServiceClient } from '@/lib/supabase/service';
import type { WebhookEvent, WebhookPayload } from './types';

/**
 * Sign payload with HMAC-SHA256
 * @param payload JSON string to sign
 * @param secret Webhook secret
 * @returns Hex digest signature
 */
export function signPayload(payload: string, secret: string): string {
  return createHash('sha256')
    .update(payload)
    .update(secret)
    .digest('hex');
}

/**
 * Verify webhook signature
 * @param payload Original JSON payload
 * @param signature Signature from X-Scopepad-Signature header
 * @param secret Webhook secret
 * @returns Whether signature is valid
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const expected = signPayload(payload, secret);
  return signature === expected;
}

/**
 * Retry delays in milliseconds: 10s, 60s, 300s
 */
const RETRY_DELAYS = [10000, 60000, 300000];

/**
 * Dispatch a webhook event to all subscribed endpoints
 * Handles signing, delivery, and retry logic
 *
 * @param freelancerId Freelancer ID (webhook owner)
 * @param event Webhook event type
 * @param data Event payload data
 */
export async function dispatchWebhookEvent(
  freelancerId: string,
  event: WebhookEvent,
  data: Record<string, unknown>
): Promise<void> {
  const supabase = createServiceClient();

  // Get active webhooks subscribed to this event
  const { data: webhooks, error } = await supabase
    .from('webhooks')
    .select('*')
    .eq('freelancer_id', freelancerId)
    .eq('is_active', true)
    .contains('events', [event]);

  if (error || !webhooks) {
    console.error(`Failed to fetch webhooks for freelancer ${freelancerId}:`, error);
    return;
  }

  if (webhooks.length === 0) {
    return; // No subscribed webhooks
  }

  // Build payload
  const payload: WebhookPayload = {
    event,
    timestamp: new Date().toISOString(),
    data,
  };

  const payloadJson = JSON.stringify(payload);

  // Dispatch to each webhook
  for (const webhook of webhooks) {
    try {
      await _deliverWebhook(webhook.id, webhook.url, webhook.secret, event, payloadJson);
    } catch (err) {
      console.error(`Failed to dispatch webhook ${webhook.id}:`, err);
      // Continue with other webhooks
    }
  }
}

/**
 * Internal: Deliver webhook with retry scheduling
 */
async function _deliverWebhook(
  webhookId: string,
  url: string,
  secret: string,
  event: WebhookEvent,
  payloadJson: string
): Promise<void> {
  const deliveryId = randomUUID();
  const signature = signPayload(payloadJson, secret);

  // Attempt delivery with timeout
  const result = await _attemptDelivery(
    url,
    signature,
    event,
    deliveryId,
    payloadJson,
    1
  );

  // Log delivery record
  const supabase = createServiceClient();
  await supabase.from('webhook_deliveries').insert({
    id: deliveryId,
    webhook_id: webhookId,
    event,
    payload: JSON.parse(payloadJson),
    status_code: result.statusCode,
    response_body: result.responseBody,
    attempt: 1,
    success: result.success,
    delivered_at: new Date().toISOString(),
  });

  // Schedule retries if failed
  if (!result.success) {
    for (let attempt = 2; attempt <= 3; attempt++) {
      const delay = RETRY_DELAYS[attempt - 2];
      setTimeout(async () => {
        const retryResult = await _attemptDelivery(
          url,
          signature,
          event,
          deliveryId,
          payloadJson,
          attempt
        );

        await supabase.from('webhook_deliveries').insert({
          id: randomUUID(),
          webhook_id: webhookId,
          event,
          payload: JSON.parse(payloadJson),
          status_code: retryResult.statusCode,
          response_body: retryResult.responseBody,
          attempt,
          success: retryResult.success,
          delivered_at: new Date().toISOString(),
        });
      }, delay);
    }
  }
}

/**
 * Internal: Make HTTP request to webhook endpoint
 */
async function _attemptDelivery(
  url: string,
  signature: string,
  event: WebhookEvent,
  deliveryId: string,
  payloadJson: string,
  attempt: number
): Promise<{ success: boolean; statusCode: number | null; responseBody: string | null }> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Scopepad-Signature': signature,
        'X-Scopepad-Event': event,
        'X-Scopepad-Delivery': deliveryId,
      },
      body: payloadJson,
      signal: controller.signal,
    });

    const responseBody = await response.text();

    return {
      success: response.ok,
      statusCode: response.status,
      responseBody: responseBody.length > 500 ? responseBody.substring(0, 500) : responseBody,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      statusCode: null,
      responseBody: `Delivery failed: ${message}`,
    };
  } finally {
    clearTimeout(timeoutId);
  }
}
