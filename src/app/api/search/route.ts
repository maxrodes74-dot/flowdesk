import { createClient } from '@/lib/supabase/server';
import { searchNotes } from '@/lib/notes';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/search?q=query
 * Full-text search notes
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
    const query = searchParams.get('q') || '';

    if (!query.trim()) {
      return NextResponse.json([]);
    }

    const results = await searchNotes(user.id, query);

    return NextResponse.json(results);
  } catch (error) {
    console.error('GET /api/search error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
