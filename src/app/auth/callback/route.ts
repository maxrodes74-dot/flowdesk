import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Profile is auto-created by the database trigger on signup
      // Check if there's a next parameter for password reset flow
      if (next === "/update-password") {
        return NextResponse.redirect(`${origin}/update-password`);
      }
      return NextResponse.redirect(`${origin}/garden`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_error`);
}
