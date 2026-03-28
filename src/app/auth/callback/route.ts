import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/onboarding";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Check if user already has a freelancer profile
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: freelancer } = await supabase
          .from("freelancers")
          .select("id")
          .eq("user_id", user.id)
          .single();

        // If they already have a profile, go to dashboard
        if (freelancer) {
          return NextResponse.redirect(`${origin}/dashboard`);
        }
      }

      // New user — send to onboarding
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Something went wrong — redirect to login with error
  return NextResponse.redirect(`${origin}/login?error=auth_callback_error`);
}
