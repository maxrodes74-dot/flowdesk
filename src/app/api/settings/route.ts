import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export type UserSettings = {
  llm_provider?: 'anthropic' | 'openai';
  llm_api_key_set?: boolean; // never return the actual key
  llm_model?: string;
};

/**
 * GET /api/settings
 * Returns user settings (without exposing raw API key)
 */
export async function GET() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('settings, display_name, tier')
      .eq('id', user.id)
      .single();

    if (error) throw error;

    const settings = (profile?.settings || {}) as Record<string, unknown>;

    return NextResponse.json({
      display_name: profile?.display_name || '',
      tier: profile?.tier || 'free',
      llm_provider: settings.llm_provider || null,
      llm_api_key_set: !!settings.llm_api_key_encrypted,
      llm_model: settings.llm_model || null,
    });
  } catch (error) {
    console.error('GET /api/settings error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/settings
 * Update user settings including BYOT API key
 */
export async function PUT(req: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { llm_provider, llm_api_key, llm_model, display_name } = body;

    // Fetch current settings
    const { data: profile, error: fetchError } = await supabase
      .from('profiles')
      .select('settings')
      .eq('id', user.id)
      .single();

    if (fetchError) throw fetchError;

    const currentSettings = (profile?.settings || {}) as Record<string, unknown>;
    const updatedSettings = { ...currentSettings };

    // Update LLM settings
    if (llm_provider !== undefined) {
      updatedSettings.llm_provider = llm_provider;
    }

    if (llm_model !== undefined) {
      updatedSettings.llm_model = llm_model;
    }

    if (llm_api_key !== undefined) {
      if (llm_api_key === '') {
        // Clear the key
        delete updatedSettings.llm_api_key_encrypted;
      } else {
        // Store the key — in production this should use proper encryption
        // (e.g. Supabase Vault or server-side AES). For now, base64 encode
        // to avoid plaintext in JSONB while we add proper encryption later.
        updatedSettings.llm_api_key_encrypted = Buffer.from(llm_api_key).toString('base64');
      }
    }

    // Build profile update
    const profileUpdate: Record<string, unknown> = {
      settings: updatedSettings,
    };

    if (display_name !== undefined) {
      profileUpdate.display_name = display_name;
    }

    const { error: updateError } = await supabase
      .from('profiles')
      .update(profileUpdate)
      .eq('id', user.id);

    if (updateError) throw updateError;

    return NextResponse.json({
      success: true,
      llm_provider: updatedSettings.llm_provider || null,
      llm_api_key_set: !!updatedSettings.llm_api_key_encrypted,
      llm_model: updatedSettings.llm_model || null,
    });
  } catch (error) {
    console.error('PUT /api/settings error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
