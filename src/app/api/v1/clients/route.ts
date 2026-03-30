/**
 * MTR-289: REST API v1 — Clients
 * GET  /api/v1/clients  — list clients for this freelancer
 * POST /api/v1/clients  — create client
 */

import { NextRequest } from 'next/server';
import { authenticateApiKey } from '@/lib/api-keys/auth';
import { createServiceClient } from '@/lib/supabase/service';
import { dispatchWebhookEvent } from '@/lib/webhooks/deliver';
import { apiSuccess, apiError, apiPaginatedResponse } from '@/lib/api-v1/response';
import { generatePortalSlug } from '@/lib/utils/slug';

interface CreateClientBody {
  name: string;
  email: string;
  company?: string;
}

export async function GET(request: NextRequest) {
  const auth = await authenticateApiKey(request);
  if (auth instanceof Response) return auth;

  const { freelancer_id } = auth;
  const supabase = createServiceClient();

  const url = request.nextUrl;
  const search = url.searchParams.get('search');
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '50', 10), 100);
  const offset = parseInt(url.searchParams.get('offset') || '0', 10);

  let query = supabase
    .from('clients')
    .select('*', { count: 'exact' })
    .eq('freelancer_id', freelancer_id)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (search) {
    query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
  }

  const { data, error, count } = await query;

  if (error) {
    return apiError(error.message, 500);
  }

  return apiPaginatedResponse(data || [], count || 0, limit, offset);
}

export async function POST(request: NextRequest) {
  const auth = await authenticateApiKey(request);
  if (auth instanceof Response) return auth;

  const { freelancer_id } = auth;

  let body: CreateClientBody;
  try {
    body = await request.json();
  } catch {
    return apiError('Invalid JSON body', 400);
  }

  // Validate required fields
  if (!body.name || !body.email) {
    return apiError('Missing required fields: name, email', 400);
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(body.email)) {
    return apiError('Invalid email format', 400);
  }

  const supabase = createServiceClient();

  // Check if client already exists
  const { data: existing } = await supabase
    .from('clients')
    .select('id')
    .eq('freelancer_id', freelancer_id)
    .eq('email', body.email)
    .single();

  if (existing) {
    return apiError('Client with this email already exists', 409);
  }

  const portalSlug = generatePortalSlug();
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from('clients')
    .insert({
      freelancer_id,
      name: body.name,
      email: body.email,
      company: body.company || null,
      portal_slug: portalSlug,
      created_at: now,
      updated_at: now,
    })
    .select()
    .single();

  if (error) {
    return apiError(error.message, 500);
  }

  // Dispatch webhook
  await dispatchWebhookEvent(freelancer_id, 'client.created', {
    client_id: data.id,
    name: data.name,
    email: data.email,
  });

  return apiSuccess(data, 201);
}
