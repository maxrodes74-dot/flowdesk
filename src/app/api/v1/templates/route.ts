/**
 * MTR-289: REST API v1 — Templates
 * GET /api/v1/templates — list available templates
 */

import { NextRequest } from 'next/server';
import { authenticateApiKey } from '@/lib/api-keys/auth';
import { createServiceClient } from '@/lib/supabase/service';
import { apiSuccess, apiError, apiPaginatedResponse } from '@/lib/api-v1/response';

export async function GET(request: NextRequest) {
  const auth = await authenticateApiKey(request);
  if (auth instanceof Response) return auth;

  const { freelancer_id } = auth;
  const supabase = createServiceClient();

  const url = request.nextUrl;
  const type = url.searchParams.get('type');
  const category = url.searchParams.get('category');
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '50', 10), 100);
  const offset = parseInt(url.searchParams.get('offset') || '0', 10);

  // Get both system templates and custom templates for this freelancer
  let systemQuery = supabase
    .from('templates')
    .select('*', { count: 'exact' })
    .eq('is_public', true)
    .order('created_at', { ascending: false });

  let customQuery = supabase
    .from('templates')
    .select('*')
    .eq('freelancer_id', freelancer_id)
    .order('created_at', { ascending: false });

  if (type) {
    systemQuery = systemQuery.eq('type', type);
    customQuery = customQuery.eq('type', type);
  }

  if (category) {
    systemQuery = systemQuery.eq('category', category);
    customQuery = customQuery.eq('category', category);
  }

  const { data: systemTemplates, count: systemCount, error: sysError } = await systemQuery;
  const { data: customTemplates, error: customError } = await customQuery;

  if (sysError) {
    return apiError(sysError.message, 500);
  }

  // Merge and paginate
  const allTemplates = [
    ...(customTemplates || []),
    ...(systemTemplates || []),
  ];

  const total = (systemCount || 0) + (customTemplates?.length || 0);
  const paginated = allTemplates.slice(offset, offset + limit);

  return apiPaginatedResponse(paginated, total, limit, offset);
}
