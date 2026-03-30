/**
 * =============================================================
 * MTR-291: Webhook Management
 * GET  /api/webhooks  — List webhooks with recent deliveries
 * POST /api/webhooks  — Create new webhook
 * =============================================================
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { randomBytes } from 'crypto';
import { z } from 'zod';
import type { CreateWebhookInput, WebhookEvent } from '@/lib/webhooks/types';
import { ALL_WEBHOOK_EVENTS } from '@/lib/webhooks/types';

/**
 * Validation schemas
 */
const UrlSchema = z.string().url('Must be a valid URL');

const WebhookEventSchema = z.enum([
  'document.created',
  'document.updated',
  'document.sent',
  'document.approved',
  'document.declined',
  'invoice.paid',
  'client.created',
]);

const CreateWebhookSchema = z.object({
  url: UrlSchema,
  events: z.array(WebhookEventSchema).min(1, 'At least one event must be selected'),
});

/**
 * GET /api/webhooks
 * List all webhooks for authenticated user with recent delivery history
 */
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Get all webhooks for this user
  const { data: webhooks, error } = await supabase
    .from('webhooks')
    .select('*')
    .eq('freelancer_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Get recent deliveries for each webhook
  const webhooksWithDeliveries = await Promise.all(
    (webhooks || []).map(async (webhook) => {
      const { data: deliveries } = await supabase
        .from('webhook_deliveries')
        .select('*')
        .eq('webhook_id', webhook.id)
        .order('delivered_at', { ascending: false })
        .limit(5);

      return {
        ...webhook,
        recent_deliveries: deliveries || [],
      };
    })
  );

  return NextResponse.json({ webhooks: webhooksWithDeliveries });
}

/**
 * POST /api/webhooks
 * Create a new webhook with tier limit validation
 */
export async function POST(request: NextRequest) {
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

  const parseResult = CreateWebhookSchema.safeParse(body);
  if (!parseResult.success) {
    return NextResponse.json(
      {
        error: 'Validation failed',
        details: parseResult.error.issues,
      },
      { status: 400 }
    );
  }

  const { url, events } = parseResult.data;

  // Get user subscription tier
  const { data: freelancer, error: freelancerError } = await supabase
    .from('freelancers')
    .select('subscription_tier')
    .eq('id', user.id)
    .single();

  if (freelancerError || !freelancer) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  // Check tier limits
  const { data: existingWebhooks } = await supabase
    .from('webhooks')
    .select('id')
    .eq('freelancer_id', user.id);

  const webhookCount = existingWebhooks?.length || 0;
  const tier = freelancer.subscription_tier;

  if (tier === 'pro' && webhookCount >= 3) {
    return NextResponse.json(
      {
        error: 'Webhook limit reached',
        message: 'Pro plan limited to 3 webhooks. Upgrade to Pro+ for unlimited webhooks.',
      },
      { status: 403 }
    );
  }

  // Generate webhook secret
  const secret = randomBytes(32).toString('hex');

  // Create webhook
  const { data: webhook, error: createError } = await supabase
    .from('webhooks')
    .insert({
      freelancer_id: user.id,
      url,
      secret,
      events,
      is_active: true,
    })
    .select()
    .single();

  if (createError) {
    return NextResponse.json({ error: createError.message }, { status: 500 });
  }

  // Return webhook with secret (shown only once)
  return NextResponse.json(
    {
      webhook,
      message: 'Webhook created successfully. Save the secret now — it will not be shown again.',
    },
    { status: 201 }
  );
}
