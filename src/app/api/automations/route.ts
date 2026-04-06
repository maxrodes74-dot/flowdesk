import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/automations
 * List all automations for the authenticated user
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('automations')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return NextResponse.json(data || []);
  } catch (error) {
    console.error('GET /api/automations error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/automations
 * Create a new automation
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { name, description, prompt, schedule, is_preset, preset_key } = body;

    if (!name || !prompt) {
      return NextResponse.json({ error: 'Name and prompt are required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('automations')
      .insert({
        user_id: user.id,
        name,
        description: description || '',
        prompt,
        schedule: schedule || 'manual',
        is_preset: is_preset || false,
        preset_key: preset_key || null,
      })
      .select('*')
      .single();

    if (error) throw error;
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('POST /api/automations error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
