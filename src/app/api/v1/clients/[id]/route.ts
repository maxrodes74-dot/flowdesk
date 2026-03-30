/**
 * MTR-289: REST API v1 — Client Details
 * GET /api/v1/clients/:id — get client with document history
 */

import { NextRequest } from 'next/server';
import { authenticateApiKey } from '@/lib/api-keys/auth';
import { createServiceClient } from '@/lib/supabase/service';
import { apiSuccess, apiError } from '@/lib/api-v1/response';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticateApiKey(request);
  if (auth instanceof Response) return auth;

  const { freelancer_id } = auth;
  const { id } = await params;
  const supabase = createServiceClient();

  // Get client
  const { data: client, error } = await supabase
    .from('clients')
    .select('*')
    .eq('id', id)
    .eq('freelancer_id', freelancer_id)
    .single();

  if (error || !client) {
    return apiError('Client not found', 404);
  }

  // Get recent documents for this client
  const { data: documents } = await supabase
    .from('documents')
    .select('id, type, title, status, created_at, updated_at')
    .eq('freelancer_id', freelancer_id)
    .eq('client_id', id)
    .neq('status', 'archived')
    .order('created_at', { ascending: false })
    .limit(20);

  return apiSuccess({
    client,
    recent_documents: documents || [],
  });
}
