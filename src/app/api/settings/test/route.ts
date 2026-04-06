import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { resolveModel } from '@/lib/models';

/**
 * POST /api/settings/test
 * Test the user's BYOT API key by making a minimal API call
 */
export async function POST() {
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

    if (!profile?.settings) {
      return NextResponse.json({ error: 'No settings found' }, { status: 400 });
    }

    const settings = profile.settings as Record<string, unknown>;
    const keyEncoded = settings.llm_api_key_encrypted as string;
    const provider = (settings.llm_provider as string) || 'anthropic';
    const model = resolveModel(provider, settings.llm_model as string);

    if (!keyEncoded) {
      return NextResponse.json({ error: 'No API key saved' }, { status: 400 });
    }

    const apiKey = Buffer.from(keyEncoded, 'base64').toString('utf-8');

    if (provider === 'anthropic') {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: model,
          max_tokens: 5,
          messages: [{ role: 'user', content: 'Hi' }],
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: { message: res.statusText } }));
        return NextResponse.json({
          error: `Anthropic ${res.status}: ${err.error?.message || 'Unknown error'}`,
        }, { status: 400 });
      }

      return NextResponse.json({ provider: 'Anthropic', model, status: 'connected' });
    } else {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: model,
          max_tokens: 5,
          messages: [{ role: 'user', content: 'Hi' }],
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: { message: res.statusText } }));
        return NextResponse.json({
          error: `OpenAI ${res.status}: ${err.error?.message || 'Unknown error'}`,
        }, { status: 400 });
      }

      return NextResponse.json({ provider: 'OpenAI', model, status: 'connected' });
    }
  } catch (error) {
    console.error('Test connection error:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Connection test failed',
    }, { status: 500 });
  }
}
