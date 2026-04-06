import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

type Params = { automationId: string };

/**
 * GET /api/automations/[automationId]/runs
 * Fetch run history for an automation
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<Params> }
) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { automationId } = await params;

    const { data, error } = await supabase
      .from('automation_runs')
      .select('*')
      .eq('automation_id', automationId)
      .eq('user_id', user.id)
      .order('started_at', { ascending: false })
      .limit(20);

    if (error) throw error;
    return NextResponse.json(data || []);
  } catch (error) {
    console.error('GET /api/automations/[id]/runs error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
