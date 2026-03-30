/**
 * MTR-289: REST API v1 — Document CRUD
 * GET    /api/v1/documents/:id  — get with content, metadata, lineage
 * PUT    /api/v1/documents/:id  — update content/metadata, auto-version
 * DELETE /api/v1/documents/:id  — soft-delete (archive)
 */

import { NextRequest } from 'next/server';
import { authenticateApiKey } from '@/lib/api-keys/auth';
import { createServiceClient } from '@/lib/supabase/service';
import { validateDocumentContent } from '@/lib/documents/schemas';
import { dispatchWebhookEvent } from '@/lib/webhooks/deliver';
import { apiSuccess, apiError } from '@/lib/api-v1/response';
import type { UpdateDocumentInput } from '@/lib/documents/types';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticateApiKey(request);
  if (auth instanceof Response) return auth;

  const { freelancer_id } = auth;
  const { id } = await params;
  const supabase = createServiceClient();

  // Get document
  const { data: document, error } = await supabase
    .from('documents')
    .select('*')
    .eq('id', id)
    .eq('freelancer_id', freelancer_id)
    .single();

  if (error || !document) {
    return apiError('Document not found', 404);
  }

  // Get version history
  const { data: versions } = await supabase
    .from('document_versions')
    .select('id, version, created_by, created_at')
    .eq('document_id', id)
    .order('version', { ascending: false });

  // Get lineage (parent + children)
  const { data: children } = await supabase
    .from('documents')
    .select('id, type, title, status, created_at')
    .eq('parent_id', id)
    .order('created_at', { ascending: true });

  let parent = null;
  if (document.parent_id) {
    const { data: parentDoc } = await supabase
      .from('documents')
      .select('id, type, title, status')
      .eq('id', document.parent_id)
      .single();
    parent = parentDoc;
  }

  return apiSuccess({
    document,
    versions: versions || [],
    lineage: { parent, children: children || [] },
  });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticateApiKey(request);
  if (auth instanceof Response) return auth;

  const { freelancer_id, permissions } = auth;
  const { id } = await params;

  // Check permissions
  if (permissions.edit === 'block') {
    return apiError('API key does not have permission to update documents', 403);
  }

  let body: UpdateDocumentInput;
  try {
    body = await request.json();
  } catch {
    return apiError('Invalid JSON body', 400);
  }

  const supabase = createServiceClient();

  // Get current document for version tracking
  const { data: current, error: fetchError } = await supabase
    .from('documents')
    .select('*')
    .eq('id', id)
    .eq('freelancer_id', freelancer_id)
    .single();

  if (fetchError || !current) {
    return apiError('Document not found', 404);
  }

  // Validate content if being updated
  if (body.content) {
    const contentResult = validateDocumentContent(current.type, body.content);
    if (!contentResult.success) {
      return apiError(
        'Invalid content for document type',
        400,
        contentResult.error.issues
      );
    }
  }

  // Determine if this is a content change (requires new version)
  const isContentChange =
    body.content &&
    JSON.stringify(body.content) !== JSON.stringify(current.content);
  const newVersion = isContentChange ? current.version + 1 : current.version;

  // Build update object
  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (body.client_id !== undefined) updateData.client_id = body.client_id;
  if (body.title !== undefined) updateData.title = body.title;
  if (body.content !== undefined) updateData.content = body.content;
  if (body.metadata !== undefined) updateData.metadata = body.metadata;

  let statusChanged = false;
  let oldStatus = current.status;
  if (body.status !== undefined) {
    updateData.status = body.status;
    statusChanged = body.status !== current.status;
    if (body.status === 'sent' && !current.sent_at)
      updateData.sent_at = new Date().toISOString();
    if (body.status === 'approved' && !current.approved_at)
      updateData.approved_at = new Date().toISOString();
  }

  if (body.file_url !== undefined) updateData.file_url = body.file_url;
  if (body.file_type !== undefined) updateData.file_type = body.file_type;
  if (isContentChange) updateData.version = newVersion;

  const { data, error } = await supabase
    .from('documents')
    .update(updateData)
    .eq('id', id)
    .eq('freelancer_id', freelancer_id)
    .select()
    .single();

  if (error) {
    return apiError(error.message, 500);
  }

  // Create version record if content changed
  if (isContentChange) {
    await supabase.from('document_versions').insert({
      document_id: id,
      version: newVersion,
      content: body.content,
      metadata: body.metadata || current.metadata,
      created_by: 'api',
    });
  }

  // Dispatch webhooks
  if (statusChanged) {
    const newStatus = body.status || oldStatus;
    if (newStatus === 'sent') {
      await dispatchWebhookEvent(freelancer_id, 'document.sent', {
        document_id: data.id,
        type: data.type,
        title: data.title,
      });
    } else if (newStatus === 'approved') {
      await dispatchWebhookEvent(freelancer_id, 'document.approved', {
        document_id: data.id,
        type: data.type,
        title: data.title,
      });
    } else if (newStatus === 'declined') {
      await dispatchWebhookEvent(freelancer_id, 'document.declined', {
        document_id: data.id,
        type: data.type,
        title: data.title,
      });
    }
  }

  if (isContentChange || statusChanged) {
    await dispatchWebhookEvent(freelancer_id, 'document.updated', {
      document_id: data.id,
      type: data.type,
      title: data.title,
      status: data.status,
    });
  }

  return apiSuccess(data);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticateApiKey(request);
  if (auth instanceof Response) return auth;

  const { freelancer_id, permissions } = auth;
  const { id } = await params;

  // Check permissions
  if (permissions.delete === 'block') {
    return apiError('API key does not have permission to delete documents', 403);
  }

  const supabase = createServiceClient();

  // Verify document exists
  const { data: doc, error: checkError } = await supabase
    .from('documents')
    .select('id')
    .eq('id', id)
    .eq('freelancer_id', freelancer_id)
    .single();

  if (checkError || !doc) {
    return apiError('Document not found', 404);
  }

  // Soft delete — archive the document
  const { error } = await supabase
    .from('documents')
    .update({ status: 'archived', updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('freelancer_id', freelancer_id);

  if (error) {
    return apiError(error.message, 500);
  }

  return apiSuccess({ success: true });
}
