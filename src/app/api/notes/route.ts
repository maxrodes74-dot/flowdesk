import { createClient } from '@/lib/supabase/server';
import { getNotes, createNote } from '@/lib/notes';
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

    const searchParams = req.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    const { notes, total } = await getNotes(user.id, { limit, offset });

    return NextResponse.json({
      data: notes,
      total,
      limit,
      offset,
      hasMore: offset + notes.length < total,
    });
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

    return NextResponse.json(note, { status: 201 });
  } catch (error) {
    console.error('POST /api/notes error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
