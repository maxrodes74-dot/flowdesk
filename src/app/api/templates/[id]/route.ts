// =============================================================
// MTR-293: Template CRUD — Get, Update, Delete
// GET    /api/templates/[id]  — get single template
// PUT    /api/templates/[id]  — update custom template
// DELETE /api/templates/[id]  — delete custom template
// =============================================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { SYSTEM_TEMPLATES } from '@/lib/templates/seed-data';
import type { UpdateTemplateInput } from '@/lib/templates/types';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check if it's a system template
  if (id.startsWith('system-')) {
    const templateIndex = parseInt(id.replace('system-', ''), 10);
    if (templateIndex >= 0 && templateIndex < SYSTEM_TEMPLATES.length) {
      const template = SYSTEM_TEMPLATES[templateIndex];
      return NextResponse.json({
        template: {
          id,
          ...template,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      });
    }
    return NextResponse.json({ error: 'Template not found' }, { status: 404 });
  }

  // Get custom template from database
  const { data: template, error } = await supabase
    .from('templates')
    .select('*')
    .eq('id', id)
    .eq('freelancer_id', user.id)
    .eq('is_system', false)
    .single();

  if (error || !template) {
    return NextResponse.json({ error: 'Template not found' }, { status: 404 });
  }

  return NextResponse.json({ template });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Cannot update system templates
  if (id.startsWith('system-')) {
    return NextResponse.json(
      { error: 'Cannot edit system templates' },
      { status: 403 }
    );
  }

  let body: UpdateTemplateInput;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  // Verify ownership
  const { data: template, error: getError } = await supabase
    .from('templates')
    .select('freelancer_id')
    .eq('id', id)
    .single();

  if (getError || !template) {
    return NextResponse.json({ error: 'Template not found' }, { status: 404 });
  }

  if (template.freelancer_id !== user.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  // Update template
  const updatePayload: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (body.name !== undefined) updatePayload.name = body.name;
  if (body.description !== undefined) updatePayload.description = body.description;
  if (body.category !== undefined) updatePayload.category = body.category;
  if (body.sections !== undefined) updatePayload.sections = body.sections;
  if (body.metadata_schema !== undefined) updatePayload.metadata_schema = body.metadata_schema;
  if (body.default_file_type !== undefined) updatePayload.default_file_type = body.default_file_type;
  if (body.styling !== undefined) {
    // Merge styling
    const { data: currentTemplate } = await supabase
      .from('templates')
      .select('styling')
      .eq('id', id)
      .single();

    updatePayload.styling = {
      ...(currentTemplate?.styling as Record<string, unknown>),
      ...body.styling,
    };
  }

  const { data, error } = await supabase
    .from('templates')
    .update(updatePayload)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ template: data });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Cannot delete system templates
  if (id.startsWith('system-')) {
    return NextResponse.json(
      { error: 'Cannot delete system templates' },
      { status: 403 }
    );
  }

  // Verify ownership
  const { data: template, error: getError } = await supabase
    .from('templates')
    .select('freelancer_id')
    .eq('id', id)
    .single();

  if (getError || !template) {
    return NextResponse.json({ error: 'Template not found' }, { status: 404 });
  }

  if (template.freelancer_id !== user.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  // Delete template
  const { error: deleteError } = await supabase
    .from('templates')
    .delete()
    .eq('id', id);

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
