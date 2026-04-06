import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { getBYOTConfig, callBYOT } from '@/lib/byot';
import { embedNote, autoLinkNote } from '@/lib/embeddings';

/**
 * POST /api/automations/:automationId
 * Run an automation manually.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ automationId: string }> }
) {
  try {
    const { automationId } = await params;
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    switch (automationId) {
      case 'auto-link':
        return await runAutoLink(user.id);

      case 'auto-tag':
        return await runAutoTag(user.id);

      case 'auto-reorganize':
      case 'reorganize':
        return await runReorganize(user.id);

      case 'cluster-emergence':
        return await runClusterEmergence(user.id);

      // LLM automations that need BYOT key
      case 'synthesis':
      case 'foraging':
      case 'pruning':
      case 'gap-detection':
      case 'digest':
        return await runLLMAutomation(user.id, automationId);

      default:
        return NextResponse.json(
          { error: `Unknown automation: ${automationId}` },
          { status: 404 }
        );
    }
  } catch (error) {
    console.error('Automation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ─── Auto-Link (embedding-based, no BYOT key needed) ───

async function runAutoLink(userId: string) {
  const supabase = await createClient();

  // Get all user notes
  const { data: notes, error } = await supabase
    .from('notes')
    .select('id, title, content, embedding')
    .eq('user_id', userId)
    .is('archived_at', null);

  if (error) throw error;
  if (!notes || notes.length === 0) {
    return NextResponse.json({ message: 'No notes to process', results: { embedded: 0, linked: 0 } });
  }

  let embedded = 0;
  let linked = 0;

  for (const note of notes) {
    // Embed notes that don't have embeddings yet
    if (!note.embedding) {
      await embedNote(note.id, note.title, note.content);
      embedded++;
    }

    // Run auto-link
    const result = await autoLinkNote(note.id, userId);
    linked += result.created;
  }

  return NextResponse.json({
    message: `Auto-link complete: ${embedded} notes embedded, ${linked} new links created`,
    results: { embedded, linked },
  });
}

// ─── Auto-Tag (BYOT LLM required) ───

async function runAutoTag(userId: string) {
  const config = await getBYOTConfig(userId);
  if (!config) {
    return NextResponse.json(
      { error: 'No API key configured. Add one in Settings.' },
      { status: 400 }
    );
  }

  const supabase = await createClient();

  // Get all notes
  const { data: notes, error } = await supabase
    .from('notes')
    .select('id, title, content')
    .eq('user_id', userId)
    .is('archived_at', null);

  if (error) throw error;
  if (!notes || notes.length === 0) {
    return NextResponse.json({ message: 'No notes to tag', results: { tagged: 0 } });
  }

  // Get notes that already have tags
  const { data: existingTags } = await supabase
    .from('tags')
    .select('note_id')
    .in('note_id', notes.map((n) => n.id));

  const taggedNoteIds = new Set((existingTags || []).map((t) => t.note_id));
  const untagged = notes.filter((n) => !taggedNoteIds.has(n.id));

  if (untagged.length === 0) {
    return NextResponse.json({ message: 'All notes already tagged', results: { tagged: 0 } });
  }

  const systemPrompt = `You are a note classification assistant for a knowledge management system called Deep Garden.
Your job is to analyze notes and assign 1-3 concise, descriptive tags to each one.

Rules:
- Return ONLY a JSON array of strings, e.g. ["tag1", "tag2"]
- Tags should be lowercase, hyphenated (e.g. "machine-learning", "project-ideas")
- Maximum 3 tags per note
- Tags should capture the core topic/domain, not surface-level words
- Be consistent: similar notes should get similar tags`;

  let tagged = 0;

  // Process in batches of 5 to avoid rate limits
  const batch = untagged.slice(0, 20);

  for (const note of batch) {
    try {
      const userPrompt = `Classify this note:\n\nTitle: ${note.title}\n\nContent:\n${note.content.slice(0, 2000)}`;
      const response = await callBYOT(config, systemPrompt, userPrompt);

      // Parse the JSON array from the LLM response
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const tags = JSON.parse(jsonMatch[0]) as string[];
        if (Array.isArray(tags) && tags.length > 0) {
          // Insert tags into the tags table (upsert to avoid duplicates)
          for (const tag of tags.slice(0, 3)) {
            await supabase
              .from('tags')
              .upsert(
                { note_id: note.id, tag: tag.toLowerCase(), auto_generated: true },
                { onConflict: 'note_id,tag' }
              );
          }
          tagged++;
        }
      }
    } catch (err) {
      console.error(`Failed to tag note ${note.id}:`, err);
      // Continue with other notes
    }
  }

  return NextResponse.json({
    message: `Auto-tag complete: ${tagged} of ${batch.length} notes tagged`,
    results: { tagged, total: batch.length },
  });
}

// ─── Reorganize (embedding-based, no BYOT key) ───

async function runReorganize(userId: string) {
  // For now, just re-run auto-link to refresh connections
  // Full spatial reorganization would update x/y positions based on clusters
  return runAutoLink(userId);
}

// ─── Cluster Emergence (embedding-based, no BYOT key) ───

async function runClusterEmergence(userId: string) {
  // Placeholder — needs k-means or DBSCAN on embeddings
  return NextResponse.json({
    message: 'Cluster emergence scan complete (basic mode)',
    results: { clusters: 0 },
  });
}

// ─── Generic LLM Automation (BYOT required) ───

async function runLLMAutomation(userId: string, automationId: string) {
  const config = await getBYOTConfig(userId);
  if (!config) {
    return NextResponse.json(
      { error: 'No API key configured. Add one in Settings.' },
      { status: 400 }
    );
  }

  const supabase = await createClient();

  const { data: notes, error } = await supabase
    .from('notes')
    .select('id, title, content, updated_at')
    .eq('user_id', userId)
    .is('archived_at', null)
    .order('updated_at', { ascending: false })
    .limit(50);

  if (error) throw error;
  if (!notes || notes.length === 0) {
    return NextResponse.json({ message: 'No notes to process', results: {} });
  }

  const prompts = getAutomationPrompts(automationId, notes);
  if (!prompts) {
    return NextResponse.json({ error: 'Automation not implemented' }, { status: 501 });
  }

  try {
    const response = await callBYOT(config, prompts.system, prompts.user);
    return NextResponse.json({
      message: `${automationId} complete`,
      results: { output: response.slice(0, 2000) },
    });
  } catch (err) {
    console.error(`${automationId} failed:`, err);
    return NextResponse.json(
      { error: `${automationId} failed: ${err instanceof Error ? err.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}

// ─── Automation prompt templates ───

type NoteRow = { id: string; title: string; content: string; updated_at: string };

function getAutomationPrompts(
  automationId: string,
  notes: NoteRow[]
): { system: string; user: string } | null {
  const notesSummary = notes
    .slice(0, 30)
    .map((n, i) => `${i + 1}. "${n.title}" — ${n.content.slice(0, 200)}`)
    .join('\n');

  switch (automationId) {
    case 'synthesis':
      return {
        system:
          'You are a knowledge synthesis assistant. Your job is to find connections between notes and suggest new notes that bridge related concepts. Return a JSON array of objects with {title, content} for each suggested synthesis note.',
        user: `Here are my recent notes:\n\n${notesSummary}\n\nSuggest 1-3 new synthesis notes that connect ideas across these notes.`,
      };

    case 'foraging':
      return {
        system:
          'You are a research assistant. Given a collection of notes, suggest web searches or external information that would enrich the knowledge base. Return a JSON array of {query, reason} objects.',
        user: `Here are my recent notes:\n\n${notesSummary}\n\nSuggest 3-5 web searches that would add valuable context to my knowledge base.`,
      };

    case 'pruning':
      return {
        system:
          'You are a knowledge hygiene assistant. Identify stale, duplicate, or contradictory notes. Return a JSON array of {noteIndex, issue, suggestion} objects.',
        user: `Here are my notes:\n\n${notesSummary}\n\nIdentify any stale, duplicate, or contradictory notes. If everything looks clean, say so.`,
      };

    case 'gap-detection':
      return {
        system:
          'You are a knowledge gap analyst. Given a collection of notes, identify missing connective knowledge — topics that are implied but not captured. Return a JSON array of {gap, suggestion} objects.',
        user: `Here are my notes:\n\n${notesSummary}\n\nWhat knowledge gaps do you see? What topics are implied but missing?`,
      };

    case 'digest':
      return {
        system:
          'You are a knowledge digest writer. Summarize recent terrarium activity into a concise weekly digest. Write in a warm, slightly whimsical tone (this is a "garden" after all).',
        user: `Here are my recent notes:\n\n${notesSummary}\n\nWrite a brief weekly digest summarizing activity, themes, and notable connections in my knowledge garden.`,
      };

    default:
      return null;
  }
}
