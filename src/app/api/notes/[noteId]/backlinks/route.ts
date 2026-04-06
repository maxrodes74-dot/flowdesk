import { createClient } from '@/lib/supabase/server';
import { getBacklinks } from '@/lib/notes';
import { NextRequest, NextResponse } from 'next/server';

type Params = {
  noteId: string;
};

/**
 * GET /api/notes/[noteId]/backlinks
 * Fetch all notes that link TO this note
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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { noteId } = await params;
    const backlinks = await getBacklinks(noteId);

    return NextResponse.json(backlinks);
  } catch (error) {
    console.error('GET /api/notes/[noteId]/backlinks error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
