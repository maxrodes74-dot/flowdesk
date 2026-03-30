/**
 * MTR-289: REST API v1 — Template Details
 * GET /api/v1/templates/:id — get full template with sections
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

  // Get template (system or custom)
  const { data: template, error } = await supabase
    .from('templates')
    .select('*')
    .eq('id', id)
    .or(`is_public.eq.true,freelancer_id.eq.${freelancer_id}`)
    .single();

  if (error || !template) {
    return apiError('Template not found', 404);
  }

  // Get sections if template has them
  const { data: sections } = await supabase
    .from('template_sections')
    .select('*')
    .eq('template_id', id)
    .order('position', { ascending: true });

  return apiSuccess({
    template,
    sections: sections || [],
  });
}
