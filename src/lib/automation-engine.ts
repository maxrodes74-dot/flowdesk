import { createClient } from '@/lib/supabase/server';
import type { Database } from '@/lib/supabase/types';

type Automation = Database['public']['Tables']['automations']['Row'];

/**
 * Get user's BYOT API key and provider from their profile settings
 */
async function getUserLLMConfig(userId: string): Promise<{
  provider: 'anthropic' | 'openai';
  apiKey: string;
  model: string;
} | null> {
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from('profiles')
    .select('settings')
    .eq('id', userId)
    .single();

  if (!profile?.settings) return null;

  const settings = profile.settings as Record<string, unknown>;
  const provider = settings.llm_provider as string;
  const apiKey = settings.llm_api_key as string;
  const model = settings.llm_model as string;

  if (!apiKey || !provider) return null;

  // Decode the base64-stored key
  let decodedKey: string;
  try {
    decodedKey = Buffer.from(apiKey, 'base64').toString('utf-8');
  } catch {
    decodedKey = apiKey;
  }

  return {
    provider: provider as 'anthropic' | 'openai',
    apiKey: decodedKey,
    model: model || (provider === 'anthropic' ? 'claude-haiku-4-5-20251001' : 'gpt-4o-mini'),
  };
}

/**
 * Build context from user's notes for the prompt
 */
async function buildNoteContext(userId: string): Promise<{
  notes: string;
  note_titles: string;
  existing_tags: string;
  links: string;
  graph_summary: string;
}> {
  const supabase = await createClient();

  // Fetch notes
  const { data: notes } = await supabase
    .from('notes')
    .select('id, title, content, created_at, updated_at')
    .eq('user_id', userId)
    .eq('is_archived', false)
    .order('updated_at', { ascending: false })
    .limit(100);

  // Fetch tags
  const { data: tags } = await supabase
    .from('tags')
    .select('tag')
    .limit(200);

  // Fetch links
  const { data: links } = await supabase
    .from('links')
    .select('source_note_id, target_note_id, context, auto_generated, strength')
    .eq('dismissed', false)
    .limit(200);

  const notesList = (notes || [])
    .map((n) => {
      const preview = n.content.length > 500 ? n.content.slice(0, 500) + '...' : n.content;
      return `### ${n.title}\nUpdated: ${n.updated_at}\n${preview}\n`;
    })
    .join('\n---\n');

  const noteTitles = (notes || []).map((n) => n.title).join(', ');

  const uniqueTags = [...new Set((tags || []).map((t) => t.tag))];

  // Build a title lookup for links display
  const noteMap = new Map((notes || []).map((n) => [n.id, n.title]));
  const linksStr = (links || [])
    .map((l) => {
      const src = noteMap.get(l.source_note_id) || l.source_note_id;
      const tgt = noteMap.get(l.target_note_id) || l.target_note_id;
      const auto = l.auto_generated ? ' (auto)' : '';
      return `${src} → ${tgt}${auto}${l.context ? ` [${l.context}]` : ''}`;
    })
    .join('\n');

  const graphSummary = `Total notes: ${(notes || []).length}. Total links: ${(links || []).length}. Tags in use: ${uniqueTags.length}. Most recent note: "${(notes || [])[0]?.title || 'none'}"`;

  return {
    notes: notesList,
    note_titles: noteTitles,
    existing_tags: uniqueTags.join(', '),
    links: linksStr || 'No links yet.',
    graph_summary: graphSummary,
  };
}

/**
 * Fill template variables in a prompt
 */
function fillPrompt(
  prompt: string,
  context: Record<string, string>,
  customInput?: string
): string {
  let filled = prompt;
  for (const [key, value] of Object.entries(context)) {
    filled = filled.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
  }
  if (customInput) {
    filled = filled.replace(/\{\{custom_input\}\}/g, customInput);
  }
  return filled;
}

/**
 * Call the LLM via the user's BYOT key
 */
async function callLLM(
  config: { provider: 'anthropic' | 'openai'; apiKey: string; model: string },
  prompt: string
): Promise<{ content: string; tokensUsed: number }> {
  if (config.provider === 'anthropic') {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': config.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: config.model,
        max_tokens: 4096,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Anthropic API error (${response.status}): ${err}`);
    }

    const data = await response.json();
    const content = data.content?.[0]?.text || '';
    const tokensUsed = (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0);
    return { content, tokensUsed };
  } else {
    // OpenAI
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.model,
        max_tokens: 4096,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`OpenAI API error (${response.status}): ${err}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';
    const tokensUsed = (data.usage?.total_tokens || 0);
    return { content, tokensUsed };
  }
}

/**
 * Parse the LLM response — try JSON first, fall back to raw text
 */
function parseResponse(content: string): unknown {
  // Try to extract JSON from the response
  const jsonMatch = content.match(/```json\s*([\s\S]*?)```/) || content.match(/(\[[\s\S]*\])/) || content.match(/(\{[\s\S]*\})/);
  if (jsonMatch) {
    try {
      return JSON.parse(jsonMatch[1]);
    } catch {
      // Fall through
    }
  }
  try {
    return JSON.parse(content);
  } catch {
    return content;
  }
}

/**
 * Apply results from certain automations (create notes, links, tags)
 */
async function applyResults(
  userId: string,
  presetKey: string | null,
  parsed: unknown
): Promise<{ notes_created: number; notes_updated: number; links_created: number; links_removed: number }> {
  const supabase = await createClient();
  const stats = { notes_created: 0, notes_updated: 0, links_created: 0, links_removed: 0 };

  if (!parsed || typeof parsed !== 'object') return stats;

  // Handle synthesis — create new notes
  if (presetKey === 'synthesis' || presetKey === 'research') {
    const items = Array.isArray(parsed) ? parsed : [];
    for (const item of items) {
      if (item.title && item.content) {
        const { error } = await supabase.from('notes').insert({
          user_id: userId,
          title: item.title,
          content: item.content,
        });
        if (!error) stats.notes_created++;

        // Add tags if present
        if (item.tags && Array.isArray(item.tags)) {
          for (const tag of item.tags) {
            await supabase.from('tags').insert({
              note_id: (await supabase.from('notes').select('id').eq('title', item.title).eq('user_id', userId).single()).data?.id || '',
              tag,
              auto_generated: true,
            }).single();
          }
        }
      }
    }
  }

  // Handle auto-tag — apply tags to existing notes
  if (presetKey === 'auto_tag') {
    const items = Array.isArray(parsed) ? parsed : [];
    for (const item of items) {
      if (item.note_title && item.tags) {
        // Find the note by title
        const { data: note } = await supabase
          .from('notes')
          .select('id')
          .eq('user_id', userId)
          .eq('title', item.note_title)
          .eq('is_archived', false)
          .single();

        if (note) {
          for (const tag of item.tags) {
            await supabase.from('tags').upsert({
              note_id: note.id,
              tag,
              auto_generated: true,
            }, { onConflict: 'note_id,tag' });
          }
          stats.notes_updated++;
        }
      }
    }
  }

  // Handle auto-link — create links between notes
  if (presetKey === 'auto_link' || presetKey === 'link_review') {
    const items = Array.isArray(parsed)
      ? parsed
      : (parsed as Record<string, unknown>).new_links
        ? ((parsed as Record<string, unknown>).new_links as unknown[])
        : [];

    for (const item of items as Array<Record<string, unknown>>) {
      const srcTitle = (item.source_title || item.source) as string;
      const tgtTitle = (item.target_title || item.target) as string;
      if (!srcTitle || !tgtTitle) continue;

      const { data: srcNote } = await supabase
        .from('notes').select('id')
        .eq('user_id', userId).eq('title', srcTitle).eq('is_archived', false).single();
      const { data: tgtNote } = await supabase
        .from('notes').select('id')
        .eq('user_id', userId).eq('title', tgtTitle).eq('is_archived', false).single();

      if (srcNote && tgtNote) {
        const { error } = await supabase.from('links').upsert({
          source_note_id: srcNote.id,
          target_note_id: tgtNote.id,
          context: (item.reason as string) || null,
          auto_generated: true,
          strength: (item.strength as number) || 0.8,
        }, { onConflict: 'source_note_id,target_note_id' });
        if (!error) stats.links_created++;
      }
    }

    // Handle removals from link_review
    if (presetKey === 'link_review' && (parsed as Record<string, unknown>).remove) {
      const removals = (parsed as Record<string, unknown>).remove as Array<Record<string, unknown>>;
      for (const item of removals) {
        const srcTitle = item.source as string;
        const tgtTitle = item.target as string;
        if (!srcTitle || !tgtTitle) continue;

        const { data: srcNote } = await supabase
          .from('notes').select('id')
          .eq('user_id', userId).eq('title', srcTitle).single();
        const { data: tgtNote } = await supabase
          .from('notes').select('id')
          .eq('user_id', userId).eq('title', tgtTitle).single();

        if (srcNote && tgtNote) {
          const { error } = await supabase.from('links')
            .update({ dismissed: true })
            .eq('source_note_id', srcNote.id)
            .eq('target_note_id', tgtNote.id);
          if (!error) stats.links_removed++;
        }
      }
    }
  }

  // Handle expand_note — update existing notes
  if (presetKey === 'expand_note') {
    const items = Array.isArray(parsed) ? parsed : [];
    for (const item of items) {
      if (item.note_title && item.expanded_content) {
        const { error } = await supabase
          .from('notes')
          .update({ content: item.expanded_content })
          .eq('user_id', userId)
          .eq('title', item.note_title);
        if (!error) stats.notes_updated++;
      }
    }
  }

  return stats;
}

/**
 * Execute an automation — the main entry point
 */
export async function executeAutomation(
  automation: Automation,
  customInput?: string
): Promise<{
  success: boolean;
  result: string;
  stats: { notes_created: number; notes_updated: number; links_created: number; links_removed: number; tokens_used: number };
  duration_ms: number;
}> {
  const startTime = Date.now();
  const supabase = await createClient();

  try {
    // Get user's LLM config
    const llmConfig = await getUserLLMConfig(automation.user_id);
    if (!llmConfig) {
      throw new Error('No API key configured. Go to Settings to add your LLM API key.');
    }

    // Build context from notes
    const context = await buildNoteContext(automation.user_id);

    // Fill the prompt template
    const filledPrompt = fillPrompt(automation.prompt, context, customInput);

    // Mark as running
    await supabase
      .from('automations')
      .update({ last_run_status: 'running' })
      .eq('id', automation.id);

    // Call the LLM
    const { content, tokensUsed } = await callLLM(llmConfig, filledPrompt);

    // Parse and apply results
    const parsed = parseResponse(content);
    const stats = await applyResults(automation.user_id, automation.preset_key, parsed);

    // Build a human-readable summary
    const parts: string[] = [];
    if (stats.notes_created > 0) parts.push(`Created ${stats.notes_created} note${stats.notes_created > 1 ? 's' : ''}`);
    if (stats.notes_updated > 0) parts.push(`Updated ${stats.notes_updated} note${stats.notes_updated > 1 ? 's' : ''}`);
    if (stats.links_created > 0) parts.push(`Created ${stats.links_created} link${stats.links_created > 1 ? 's' : ''}`);
    if (stats.links_removed > 0) parts.push(`Removed ${stats.links_removed} link${stats.links_removed > 1 ? 's' : ''}`);
    const summary = parts.length > 0
      ? parts.join('. ') + '.'
      : typeof parsed === 'string' ? parsed.slice(0, 500) : JSON.stringify(parsed).slice(0, 500);

    const duration_ms = Date.now() - startTime;

    // Update automation
    await supabase
      .from('automations')
      .update({
        last_run_at: new Date().toISOString(),
        last_run_status: 'success',
        last_run_result: summary,
        run_count: automation.run_count + 1,
      })
      .eq('id', automation.id);

    // Write run history
    await supabase.from('automation_runs').insert({
      automation_id: automation.id,
      user_id: automation.user_id,
      status: 'success',
      result: summary,
      notes_created: stats.notes_created,
      notes_updated: stats.notes_updated,
      links_created: stats.links_created,
      links_removed: stats.links_removed,
      tokens_used: tokensUsed,
      duration_ms,
      completed_at: new Date().toISOString(),
    });

    return {
      success: true,
      result: summary,
      stats: { ...stats, tokens_used: tokensUsed },
      duration_ms,
    };
  } catch (error) {
    const duration_ms = Date.now() - startTime;
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';

    // Update automation with error
    await supabase
      .from('automations')
      .update({
        last_run_at: new Date().toISOString(),
        last_run_status: 'error',
        last_run_result: errorMsg,
      })
      .eq('id', automation.id);

    // Write error run
    await supabase.from('automation_runs').insert({
      automation_id: automation.id,
      user_id: automation.user_id,
      status: 'error',
      error_message: errorMsg,
      duration_ms,
      completed_at: new Date().toISOString(),
    });

    return {
      success: false,
      result: errorMsg,
      stats: { notes_created: 0, notes_updated: 0, links_created: 0, links_removed: 0, tokens_used: 0 },
      duration_ms,
    };
  }
}
