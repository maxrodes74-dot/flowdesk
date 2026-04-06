import { createClient } from '@/lib/supabase/server';
import { getNote, updateNote, deleteNote } from '@/lib/notes';
import { NextRequest, NextResponse } from 'next/server';

type Params = {
  noteId: string;
};

/**
 * GET /api/notes/[noteId]
 * Fetch a single note by ID
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<Params> }
) {
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

    const { noteId } = await params;

    const note = await getNote(noteId);

    if (!note) {
      return NextResponse.json(
        { error: 'Note not found' },
        { status: 404 }
      );
    }

    // Check authorization: user can only view their own notes
    if (note.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    return NextResponse.json(note);
  } catch (error) {
    console.error('GET /api/notes/[noteId] error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/notes/[noteId]
 * Update a note
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<Params> }
) {
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

    const { noteId } = await params;

    // Check authorization
    const note = await getNote(noteId);
    if (!note) {
      return NextResponse.json(
        { error: 'Note not found' },
        { status: 404 }
      );
    }

    if (note.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { title, content } = body;

    const updateData: { title?: string; content?: string } = {};
    if (title !== undefined) updateData.title = title;
    if (content !== undefined) updateData.content = content;

    const updated = await updateNote(noteId, updateData);

    return NextResponse.json(updated);
  } catch (error) {
    console.error('PUT /api/notes/[noteId] error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/notes/[noteId]
 * Archive a note (soft delete)
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<Params> }
) {
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

    const { noteId } = await params;

    // Check authorization
    const note = await getNote(noteId);
    if (!note) {
      return NextResponse.json(
        { error: 'Note not found' },
        { status: 404 }
      );
    }

    if (note.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    await deleteNote(noteId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/notes/[noteId] error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
