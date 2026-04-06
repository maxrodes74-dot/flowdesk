import { createClient } from '@/lib/supabase/server';
import type { Database } from '@/lib/supabase/types';
import { NextRequest, NextResponse } from 'next/server';

type AutomationUpdate = Database['public']['Tables']['automations']['Update'];

type Params = { automationId: string };

/**
 * GET /api/automations/[automationId]
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<Params> }
) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { automationId } = await params;

    const { data, error } = await supabase
      .from('automations')
      .select('*')
      .eq('id', automationId)
      .eq('user_id', user.id)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: 'Automation not found' }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('GET /api/automations/[id] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PUT /api/automations/[automationId]
 * Update an automation
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<Params> }
) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { automationId } = await params;
    const body = await req.json();

    const updateFields: AutomationUpdate = {};
    if (body.name !== undefined) updateFields.name = body.name;
    if (body.description !== undefined) updateFields.description = body.description;
    if (body.prompt !== undefined) updateFields.prompt = body.prompt;
    if (body.schedule !== undefined) updateFields.schedule = body.schedule;
    if (body.is_enabled !== undefined) updateFields.is_enabled = body.is_enabled;

    const { data, error } = await supabase
      .from('automations')
      .update(updateFields)
      .eq('id', automationId)
      .eq('user_id', user.id)
      .select('*')
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error) {
    console.error('PUT /api/automations/[id] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/automations/[automationId]
 */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<Params> }
) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { automationId } = await params;

    const { error } = await supabase
      .from('automations')
      .delete()
      .eq('id', automationId)
      .eq('user_id', user.id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/automations/[id] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
