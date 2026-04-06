import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

type Params = {
  linkId: string;
};

/**
 * PATCH /api/links/[linkId]
 * Accept or dismiss an auto-generated link
 * Body: { action: 'accept' | 'dismiss' }
 */
export async function PATCH(
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

    const { linkId } = await params;
    const body = await req.json();
    const { action } = body;

    if (!action || !['accept', 'dismiss'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be "accept" or "dismiss".' },
        { status: 400 }
      );
    }

    // Fetch the link and verify ownership via the source note
    const { data: link, error: linkError } = await supabase
      .from('links')
      .select('id, source_note_id, target_note_id, auto_generated')
      .eq('id', linkId)
      .single();

    if (linkError || !link) {
      return NextResponse.json({ error: 'Link not found' }, { status: 404 });
    }

    // Verify the user owns at least one of the linked notes
    const { data: ownerCheck } = await supabase
      .from('notes')
      .select('id')
      .eq('user_id', user.id)
      .in('id', [link.source_note_id, link.target_note_id])
      .limit(1);

    if (!ownerCheck || ownerCheck.length === 0) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    if (action === 'accept') {
      // Accept: mark as no longer auto-generated (becomes a permanent user link)
      const { error } = await supabase
        .from('links')
        .update({ auto_generated: false })
        .eq('id', linkId);

      if (error) throw error;
    } else {
      // Dismiss: mark as dismissed (hidden from graph)
      const { error } = await supabase
        .from('links')
        .update({ dismissed: true })
        .eq('id', linkId);

      if (error) throw error;
    }

    return NextResponse.json({ success: true, action });
  } catch (error) {
    console.error('PATCH /api/links/[linkId] error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
