import { createClient } from '@/lib/supabase/server';
import { getNotes, createNote } from '@/lib/notes';
import { embedNote, autoLinkNote } from '@/lib/embeddings';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/notes
 * Fetch all notes for the authenticated user
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const notes = await getNotes(user.id);

    return NextResponse.json(notes);
  } catch (error) {
    console.error('GET /api/notes error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/notes
 * Create a new note
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { title = 'Untitled', content = '' } = body;

    const note = await createNote(user.id, title, content);

    // Fire-and-forget: embed note and auto-link in background
    // Don't block the response on AI operations
    if (content.trim().length > 0) {
      embedNote(note.id, title, content).then(() => {
        autoLinkNote(note.id, user.id).catch(console.error);
      }).catch(console.error);
    }

    return NextResponse.json(note, { status: 201 });
  } catch (error) {
    console.error('POST /api/notes error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
