import { createClient } from '@/lib/supabase/server';

export type BYOTConfig = {
  provider: 'anthropic' | 'openai';
  apiKey: string;
  model: string;
};

/**
 * Retrieve the user's BYOT LLM configuration from their profile settings.
 * Returns null if no key is set.
 */
export async function getBYOTConfig(userId: string): Promise<BYOTConfig | null> {
  const supabase = await createClient();

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('settings')
    .eq('id', userId)
    .single();

  if (error || !profile?.settings) {
    return null;
  }

  const settings = profile.settings as Record<string, unknown>;

  if (!settings.llm_api_key_encrypted) {
    return null;
  }

  // Decode the base64-encoded key
  const apiKey = Buffer.from(settings.llm_api_key_encrypted as string, 'base64').toString('utf-8');
  const provider = (settings.llm_provider as 'anthropic' | 'openai') || 'anthropic';
  const model = (settings.llm_model as string) || getDefaultModel(provider);

  return { provider, apiKey, model };
}

function getDefaultModel(provider: 'anthropic' | 'openai'): string {
  switch (provider) {
    case 'anthropic':
      return 'claude-sonnet-4-20250514';
    case 'openai':
      return 'gpt-4o';
    default:
      return 'claude-sonnet-4-20250514';
  }
}

/**
 * Call the user's BYOT LLM with a prompt and return the response text.
 * Supports Anthropic and OpenAI providers.
 */
export async function callBYOT(
  config: BYOTConfig,
  systemPrompt: string,
  userPrompt: string
): Promise<string> {
  if (config.provider === 'anthropic') {
    return callAnthropic(config, systemPrompt, userPrompt);
  } else {
    return callOpenAI(config, systemPrompt, userPrompt);
  }
}

async function callAnthropic(
  config: BYOTConfig,
  systemPrompt: string,
  userPrompt: string
): Promise<string> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': config.apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: config.model,
      max_tokens: 2048,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Anthropic API error (${response.status}): ${err}`);
  }

  const data = await response.json();
  // Anthropic returns content as an array of blocks
  const textBlock = data.content?.find((b: { type: string }) => b.type === 'text');
  return textBlock?.text || '';
}

async function callOpenAI(
  config: BYOTConfig,
  systemPrompt: string,
  userPrompt: string
): Promise<string> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model,
      max_tokens: 2048,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`OpenAI API error (${response.status}): ${err}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || '';
}
