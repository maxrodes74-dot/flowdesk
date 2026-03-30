/**
 * =============================================================
 * MTR-291: Webhook Detail Operations
 * GET    /api/webhooks/[id]  — Get webhook with delivery history
 * PUT    /api/webhooks/[id]  — Update webhook
 * DELETE /api/webhooks/[id]  — Delete webhook
 * POST   /api/webhooks/[id]  — Test webhook delivery
 * =============================================================
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { dispatchWebhookEvent, signPayload } from '@/lib/webhooks/deliver';
import { z } from 'zod';
import { randomUUID } from 'crypto';
import type { UpdateWebhookInput, WebhookPayload } from '@/lib/webhooks/types';

const UpdateWebhookSchema = z.object({
  url: z.string().url().optional(),
  events: z
    .array(
      z.enum([
        'document.created',
        'document.updated',
        'document.sent',
        'document.approved',
        'document.declined',
        'invoice.paid',
        'client.created',
      ])
    )
    .optional(),
  is_active: z.boolean().optional(),
});

/**
 * GET /api/webhooks/[id]
 * Get single webhook with delivery history
 */
export async function GET(
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
  const { data: webhook, error } = await supabase
    .from('webhooks')
    .select('*')
    .eq('id', id)
    .eq('freelancer_id', user.id)
    .single();

  if (error || !webhook) {
    return NextResponse.json({ error: 'Webhook not found' }, { status: 404 });
  }

  // Get recent deliveries
  const { data: deliveries } = await supabase
    .from('webhook_deliveries')
    .select('*')
    .eq('webhook_id', id)
    .order('delivered_at', { ascending: false })
    .limit(20);

  return NextResponse.json({
    webhook,
    deliveries: deliveries || [],
  });
}

/**
 * PUT /api/webhooks/[id]
 * Update webhook URL, events, or active status
 */
export async function PUT(
  request: NextRequest,
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

  // Parse and validate request body
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parseResult = UpdateWebhookSchema.safeParse(body);
  if (!parseResult.success) {
    return NextResponse.json(
      {
        error: 'Validation failed',
        details: parseResult.error.issues,
      },
      { status: 400 }
    );
  }

  // Verify ownership
  const { data: webhook, error: fetchError } = await supabase
    .from('webhooks')
    .select('*')
    .eq('id', id)
    .eq('freelancer_id', user.id)
    .single();

  if (fetchError || !webhook) {
    return NextResponse.json({ error: 'Webhook not found' }, { status: 404 });
  }

  // Build update object
  const updateData: Record<string, unknown> = {};
  if (parseResult.data.url !== undefined) updateData.url = parseResult.data.url;
  if (parseResult.data.events !== undefined) updateData.events = parseResult.data.events;
  if (parseResult.data.is_active !== undefined) updateData.is_active = parseResult.data.is_active;
  updateData.updated_at = new Date().toISOString();

  // Update webhook
  const { data: updated, error: updateError } = await supabase
    .from('webhooks')
    .update(updateData)
    .eq('id', id)
    .eq('freelancer_id', user.id)
    .select()
    .single();

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ webhook: updated });
}

/**
 * DELETE /api/webhooks/[id]
 * Hard delete webhook
 */
export async function DELETE(
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

  // Verify ownership before deleting
  const { data: webhook, error: fetchError } = await supabase
    .from('webhooks')
    .select('id')
    .eq('id', id)
    .eq('freelancer_id', user.id)
    .single();

  if (fetchError || !webhook) {
    return NextResponse.json({ error: 'Webhook not found' }, { status: 404 });
  }

  // Delete webhook and its deliveries (cascade should handle this)
  const { error: deleteError } = await supabase
    .from('webhooks')
    .delete()
    .eq('id', id)
    .eq('freelancer_id', user.id);

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

/**
 * POST /api/webhooks/[id]
 * Test webhook delivery with sample event
 */
export async function POST(
  request: NextRequest,
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
      id: 'test_doc_123',
      title: 'Test Document',
      client_name: 'Test Client',
      created_at: new Date().toISOString(),
    },
  };

  const payloadJson = JSON.stringify(payload);
  const signature = signPayload(payloadJson, webhook.secret);

  // Attempt delivery
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);

  let statusCode: number | null = null;
  let responseBody: string | null = null;
  let success = false;

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
    if (responseBody.length > 500) {
      responseBody = responseBody.substring(0, 500);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    responseBody = `Delivery failed: ${message}`;
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
      },
    },
    { status: success ? 200 : 400 }
  );
}
