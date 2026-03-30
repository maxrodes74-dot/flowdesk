import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { rowToFreelancer } from "@/lib/supabase/data";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");

  if (code) {
    try {
      const supabase = await createClient();

      // Look up referral record by code
      const { data: referralRow, error: referralError } = await supabase
        .from("referrals")
        .select("*")
        .eq("referral_code", code)
        .single();

      if (referralError || !referralRow) {
        return NextResponse.json(
          { error: "Invalid referral code" },
          { status: 404 }
        );
      }

      // Check if referral is still active/not expired
      if (referralRow.status !== "pending" && referralRow.status !== "active") {
        return NextResponse.json(
          { error: "This referral code is no longer valid" },
          { status: 404 }
        );
      }

      // Get freelancer data
      const { data: freelancerRow, error: freelancerError } = await supabase
        .from("freelancers")
        .select("*")
        .eq("id", referralRow.referrer_id)
        .single();

      if (freelancerError || !freelancerRow) {
        return NextResponse.json(
          { error: "Freelancer not found" },
          { status: 404 }
        );
      }

      const freelancer = rowToFreelancer(freelancerRow);

      // Parse services from the comma-separated string or JSON
      const services = typeof freelancer.services === "string"
        ? freelancer.services.split(",").map(s => s.trim())
        : Array.isArray(freelancer.services)
        ? freelancer.services
        : [];

      // Get testimonials from projects/invoices if available
      // For now, we'll return an empty array - in a full implementation,
      // this could fetch from a testimonials table
      const testimonials: Array<{
        clientName: string;
        text: string;
        rating: number;
      }> = [];

      return NextResponse.json({
        freelancer: {
          id: freelancer.id,
          name: freelancer.name,
          profession: freelancer.profession,
          hourlyRate: freelancer.hourlyRate,
          description: freelancer.portfolioUrl || "Experienced freelancer",
          services,
          testimonials,
        },
      });
    } catch (error) {
      console.error("Error fetching referral data:", error);
      return NextResponse.json(
        { error: "Failed to fetch referral data" },
        { status: 500 }
      );
    }
  }

  // GET list of referrals for authenticated freelancer
  try {
    const supabase = await createClient();

    // Get the authenticated user's freelancer ID from the auth context
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get freelancer ID from user
    const { data: freelancerRow } = await supabase
      .from("freelancers")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!freelancerRow) {
      return NextResponse.json(
        { error: "Freelancer not found" },
        { status: 404 }
      );
    }

    // Get all referrals for this freelancer
    const { data: referrals } = await supabase
      .from("referrals")
      .select("*")
      .eq("referrer_id", freelancerRow.id);

    return NextResponse.json({ referrals: referrals || [] });
  } catch (error) {
    console.error("Error fetching referrals:", error);
    return NextResponse.json(
      { error: "Failed to fetch referrals" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    const { freelancer_id, referred_email, code, action } = body;

    // Handle referral signup completion
    if (action === "track_signup") {
      if (!code || !referred_email) {
        return NextResponse.json(
          { error: "Missing code or referred_email" },
          { status: 400 }
        );
      }

      // Update the referral record to mark as completed
      const { data: updatedReferral, error: updateError } = await supabase
        .from("referrals")
        .update({
          status: "completed",
          referred_email,
        })
        .eq("referral_code", code)
        .select()
        .single();

      if (updateError) {
        console.error("Error updating referral:", updateError);
        return NextResponse.json(
          { error: "Failed to track referral signup" },
          { status: 500 }
        );
      }

      return NextResponse.json(
        { success: true, referral: updatedReferral },
        { status: 200 }
      );
    }

    // Create a new referral code (for freelancer dashboard)
    if (!freelancer_id) {
      return NextResponse.json(
        { error: "freelancer_id is required" },
        { status: 400 }
      );
    }

    // Generate a unique referral code
    const code_generated = `REF${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    const { data: newReferral, error: createError } = await supabase
      .from("referrals")
      .insert({
        referrer_id: freelancer_id,
        referral_code: code_generated,
        referred_email: referred_email || "",
        status: "pending",
      })
      .select()
      .single();

    if (createError) {
      console.error("Error creating referral:", createError);
      return NextResponse.json(
        { error: "Failed to create referral" },
        { status: 500 }
      );
    }

    return NextResponse.json(newReferral, { status: 201 });
  } catch (error) {
    console.error("Error in POST /api/referrals:", error);
    return NextResponse.json(
      { error: "Failed to process referral request" },
      { status: 500 }
    );
  }
}
