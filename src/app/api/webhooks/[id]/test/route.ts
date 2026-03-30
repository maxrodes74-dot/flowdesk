/**
 * =============================================================
 * MTR-291: Webhook Test Endpoint
 * POST /api/webhooks/[id]/test — Send test webhook delivery
 * =============================================================
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { signPayload } from '@/lib/webhooks/deliver';
import { randomUUID } from 'crypto';
import type { WebhookPayload } from '@/lib/webhooks/types';

/**
 * POST /api/webhooks/[id]/test
 * Sends a test webhook with sample payload to verify endpoint works
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Get webhook
  const { data: webhook, error: fetchError } = await supabase
    .from('webhooks')
    .select('*')
    .eq('id', id)
    .eq('freelancer_id', user.id)
    .single();

  if (fetchError || !webhook) {
    return NextResponse.json({ error: 'Webhook not found' }, { status: 404 });
  }

  // Create test payload
  const deliveryId = randomUUID();
  const payload: WebhookPayload = {
    event: 'document.created',
    timestamp: new Date().toISOString(),
    data: {
      id: 'test_doc_' + Date.now(),
      title: 'Test Document - Webhook Configuration',
      client_name: 'Test Client',
      document_type: 'proposal',
      status: 'draft',
      created_at: new Date().toISOString(),
      test: true,
    },
  };

  const payloadJson = JSON.stringify(payload);
  const signature = signPayload(payloadJson, webhook.secret);

  // Attempt delivery with 5 second timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);

  let statusCode: number | null = null;
  let responseBody: string | null = null;
  let success = false;
  let errorMessage: string | null = null;

  try {
    const response = await fetch(webhook.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Scopepad-Signature': signature,
        'X-Scopepad-Event': 'document.created',
        'X-Scopepad-Delivery': deliveryId,
      },
      body: payloadJson,
      signal: controller.signal,
    });

    statusCode = response.status;
    success = response.ok;
    responseBody = await response.text();

    // Truncate response body if too long
    if (responseBody && responseBody.length > 500) {
      responseBody = responseBody.substring(0, 500) + '...';
    }
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        errorMessage = 'Request timeout (5 seconds)';
      } else {
        errorMessage = error.message;
      }
    } else {
      errorMessage = String(error);
    }
    responseBody = errorMessage;
  } finally {
    clearTimeout(timeoutId);
  }

  // Log test delivery
  await (supabase.from('webhook_deliveries') as any).insert({
    id: deliveryId,
    webhook_id: id,
    event: 'document.created',
    payload: payload as unknown as Record<string, unknown>,
    status_code: statusCode,
    response_body: responseBody,
    attempt: 1,
    success,
    delivered_at: new Date().toISOString(),
  });

  return NextResponse.json(
    {
      success,
      delivery: {
        id: deliveryId,
        status_code: statusCode,
        response_body: responseBody,
        error: errorMessage,
      },
      message: success
        ? 'Test webhook delivered successfully'
        : 'Test webhook failed — check endpoint and try again',
    },
    { status: success ? 200 : 400 }
  );
}
