import { describe, it, expect } from "vitest";
import { appReducer, defaultState, type AppState } from "@/lib/store";
import type { Client, Proposal, Invoice, Message, Freelancer } from "@/lib/types";

const mockFreelancer: Freelancer = {
  id: "f1",
  userId: "u1",
  name: "Jane Doe",
  email: "jane@example.com",
  profession: "developer",
  hourlyRate: 100,
  tone: "professional",
  services: "Web Development",
  brandColor: "#3B82F6",
  logoUrl: null,
  portfolioUrl: null,
  stripeAccountId: null,
  createdAt: "2026-01-01",
};

const mockClient: Client = {
  id: "c1",
  freelancerId: "f1",
  name: "Acme Corp",
  email: "contact@acme.com",
  company: "Acme",
  portalSlug: "acme-corp",
  createdAt: "2026-01-01",
};

const mockProposal: Proposal = {
  id: "p1",
  freelancerId: "f1",
  clientId: "c1",
  clientName: "Acme Corp",
  title: "Test Proposal",
  brief: "A brief",
  scope: [],
  timeline: "4 weeks",
  budget: "$5,000",
  totalPrice: 5000,
  terms: "Net 15",
  status: "draft",
  aiGenerated: true,
  createdAt: "2026-01-01",
};

describe("appReducer", () => {
  it("sets freelancer", () => {
    const state = appReducer(defaultState, {
      type: "SET_FREELANCER",
      payload: mockFreelancer,
    });
    expect(state.freelancer).toEqual(mockFreelancer);
  });

  it("sets clients", () => {
    const state = appReducer(defaultState, {
      type: "SET_CLIENTS",
      payload: [mockClient],
    });
    expect(state.clients).toHaveLength(1);
    expect(state.clients[0].name).toBe("Acme Corp");
  });

  it("adds a client", () => {
    const initial: AppState = { ...defaultState, clients: [mockClient] };
    const newClient: Client = { ...mockClient, id: "c2", name: "Beta LLC" };
    const state = appReducer(initial, {
      type: "ADD_CLIENT",
      payload: newClient,
    });
    expect(state.clients).toHaveLength(2);
  });

  it("updates a proposal", () => {
    const initial: AppState = { ...defaultState, proposals: [mockProposal] };
    const updated: Proposal = { ...mockProposal, status: "sent" };
    const state = appReducer(initial, {
      type: "UPDATE_PROPOSAL",
      payload: updated,
    });
    expect(state.proposals[0].status).toBe("sent");
  });

  it("sets authentication state", () => {
    const state = appReducer(defaultState, {
      type: "SET_AUTHENTICATED",
      payload: true,
    });
    expect(state.isAuthenticated).toBe(true);
  });

  it("sets loading state", () => {
    const state = appReducer(defaultState, {
      type: "SET_LOADING",
      payload: false,
    });
    expect(state.isLoading).toBe(false);
  });

  it("returns current state for unknown action type", () => {
    const state = appReducer(defaultState, {
      type: "UNKNOWN_ACTION" as never,
      payload: null as never,
    });
    expect(state).toEqual(defaultState);
  });
});
