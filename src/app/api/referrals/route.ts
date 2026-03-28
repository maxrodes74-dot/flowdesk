import { NextRequest, NextResponse } from "next/server";

// Mock data store - in production, this would be from Supabase
const mockReferrals: Record<string, any> = {
  REF123ABC: {
    freelancerId: "freelancer_1",
    code: "REF123ABC",
    status: "pending",
    createdAt: "2024-03-20",
  },
  REF456DEF: {
    freelancerId: "freelancer_2",
    code: "REF456DEF",
    status: "pending",
    createdAt: "2024-03-19",
  },
};

// Mock freelancers
const mockFreelancers: Record<string, any> = {
  freelancer_1: {
    id: "freelancer_1",
    name: "Alex Johnson",
    profession: "Web Developer",
    hourlyRate: 85,
    description: "Full-stack web development with 8+ years of experience",
    services: ["React", "Node.js", "PostgreSQL", "AWS"],
    testimonials: [
      {
        clientName: "Sarah Tech",
        text: "Exceptional work and great communication",
        rating: 5,
      },
      {
        clientName: "Mike Digital",
        text: "Delivered on time and exceeded expectations",
        rating: 5,
      },
    ],
  },
  freelancer_2: {
    id: "freelancer_2",
    name: "Jane Smith",
    profession: "UI/UX Designer",
    hourlyRate: 75,
    description: "Creative designer specializing in user-centered design",
    services: ["Figma", "Prototyping", "User Research", "Design Systems"],
    testimonials: [
      {
        clientName: "Emma Corp",
        text: "Best design partner we could ask for",
        rating: 5,
      },
    ],
  },
};

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");

  if (code) {
    // Look up referral by code and return freelancer data
    const referral = mockReferrals[code];
    if (!referral) {
      return NextResponse.json(
        { error: "Invalid referral code" },
        { status: 404 }
      );
    }

    const freelancer = mockFreelancers[referral.freelancerId];
    if (!freelancer) {
      return NextResponse.json(
        { error: "Freelancer not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ freelancer });
  }

  // GET list of referrals for authenticated freelancer
  // In production, extract freelancerId from auth context
  const freelancerId = request.headers.get("x-freelancer-id") || "freelancer_1";

  const referrals = Object.values(mockReferrals).filter(
    (ref) => ref.freelancerId === freelancerId
  );

  return NextResponse.json({ referrals });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { referrer_id, referred_email, referral_code, status } = body;

    // Validate required fields
    if (!referrer_id || !referred_email || !referral_code) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // In production, this would be saved to Supabase
    const newReferral = {
      id: `ref_${Date.now()}`,
      referrer_id,
      referred_email,
      referral_code,
      status: status || "pending",
      created_at: new Date().toISOString(),
    };

    // Store in mock data
    mockReferrals[referral_code] = {
      freelancerId: referrer_id,
      code: referral_code,
      status: newReferral.status,
      createdAt: newReferral.created_at,
    };

    return NextResponse.json(newReferral, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create referral" },
      { status: 500 }
    );
  }
}
