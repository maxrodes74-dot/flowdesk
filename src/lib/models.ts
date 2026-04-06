/**
 * Valid model IDs for each provider.
 * Single source of truth — used by settings page, test endpoint, and automation engine.
 */
export const VALID_MODELS: Record<string, string[]> = {
  anthropic: ['claude-sonnet-4-20250514', 'claude-haiku-4-5-20251001'],
  openai: ['gpt-4o-mini', 'gpt-4o'],
};

export const DEFAULT_MODELS: Record<string, string> = {
  anthropic: 'claude-sonnet-4-20250514',
  openai: 'gpt-4o-mini',
};

/**
 * Returns a valid model for the given provider.
 * If the stored model is invalid/unrecognized, falls back to the default.
 */
export function resolveModel(provider: string, storedModel?: string | null): string {
  const validList = VALID_MODELS[provider];
  if (validList && storedModel && validList.includes(storedModel)) {
    return storedModel;
  }
  return DEFAULT_MODELS[provider] || DEFAULT_MODELS.anthropic;
}
