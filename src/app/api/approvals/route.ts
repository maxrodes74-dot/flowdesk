// =============================================================
// MTR-294: Agent Guardrails - Pending Approvals Endpoint
// GET  /api/approvals  — list pending approvals (session auth)
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

  // Get query parameters
  const url = new URL(request.url);
  const statusFilter = url.searchParams.get("status") || "pending";
  const limit = parseInt(url.searchParams.get("limit") || "50", 10);
  const offset = parseInt(url.searchParams.get("offset") || "0", 10);

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

  // Fetch pending approvals
  let query = supabase
    .from("pending_approvals")
    .select("*", { count: "exact" })
    .eq("freelancer_id", freelancer.id)
    .order("created_at", { ascending: false });

  if (statusFilter !== "all") {
    query = query.eq("status", statusFilter);
  }

  const { data: approvals, count, error } = await query
    .range(offset, offset + limit - 1);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ approvals, total: count });
}
