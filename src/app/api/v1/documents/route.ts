/**
 * MTR-289: REST API v1 — Documents
 * GET  /api/v1/documents  — list with filters (type, status, client_id, limit, offset)
 * POST /api/v1/documents  — create document
 */

import { NextRequest } from 'next/server';
import { authenticateApiKey } from '@/lib/api-keys/auth';
import { createServiceClient } from '@/lib/supabase/service';
import { validateDocumentContent } from '@/lib/documents/schemas';
import { dispatchWebhookEvent } from '@/lib/webhooks/deliver';
import { apiSuccess, apiError, apiPaginatedResponse } from '@/lib/api-v1/response';
import type { CreateDocumentInput } from '@/lib/documents/types';

export async function GET(request: NextRequest) {
  const auth = await authenticateApiKey(request);
  if (auth instanceof Response) return auth;

  const { freelancer_id } = auth;
  const supabase = createServiceClient();

  const url = request.nextUrl;
  const type = url.searchParams.get('type');
  const status = url.searchParams.get('status');
  const clientId = url.searchParams.get('client_id');
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '50', 10), 100);
  const offset = parseInt(url.searchParams.get('offset') || '0', 10);

  let query = supabase
    .from('documents')
    .select('*', { count: 'exact' })
    .eq('freelancer_id', freelancer_id)
    .neq('status', 'archived')
    .order('updated_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (type) query = query.eq('type', type);
  if (status) query = query.eq('status', status);
  if (clientId) query = query.eq('client_id', clientId);

  const { data, error, count } = await query;

  if (error) {
    return apiError(error.message, 500);
  }

  return apiPaginatedResponse(data || [], count || 0, limit, offset);
}

export async function POST(request: NextRequest) {
  const auth = await authenticateApiKey(request);
  if (auth instanceof Response) return auth;

  const { freelancer_id, api_key_id, permissions } = auth;

  // Check permissions
  if (permissions.create === 'block') {
    return apiError('API key does not have permission to create documents', 403);
  }

  let body: CreateDocumentInput;
  try {
    body = await request.json();
  } catch {
    return apiError('Invalid JSON body', 400);
  }

  // Validate required fields
  if (!body.type || !body.title || !body.content) {
    return apiError('Missing required fields: type, title, content', 400);
  }

  // Validate content against type-specific schema
  const contentResult = validateDocumentContent(body.type, body.content);
  if (!contentResult.success) {
    return apiError(
      'Invalid content for document type',
      400,
      contentResult.error.issues
    );
  }

  // Build lineage chain if parent_id is set
  let lineageChain: string[] = [];
  if (body.parent_id) {
    const { data: parent } = await createServiceClient()
      .from('documents')
      .select('lineage_chain')
      .eq('id', body.parent_id)
      .eq('freelancer_id', freelancer_id)
      .single();

    if (parent) {
      lineageChain = [...(parent.lineage_chain || []), body.parent_id];
    }
  }

  const now = new Date().toISOString();

  const { data, error } = await createServiceClient()
    .from('documents')
    .insert({
      freelancer_id,
      client_id: body.client_id || null,
      type: body.type,
      template_id: body.template_id || null,
      parent_id: body.parent_id || null,
      lineage_chain: lineageChain,
      title: body.title,
      content: body.content,
      metadata: body.metadata || {},
      status: body.status || 'draft',
      ai_generated: body.ai_generated || false,
      agent_key_id: api_key_id,
      created_at: now,
      updated_at: now,
    })
    .select()
    .single();

  if (error) {
    return apiError(error.message, 500);
  }

  // Create initial version record
  await createServiceClient()
    .from('document_versions')
    .insert({
      document_id: data.id,
      version: 1,
      content: body.content,
      metadata: body.metadata || {},
      created_by: 'api',
    });

  // Dispatch webhook
  await dispatchWebhookEvent(freelancer_id, 'document.created', {
    document_id: data.id,
    type: data.type,
    title: data.title,
    status: data.status,
  });

  return apiSuccess(data, 201);
}
