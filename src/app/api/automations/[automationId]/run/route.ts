import { createClient } from '@/lib/supabase/server';
import { executeAutomation } from '@/lib/automation-engine';
import { NextRequest, NextResponse } from 'next/server';

type Params = { automationId: string };

/**
 * POST /api/automations/[automationId]/run
 * Execute an automation immediately
 * Body (optional): { customInput: "research topic or custom instruction" }
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<Params> }
) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { automationId } = await params;

    // Fetch the automation
    const { data: automation, error } = await supabase
      .from('automations')
      .select('*')
      .eq('id', automationId)
      .eq('user_id', user.id)
      .single();

    if (error || !automation) {
      return NextResponse.json({ error: 'Automation not found' }, { status: 404 });
    }

    // Check if already running
    if (automation.last_run_status === 'running') {
      return NextResponse.json({ error: 'Automation is already running' }, { status: 409 });
    }

    // Parse optional custom input
    let customInput: string | undefined;
    try {
      const body = await req.json();
      customInput = body.customInput;
    } catch {
      // No body is fine
    }

    // Execute
    const result = await executeAutomation(automation, customInput);

    return NextResponse.json(result);
  } catch (error) {
    console.error('POST /api/automations/[id]/run error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
