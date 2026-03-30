/**
 * MTR-289: REST API v1 — Derive Document
 * POST /api/v1/documents/:id/derive — create child document from parent
 */

import { NextRequest } from 'next/server';
import { authenticateApiKey } from '@/lib/api-keys/auth';
import { createServiceClient } from '@/lib/supabase/service';
import { validateDocumentContent } from '@/lib/documents/schemas';
import { dispatchWebhookEvent } from '@/lib/webhooks/deliver';
import { apiSuccess, apiError } from '@/lib/api-v1/response';

interface DeriveDocumentBody {
  type: string;
  title: string;
  content?: Record<string, unknown>;
  template_id?: string;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticateApiKey(request);
  if (auth instanceof Response) return auth;

  const { freelancer_id, api_key_id, permissions } = auth;
  const parentId = (await params).id;

  // Check permissions
  if (permissions.create === 'block') {
    return apiError('API key does not have permission to create documents', 403);
  }

  let body: DeriveDocumentBody;
  try {
    body = await request.json();
  } catch {
    return apiError('Invalid JSON body', 400);
  }

  // Validate required fields
  if (!body.type || !body.title) {
    return apiError('Missing required fields: type, title', 400);
  }

  const supabase = createServiceClient();

  // Get parent document
  const { data: parent, error: parentError } = await supabase
    .from('documents')
    .select('*')
    .eq('id', parentId)
    .eq('freelancer_id', freelancer_id)
    .single();

  if (parentError || !parent) {
    return apiError('Parent document not found', 404);
  }

  // Validate content if provided
  let content = body.content;
  if (!content) {
    // Use parent content as base
    content = parent.content;
  } else {
    const contentResult = validateDocumentContent(body.type as any, content);
    if (!contentResult.success) {
      return apiError(
        'Invalid content for document type',
        400,
        contentResult.error.issues
      );
    }
  }

  // Build lineage chain
  const lineageChain = [
    ...((parent.lineage_chain as string[]) || []),
    parentId,
  ];

  const now = new Date().toISOString();

  // Create child document
  const { data: child, error: createError } = await supabase
    .from('documents')
    .insert({
      freelancer_id,
      client_id: parent.client_id || null,
      type: body.type,
      template_id: body.template_id || null,
      parent_id: parentId,
      lineage_chain: lineageChain,
      title: body.title,
      content,
      metadata: parent.metadata || {},
      status: 'draft',
      ai_generated: false,
      agent_key_id: api_key_id,
      created_at: now,
      updated_at: now,
    })
    .select()
    .single();

  if (createError) {
    return apiError(createError.message, 500);
  }

  // Create initial version record
  await supabase.from('document_versions').insert({
    document_id: child.id,
    version: 1,
    content,
    metadata: parent.metadata || {},
    created_by: 'api',
  });

  // Dispatch webhook
  await dispatchWebhookEvent(freelancer_id, 'document.created', {
    document_id: child.id,
    type: child.type,
    title: child.title,
    status: child.status,
    parent_id: parentId,
  });

  return apiSuccess(child, 201);
}
