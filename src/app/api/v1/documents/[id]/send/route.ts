/**
 * MTR-289: REST API v1 — Send Document
 * POST /api/v1/documents/:id/send — mark document as sent, set sent_at
 */

import { NextRequest } from 'next/server';
import { authenticateApiKey } from '@/lib/api-keys/auth';
import { createServiceClient } from '@/lib/supabase/service';
import { dispatchWebhookEvent } from '@/lib/webhooks/deliver';
import { apiSuccess, apiError } from '@/lib/api-v1/response';

interface SendDocumentBody {
  client_email?: string;
  message?: string;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticateApiKey(request);
  if (auth instanceof Response) return auth;

  const { freelancer_id, permissions } = auth;
  const { id } = await params;

  // Check permissions
  if (permissions.send === 'block') {
    return apiError('API key does not have permission to send documents', 403);
  }

  let body: SendDocumentBody = {};
  try {
    const text = await request.text();
    if (text) body = JSON.parse(text);
  } catch {
    // Continue with empty body
  }

  const supabase = createServiceClient();

  // Get document
  const { data: doc, error: docError } = await supabase
    .from('documents')
    .select('*')
    .eq('id', id)
    .eq('freelancer_id', freelancer_id)
    .single();

  if (docError || !doc) {
    return apiError('Document not found', 404);
  }

  // Verify document has a client
  if (!doc.client_id && !body.client_email) {
    return apiError(
      'Document must be linked to a client or client_email must be provided',
      400
    );
  }

  const now = new Date().toISOString();

  // Update document status to sent
  const { data: updated, error: updateError } = await supabase
    .from('documents')
    .update({
      status: 'sent',
      sent_at: now,
      updated_at: now,
    })
    .eq('id', id)
    .eq('freelancer_id', freelancer_id)
    .select()
    .single();

  if (updateError) {
    return apiError(updateError.message, 500);
  }

  // Dispatch webhook
  await dispatchWebhookEvent(freelancer_id, 'document.sent', {
    document_id: updated.id,
    type: updated.type,
    title: updated.title,
    client_email: body.client_email,
    message: body.message,
  });

  return apiSuccess({
    document: updated,
    sent_at: now,
  });
}
