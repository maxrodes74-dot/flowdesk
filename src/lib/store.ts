"use client";

// App store backed by Supabase
// Local state is used for optimistic updates, but data loads from the database

import { createContext, useContext } from "react";
import {
  Freelancer,
  Client,
  Proposal,
  Invoice,
  Message,
  Milestone,
  TimeEntry,
  Contract,
  Testimonial,
  Referral,
} from "./types";

export interface AppState {
  freelancer: Freelancer | null;
  clients: Client[];
  proposals: Proposal[];
  invoices: Invoice[];
  messages: Message[];
  milestones: Milestone[];
  timeEntries: TimeEntry[];
  contracts: Contract[];
  testimonials: Testimonial[];
  referrals: Referral[];
  isAuthenticated: boolean;
  isLoading: boolean;
}

export const defaultState: AppState = {
  freelancer: null,
  clients: [],
  proposals: [],
  invoices: [],
  messages: [],
  milestones: [],
  timeEntries: [],
  contracts: [],
  testimonials: [],
  referrals: [],
  isAuthenticated: false,
  isLoading: true,
};

export type AppAction =
  | { type: "SET_FREELANCER"; payload: Freelancer | null }
  | { type: "SET_CLIENTS"; payload: Client[] }
  | { type: "ADD_CLIENT"; payload: Client }
  | { type: "SET_PROPOSALS"; payload: Proposal[] }
  | { type: "ADD_PROPOSAL"; payload: Proposal }
  | { type: "UPDATE_PROPOSAL"; payload: Proposal }
  | { type: "SET_INVOICES"; payload: Invoice[] }
  | { type: "ADD_INVOICE"; payload: Invoice }
  | { type: "UPDATE_INVOICE"; payload: Invoice }
  | { type: "SET_MESSAGES"; payload: Message[] }
  | { type: "ADD_MESSAGE"; payload: Message }
  | { type: "SET_MILESTONES"; payload: Milestone[] }
  | { type: "ADD_MILESTONE"; payload: Milestone }
  | { type: "UPDATE_MILESTONE"; payload: Milestone }
  | { type: "SET_TIME_ENTRIES"; payload: TimeEntry[] }
  | { type: "ADD_TIME_ENTRY"; payload: TimeEntry }
  | { type: "SET_CONTRACTS"; payload: Contract[] }
  | { type: "ADD_CONTRACT"; payload: Contract }
  | { type: "UPDATE_CONTRACT"; payload: Contract }
  | { type: "SET_TESTIMONIALS"; payload: Testimonial[] }
  | { type: "ADD_TESTIMONIAL"; payload: Testimonial }
  | { type: "SET_REFERRALS"; payload: Referral[] }
  | { type: "ADD_REFERRAL"; payload: Referral }
  | { type: "UPDATE_REFERRAL"; payload: Referral }
  | { type: "SET_AUTHENTICATED"; payload: boolean }
  | { type: "SET_LOADING"; payload: boolean };

export function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case "SET_FREELANCER":
      return { ...state, freelancer: action.payload };
    case "SET_CLIENTS":
      return { ...state, clients: action.payload };
    case "ADD_CLIENT":
      return { ...state, clients: [...state.clients, action.payload] };
    case "SET_PROPOSALS":
      return { ...state, proposals: action.payload };
    case "ADD_PROPOSAL":
      return { ...state, proposals: [...state.proposals, action.payload] };
    case "UPDATE_PROPOSAL":
      return {
        ...state,
        proposals: state.proposals.map((p) =>
          p.id === action.payload.id ? action.payload : p
        ),
      };
    case "SET_INVOICES":
      return { ...state, invoices: action.payload };
    case "ADD_INVOICE":
      return { ...state, invoices: [...state.invoices, action.payload] };
    case "UPDATE_INVOICE":
      return {
        ...state,
        invoices: state.invoices.map((i) =>
          i.id === action.payload.id ? action.payload : i
        ),
      };
    case "SET_MESSAGES":
      return { ...state, messages: action.payload };
    case "ADD_MESSAGE":
      return { ...state, messages: [...state.messages, action.payload] };
    case "SET_MILESTONES":
      return { ...state, milestones: action.payload };
    case "ADD_MILESTONE":
      return { ...state, milestones: [...state.milestones, action.payload] };
    case "UPDATE_MILESTONE":
      return {
        ...state,
        milestones: state.milestones.map((m) =>
          m.id === action.payload.id ? action.payload : m
        ),
      };
    case "SET_TIME_ENTRIES":
      return { ...state, timeEntries: action.payload };
    case "ADD_TIME_ENTRY":
      return { ...state, timeEntries: [...state.timeEntries, action.payload] };
    case "SET_CONTRACTS":
      return { ...state, contracts: action.payload };
    case "ADD_CONTRACT":
      return { ...state, contracts: [...state.contracts, action.payload] };
    case "UPDATE_CONTRACT":
      return {
        ...state,
        contracts: state.contracts.map((c) =>
          c.id === action.payload.id ? action.payload : c
        ),
      };
    case "SET_TESTIMONIALS":
      return { ...state, testimonials: action.payload };
    case "ADD_TESTIMONIAL":
      return { ...state, testimonials: [...state.testimonials, action.payload] };
    case "SET_REFERRALS":
      return { ...state, referrals: action.payload };
    case "ADD_REFERRAL":
      return { ...state, referrals: [...state.referrals, action.payload] };
    case "UPDATE_REFERRAL":
      return {
        ...state,
        referrals: state.referrals.map((r) =>
          r.id === action.payload.id ? action.payload : r
        ),
      };
    case "SET_AUTHENTICATED":
      return { ...state, isAuthenticated: action.payload };
    case "SET_LOADING":
      return { ...state, isLoading: action.payload };
    default:
      return state;
  }
}

export const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
}>({
  state: defaultState,
  dispatch: () => null,
});

export function useApp() {
  return useContext(AppContext);
}
