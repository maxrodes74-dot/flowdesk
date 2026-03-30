import { Freelancer, Client, Proposal, Invoice, Message, DashboardStats } from "./types";

export const mockFreelancer: Freelancer = {
  id: "fl_1",
  userId: "user_1",
  name: "Alex Rivera",
  email: "alex@example.com",
  profession: "developer",
  hourlyRate: 120,
  tone: "professional",
  services: "Full-stack web development, API design, cloud architecture, performance optimization",
  brandColor: "#2563eb",
  logoUrl: null,
  portfolioUrl: "https://alexrivera.dev",
  stripeAccountId: null,
  subscriptionTier: 'free' as const,
  aiGenerationsUsedThisMonth: 0,
  createdAt: "2026-03-01T00:00:00Z",
};

export const mockClients: Client[] = [
  {
    id: "cl_1",
    freelancerId: "fl_1",
    name: "Sarah Chen",
    email: "sarah@acmecorp.com",
    company: "Acme Corp",
    portalSlug: "sarah-chen",
    createdAt: "2026-03-05T00:00:00Z",
  },
  {
    id: "cl_2",
    freelancerId: "fl_1",
    name: "Marcus Johnson",
    email: "marcus@brightlabs.io",
    company: "BrightLabs",
    portalSlug: "marcus-johnson",
    createdAt: "2026-03-10T00:00:00Z",
  },
  {
    id: "cl_3",
    freelancerId: "fl_1",
    name: "Emma Williams",
    email: "emma@startupxyz.com",
    company: "StartupXYZ",
    portalSlug: "emma-williams",
    createdAt: "2026-03-15T00:00:00Z",
  },
];

export const mockProposals: Proposal[] = [
  {
    id: "prop_1",
    freelancerId: "fl_1",
    clientId: "cl_1",
    clientName: "Sarah Chen",
    title: "E-Commerce Platform Redesign",
    brief: "Redesign the existing e-commerce platform with a modern UI, improved checkout flow, and mobile-first approach.",
    scope: [
      { title: "Discovery & UX Audit", description: "Review existing platform, identify pain points, create user flow diagrams", dueDate: "2026-04-07" },
      { title: "UI Design & Prototyping", description: "Design new interface in Figma, interactive prototype for key flows", dueDate: "2026-04-21" },
      { title: "Frontend Development", description: "Build responsive React frontend with Next.js, integrate with existing API", dueDate: "2026-05-12" },
      { title: "Testing & Launch", description: "QA testing, performance optimization, staged rollout", dueDate: "2026-05-26" },
    ],
    timeline: "8 weeks",
    budget: "$12,000 - $15,000",
    totalPrice: 14400,
    terms: "50% upfront, 25% at midpoint, 25% on completion. Two rounds of revisions included per milestone. Additional revisions at $120/hr.",
    status: "approved",
    aiGenerated: true,
    createdAt: "2026-03-06T00:00:00Z",
  },
  {
    id: "prop_2",
    freelancerId: "fl_1",
    clientId: "cl_2",
    clientName: "Marcus Johnson",
    title: "API Integration Suite",
    brief: "Build a suite of API integrations connecting their CRM with Stripe, Mailchimp, and Slack.",
    scope: [
      { title: "Architecture Planning", description: "Design integration architecture, define data flows and error handling", dueDate: "2026-04-03" },
      { title: "Stripe Integration", description: "Payment sync, webhook handlers, billing automation", dueDate: "2026-04-14" },
      { title: "Mailchimp + Slack Integration", description: "Contact sync, campaign triggers, Slack notifications", dueDate: "2026-04-28" },
      { title: "Documentation & Handoff", description: "API docs, runbook, monitoring setup", dueDate: "2026-05-05" },
    ],
    timeline: "5 weeks",
    budget: "$8,000 - $10,000",
    totalPrice: 9600,
    terms: "Net 15 payment terms. 40% upfront, 60% on completion.",
    status: "sent",
    aiGenerated: true,
    createdAt: "2026-03-12T00:00:00Z",
  },
  {
    id: "prop_3",
    freelancerId: "fl_1",
    clientId: "cl_3",
    clientName: "Emma Williams",
    title: "MVP Development - Task Management App",
    brief: "Build an MVP for a task management app with real-time collaboration features.",
    scope: [
      { title: "Technical Scoping", description: "Define tech stack, database schema, core features for MVP", dueDate: "2026-04-10" },
      { title: "Core App Development", description: "Auth, task CRUD, project boards, real-time sync", dueDate: "2026-05-08" },
      { title: "Polish & Deploy", description: "UI polish, deployment to Vercel + Supabase, monitoring", dueDate: "2026-05-22" },
    ],
    timeline: "6 weeks",
    budget: "$10,000 - $14,000",
    totalPrice: 12000,
    terms: "Three milestone payments: $4,000 each upon completion of each phase.",
    status: "draft",
    aiGenerated: false,
    createdAt: "2026-03-20T00:00:00Z",
  },
];

export const mockInvoices: Invoice[] = [
  {
    id: "inv_1",
    freelancerId: "fl_1",
    clientId: "cl_1",
    clientName: "Sarah Chen",
    lineItems: [
      { description: "E-Commerce Redesign — Discovery & UX Audit", quantity: 1, rate: 3600 },
      { description: "E-Commerce Redesign — UI Design & Prototyping (50% deposit)", quantity: 1, rate: 3600 },
    ],
    total: 7200,
    status: "paid",
    dueDate: "2026-03-20",
    paidAt: "2026-03-18T00:00:00Z",
    paymentTerms: "due_on_receipt",
    stripePaymentId: "pi_mock_1",
    createdAt: "2026-03-06T00:00:00Z",
  },
  {
    id: "inv_2",
    freelancerId: "fl_1",
    clientId: "cl_1",
    clientName: "Sarah Chen",
    lineItems: [
      { description: "E-Commerce Redesign — Frontend Development (midpoint)", quantity: 1, rate: 3600 },
    ],
    total: 3600,
    status: "sent",
    dueDate: "2026-04-15",
    paidAt: null,
    paymentTerms: "net_15",
    stripePaymentId: null,
    createdAt: "2026-03-25T00:00:00Z",
  },
  {
    id: "inv_3",
    freelancerId: "fl_1",
    clientId: "cl_2",
    clientName: "Marcus Johnson",
    lineItems: [
      { description: "API Integration Suite — Upfront deposit (40%)", quantity: 1, rate: 3840 },
    ],
    total: 3840,
    status: "overdue",
    dueDate: "2026-03-20",
    paidAt: null,
    paymentTerms: "net_15",
    stripePaymentId: null,
    createdAt: "2026-03-12T00:00:00Z",
  },
];

export const mockMessages: Message[] = [
  { id: "msg_1", clientId: "cl_1", sender: "freelancer", body: "Hi Sarah! I've sent over the proposal for the e-commerce redesign. Let me know if you have any questions.", createdAt: "2026-03-06T10:00:00Z" },
  { id: "msg_2", clientId: "cl_1", sender: "client", body: "This looks great, Alex! I've approved the proposal. When can we kick off?", createdAt: "2026-03-06T14:30:00Z" },
  { id: "msg_3", clientId: "cl_1", sender: "freelancer", body: "Awesome! I'll start on the discovery phase Monday. I'll share the UX audit findings by end of next week.", createdAt: "2026-03-06T15:00:00Z" },
  { id: "msg_4", clientId: "cl_2", sender: "freelancer", body: "Hey Marcus, proposal for the API integration suite is ready for your review.", createdAt: "2026-03-12T09:00:00Z" },
];

export const mockDashboardStats: DashboardStats = {
  activeClients: 3,
  proposalsSent: 2,
  proposalsApproved: 1,
  totalRevenue: 7200,
  pendingInvoices: 2,
  overdueInvoices: 1,
};

// Mock AI proposal generation
export function generateMockProposal(input: {
  clientName: string;
  brief: string;
  timeline: string;
  budget: string;
}): Omit<Proposal, "id" | "freelancerId" | "clientId" | "createdAt"> {
  const budgetNum = parseInt(input.budget.replace(/[^0-9]/g, "")) || 5000;

  return {
    clientName: input.clientName,
    title: `Project Proposal: ${input.brief.split(".")[0].substring(0, 60)}`,
    brief: input.brief,
    scope: [
      {
        title: "Discovery & Planning",
        description: "Deep dive into requirements, technical scoping, and project roadmap creation. Includes stakeholder interviews and competitive analysis.",
        dueDate: new Date(Date.now() + 14 * 86400000).toISOString().split("T")[0],
      },
      {
        title: "Core Development",
        description: "Implementation of primary features and functionality. Regular check-ins and progress updates throughout this phase.",
        dueDate: new Date(Date.now() + 35 * 86400000).toISOString().split("T")[0],
      },
      {
        title: "Refinement & Testing",
        description: "Quality assurance, performance optimization, and user acceptance testing. Two rounds of revisions included.",
        dueDate: new Date(Date.now() + 49 * 86400000).toISOString().split("T")[0],
      },
      {
        title: "Launch & Handoff",
        description: "Deployment to production, documentation, knowledge transfer, and 2 weeks of post-launch support.",
        dueDate: new Date(Date.now() + 56 * 86400000).toISOString().split("T")[0],
      },
    ],
    timeline: input.timeline || "8 weeks",
    budget: input.budget,
    totalPrice: budgetNum,
    terms: "Payment split across milestones: 30% upfront, 30% at midpoint, 40% on completion. Two rounds of revisions per milestone included. Additional revisions billed at hourly rate. Net 15 payment terms on all invoices.",
    status: "draft",
    aiGenerated: true,
  };
}
