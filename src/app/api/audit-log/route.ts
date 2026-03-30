// =============================================================
// MTR-294: Agent Guardrails - Audit Log Endpoint
// GET /api/audit-log  — list audit entries (session auth, paginated)
// =============================================================

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const supabase = await createClient();

  // Verify session (authenticated user)
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Verify user is a freelancer
  const { data: freelancer, error: freelancerError } = await supabase
    .from("freelancers")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (freelancerError || !freelancer) {
    return NextResponse.json(
      { error: "Freelancer profile not found" },
      { status: 404 }
    );
  }

  // Get query parameters
  const url = new URL(request.url);
  const api_key_id = url.searchParams.get("api_key_id");
  const action_category = url.searchParams.get("action_category");
  const from_date = url.searchParams.get("from_date");
  const to_date = url.searchParams.get("to_date");
  const limit = parseInt(url.searchParams.get("limit") || "50", 10);
  const offset = parseInt(url.searchParams.get("offset") || "0", 10);

  // Build query
  let query: any = (supabase as any)
    .from("audit_logs")
    .select("*", { count: "exact" })
    .eq("freelancer_id", freelancer.id)
    .order("created_at", { ascending: false });

  if (api_key_id) {
    query = query.eq("api_key_id" as any, api_key_id);
  }

  if (action_category) {
    query = query.eq("action_category" as any, action_category);
  }

  if (from_date) {
    query = query.gte("created_at", from_date);
  }

  if (to_date) {
    query = query.lte("created_at", to_date);
  }

  const { data: entries, count, error } = await query.range(
    offset,
    offset + limit - 1
  );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    entries,
    total: count,
    limit,
    offset,
  });
}
