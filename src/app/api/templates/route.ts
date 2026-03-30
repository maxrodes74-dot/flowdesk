// =============================================================
// MTR-293: Templates API — List & Create
// GET  /api/templates  — list templates with tier filtering
// POST /api/templates  — create custom template from system or scratch
// =============================================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { SYSTEM_TEMPLATES } from '@/lib/templates/seed-data';
import type { CreateTemplateInput } from '@/lib/templates/types';
import type { SubscriptionTier } from '@/lib/types';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Get freelancer to check tier
  const { data: freelancer, error: freelancerError } = await supabase
    .from('freelancers')
    .select('subscription_tier')
    .eq('user_id', user.id)
    .single();

  if (freelancerError || !freelancer) {
    return NextResponse.json({ error: 'Freelancer not found' }, { status: 404 });
  }

  const tier = (freelancer.subscription_tier || 'free') as SubscriptionTier;

  // Query parameters for filtering
  const url = request.nextUrl;
  const typeFilter = url.searchParams.get('type');
  const categoryFilter = url.searchParams.get('category');
  const isSystemFilter = url.searchParams.get('is_system');

  // Determine tier access
  const tierAccessMap: Record<SubscriptionTier, string[]> = {
    free: [],
    pro: ['pro'],
    'pro+': ['pro', 'pro_plus'],
  };
  const allowedTiers = tierAccessMap[tier];

  // Filter system templates by tier
  const filteredSystemTemplates = SYSTEM_TEMPLATES.filter((t) => {
    const tierMatch = allowedTiers.includes(t.tier_required);
    const typeMatch = !typeFilter || t.type === typeFilter;
    const categoryMatch = !categoryFilter || t.category === categoryFilter;

    return tierMatch && typeMatch && categoryMatch;
  });

  // Get custom templates from database
  let customTemplates: any[] = [];
  if (!isSystemFilter || isSystemFilter === 'false') {
    const { data: customData } = await supabase
      .from('templates')
      .select('*')
      .eq('freelancer_id', user.id)
      .eq('is_system', false)
      .order('updated_at', { ascending: false });

    if (customData) {
      customTemplates = customData.filter((t) => {
        const typeMatch = !typeFilter || t.type === typeFilter;
        const categoryMatch = !categoryFilter || t.category === categoryFilter;
        return typeMatch && categoryMatch;
      });
    }
  }

  // Combine and return
  const allTemplates = [
    ...filteredSystemTemplates.map((t, idx) => ({
      id: `system-${idx}`,
      ...t,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })),
    ...customTemplates,
  ];

  return NextResponse.json({
    templates: allTemplates,
    total: allTemplates.length,
    tier,
  });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: CreateTemplateInput & { from_system_template?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  // Validate required fields
  if (!body.type || !body.name || !body.description) {
    return NextResponse.json(
      { error: 'Missing required fields: type, name, description' },
      { status: 400 }
    );
  }

  if (!body.sections || body.sections.length === 0) {
    return NextResponse.json(
      { error: 'At least one section is required' },
      { status: 400 }
    );
  }

  // Check if user is trying to copy from system template
  let templateData = {
    type: body.type,
    name: body.name,
    description: body.description,
    category: body.category || 'general',
    sections: body.sections,
    metadata_schema: body.metadata_schema || {},
    default_file_type: body.default_file_type || 'pdf',
    styling: body.styling || {
      primary_color: '#2563eb',
      font_family: 'Inter',
      header_style: 'modern' as const,
      show_logo: true,
    },
  };

  // Get freelancer to check tier
  const { data: freelancer } = await supabase
    .from('freelancers')
    .select('id, subscription_tier')
    .eq('user_id', user.id)
    .single();

  if (!freelancer) {
    return NextResponse.json({ error: 'Freelancer not found' }, { status: 404 });
  }

  // Insert custom template
  const { data, error } = await (supabase
    .from('templates') as any)
    .insert({
      freelancer_id: user.id,
      is_system: false,
      tier_required: 'pro',
      ...(templateData as Record<string, unknown>),
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ template: data }, { status: 201 });
}
