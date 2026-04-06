import OpenAI from 'openai';
import { createClient } from '@/lib/supabase/server';

const EMBEDDING_MODEL = 'text-embedding-3-small';
const EMBEDDING_DIMENSIONS = 1536;

// Similarity threshold for auto-linking (0-1, higher = stricter)
const AUTO_LINK_THRESHOLD = 0.78;
// Max auto-links per note
const MAX_AUTO_LINKS_PER_NOTE = 5;

function getOpenAIClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY environment variable is not set');
  }
  return new OpenAI({ apiKey });
}

/**
 * Generate an embedding vector for text content.
 * Combines title + content for richer semantic representation.
 */
export async function generateEmbedding(
  title: string,
  content: string
): Promise<number[]> {
  const openai = getOpenAIClient();

  // Combine title and content, truncate to ~8000 tokens worth (~32k chars)
  const text = `${title}\n\n${content}`.slice(0, 32000);

  if (text.trim().length === 0) {
    // Return zero vector for empty notes
    return new Array(EMBEDDING_DIMENSIONS).fill(0);
  }

  const response = await openai.embeddings.create({
    model: EMBEDDING_MODEL,
    input: text,
    dimensions: EMBEDDING_DIMENSIONS,
  });

  return response.data[0].embedding;
}

/**
 * Store embedding for a note in the database.
 */
export async function storeEmbedding(
  noteId: string,
  embedding: number[]
): Promise<void> {
  const supabase = await createClient();

  // pgvector expects the embedding as a string like '[0.1, 0.2, ...]'
  const embeddingStr = `[${embedding.join(',')}]`;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await supabase
    .from('notes')
    .update({ embedding: embeddingStr } as any)
    .eq('id', noteId);

  if (error) {
    console.error('Failed to store embedding:', error);
    throw error;
  }
}

/**
 * Generate and store embedding for a note.
 * Call this after note creation or content update.
 */
export async function embedNote(
  noteId: string,
  title: string,
  content: string
): Promise<void> {
  try {
    const embedding = await generateEmbedding(title, content);
    await storeEmbedding(noteId, embedding);
  } catch (error) {
    // Log but don't throw — embedding failure shouldn't block note operations
    console.error(`Failed to embed note ${noteId}:`, error);
  }
}

/**
 * Find similar notes using cosine similarity on embeddings.
 * Returns note IDs with their similarity scores.
 */
export async function findSimilarNotes(
  noteId: string,
  userId: string,
  threshold: number = AUTO_LINK_THRESHOLD,
  limit: number = MAX_AUTO_LINKS_PER_NOTE
): Promise<Array<{ id: string; similarity: number }>> {
  const supabase = await createClient();

  // First get the note's embedding
  const { data: note, error: noteError } = await supabase
    .from('notes')
    .select('embedding')
    .eq('id', noteId)
    .single();

  if (noteError || !note?.embedding) {
    return [];
  }

  // Use pgvector cosine distance operator to find similar notes
  // cosine distance = 1 - cosine_similarity, so lower = more similar
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: similar, error: searchError } = await (supabase as any).rpc(
    'match_notes',
    {
      query_embedding: note.embedding,
      match_threshold: threshold,
      match_count: limit,
      p_user_id: userId,
      exclude_note_id: noteId,
    }
  );

  if (searchError) {
    console.error('Similarity search failed:', searchError);
    return [];
  }

  return ((similar as Array<{ id: string; similarity: number }>) || []).map((row) => ({
    id: row.id,
    similarity: row.similarity,
  }));
}

/**
 * Run auto-link for a note: find similar notes and create suggested links.
 * Skips links that already exist (manual or auto).
 */
export async function autoLinkNote(
  noteId: string,
  userId: string
): Promise<{ created: number; skipped: number }> {
  const supabase = await createClient();

  const similar = await findSimilarNotes(noteId, userId);

  if (similar.length === 0) {
    return { created: 0, skipped: 0 };
  }

  let created = 0;
  let skipped = 0;

  for (const match of similar) {
    // Check if link already exists in either direction
    const { data: existing } = await supabase
      .from('links')
      .select('id')
      .or(
        `and(source_note_id.eq.${noteId},target_note_id.eq.${match.id}),and(source_note_id.eq.${match.id},target_note_id.eq.${noteId})`
      )
      .limit(1);

    if (existing && existing.length > 0) {
      skipped++;
      continue;
    }

    // Create auto-generated link
    const { error } = await supabase.from('links').insert({
      source_note_id: noteId,
      target_note_id: match.id,
      auto_generated: true,
      strength: match.similarity,
      context: `Semantic similarity: ${(match.similarity * 100).toFixed(0)}%`,
    });

    if (error) {
      // Likely unique constraint violation (race condition) — skip
      console.error('Failed to create auto-link:', error);
      skipped++;
    } else {
      created++;
    }
  }

  return { created, skipped };
}
