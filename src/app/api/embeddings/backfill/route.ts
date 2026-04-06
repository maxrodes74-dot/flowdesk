import { createClient } from '@/lib/supabase/server';
import { embedNote, autoLinkNote } from '@/lib/embeddings';
import { NextResponse } from 'next/server';

/**
 * POST /api/embeddings/backfill
 * Generate embeddings for all notes that don't have one yet,
 * then run auto-link on each. Authenticated user only.
 */
export async function POST() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch notes without embeddings
    const { data: notes, error } = await supabase
      .from('notes')
      .select('id, title, content')
      .eq('user_id', user.id)
      .eq('is_archived', false)
      .is('embedding', null)
      .order('created_at', { ascending: true });

    if (error) throw error;

    const results = {
      total: (notes || []).length,
      embedded: 0,
      linked: 0,
      errors: 0,
    };

    for (const note of notes || []) {
      try {
        if ((note.content || '').trim().length === 0 && (note.title || '').trim().length === 0) {
          continue;
        }

        await embedNote(note.id, note.title || '', note.content || '');
        results.embedded++;

        const linkResult = await autoLinkNote(note.id, user.id);
        results.linked += linkResult.created;
      } catch (err) {
        console.error(`Backfill failed for note ${note.id}:`, err);
        results.errors++;
      }
    }

    return NextResponse.json(results);
  } catch (error) {
    console.error('POST /api/embeddings/backfill error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
