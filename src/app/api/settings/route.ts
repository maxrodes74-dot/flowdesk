import { createClient } from '@/lib/supabase/server';
import type { Database } from '@/lib/supabase/types';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/settings
 * Get user's settings (never returns raw API key)
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('settings')
      .eq('id', user.id)
      .single();

    const settings = (profile?.settings || {}) as Record<string, unknown>;

    // Never return the raw key — only whether one is set and its prefix
    const hasKey = !!settings.llm_api_key;
    let keyPrefix = '';
    if (hasKey) {
      try {
        const decoded = Buffer.from(settings.llm_api_key as string, 'base64').toString('utf-8');
        keyPrefix = decoded.slice(0, 8) + '...';
      } catch {
        keyPrefix = 'sk-...';
      }
    }

    return NextResponse.json({
      llm_provider: settings.llm_provider || 'anthropic',
      llm_model: settings.llm_model || '',
      has_api_key: hasKey,
      api_key_prefix: keyPrefix,
    });
  } catch (error) {
    console.error('GET /api/settings error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PUT /api/settings
 * Update user's settings
 */
export async function PUT(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();

    // Get current settings
    const { data: profile } = await supabase
      .from('profiles')
      .select('settings')
      .eq('id', user.id)
      .single();

    const currentSettings = (profile?.settings || {}) as Record<string, unknown>;

    // Update only the provided fields
    if (body.llm_provider !== undefined) {
      currentSettings.llm_provider = body.llm_provider;
    }
    if (body.llm_model !== undefined) {
      currentSettings.llm_model = body.llm_model;
    }
    if (body.llm_api_key !== undefined) {
      if (body.llm_api_key === '') {
        // Clear the key
        delete currentSettings.llm_api_key;
      } else {
        // Store base64 encoded
        currentSettings.llm_api_key = Buffer.from(body.llm_api_key).toString('base64');
      }
    }

    const { error } = await supabase
      .from('profiles')
      .update({ settings: currentSettings as Database['public']['Tables']['profiles']['Update']['settings'] })
      .eq('id', user.id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('PUT /api/settings error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
