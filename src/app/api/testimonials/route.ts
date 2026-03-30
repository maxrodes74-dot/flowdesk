import { NextRequest, NextResponse } from "next/server";

// Mock data stores - in production, these would be from Supabase
const mockTestimonialRequests: Record<string, any> = {
  token_abc123: {
    id: "req_1",
    freelancerId: "freelancer_1",
    freelancerName: "Alex Johnson",
    clientId: "client_1",
    token: "token_abc123",
    email: "client@example.com",
    expiresAt: "2025-12-31T23:59:59Z",
    completed: false,
    createdAt: "2024-03-20",
  },
  token_def456: {
    id: "req_2",
    freelancerId: "freelancer_2",
    freelancerName: "Jane Smith",
    clientId: "client_2",
    token: "token_def456",
    email: "another@example.com",
    expiresAt: "2025-12-31T23:59:59Z",
    completed: false,
    createdAt: "2024-03-19",
  },
};

const mockTestimonials: any[] = [
  {
    id: "t1",
    freelancerId: "freelancer_1",
    clientId: "client_1",
    rating: 5,
    text: "Excellent service! The deliverables exceeded our expectations and the communication was seamless.",
    clientName: "Sarah Johnson",
    permission_to_use: true,
    created_at: "2024-03-15",
  },
  {
    id: "t2",
    freelancerId: "freelancer_1",
    clientId: "client_2",
    rating: 5,
    text: "Professional, reliable, and delivers on time. Highly recommended for any serious projects.",
    clientName: "Michael Chen",
    permission_to_use: true,
    created_at: "2024-03-10",
  },
  {
    id: "t3",
    freelancerId: "freelancer_1",
    clientId: "client_3",
    rating: 4,
    text: "Great work overall. Very responsive to feedback and willing to iterate.",
    clientName: "Emma Davis",
    permission_to_use: true,
    created_at: "2024-03-05",
  },
];

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const token = searchParams.get("token");
  const freelancerId = searchParams.get("freelancerId");

  if (token) {
    // Look up testimonial request by token
    const testimonialRequest = mockTestimonialRequests[token];
    if (!testimonialRequest) {
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 404 }
      );
    }

    // Check if expired
    if (new Date(testimonialRequest.expiresAt) < new Date()) {
      return NextResponse.json(
        { error: "Token has expired" },
        { status: 410 }
      );
    }

    return NextResponse.json({
      freelancerName: testimonialRequest.freelancerName,
      freelancerId: testimonialRequest.freelancerId,
    });
  }

  if (freelancerId) {
    // Get all testimonials for a freelancer
    const testimonials = mockTestimonials.filter(
      (t) => t.freelancerId === freelancerId && t.permission_to_use
    );
    return NextResponse.json({ testimonials });
  }

  return NextResponse.json(
    { error: "Missing token or freelancerId parameter" },
    { status: 400 }
  );
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, rating, text, clientName, permission_to_use } = body;

    // Validate token
    if (!token || !mockTestimonialRequests[token]) {
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 400 }
      );
    }

    // Validate required fields
    if (!rating || !text || !clientName || text.length < 20) {
      return NextResponse.json(
        { error: "Invalid testimonial data" },
        { status: 400 }
      );
    }

    const tokenData = mockTestimonialRequests[token];

    // Create testimonial
    const newTestimonial = {
      id: `t_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      freelancerId: tokenData.freelancerId,
      clientId: tokenData.clientId,
      rating,
      text,
      clientName,
      permission_to_use,
      created_at: new Date().toISOString(),
    };

    // Store in mock data
    mockTestimonials.push(newTestimonial);

    // Mark request as completed
    mockTestimonialRequests[token].completed = true;

    return NextResponse.json(newTestimonial, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to submit testimonial" },
      { status: 500 }
    );
  }
}
