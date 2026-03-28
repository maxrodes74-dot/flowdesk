"use client";

import { useReducer, useEffect, ReactNode } from "react";
import { AppContext, appReducer, defaultState } from "@/lib/store";
import { createClient } from "@/lib/supabase/client";
import { analytics } from "@/lib/analytics";
import {
  rowToFreelancer,
  rowToClient,
  rowToProposal,
  rowToInvoice,
  rowToMessage,
} from "@/lib/supabase/data";

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, defaultState);

  useEffect(() => {
    const supabase = createClient();

    async function loadData() {
      // Check auth
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        dispatch({ type: "SET_AUTHENTICATED", payload: false });
        dispatch({ type: "SET_LOADING", payload: false });
        return;
      }

      dispatch({ type: "SET_AUTHENTICATED", payload: true });

      // Identify user in analytics
      analytics.identifyUser(user.id);

      // Load freelancer profile
      const { data: freelancerRow, error: freelancerError } = await supabase
        .from("freelancers")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (freelancerError && freelancerError.code !== "PGRST116") {
        // PGRST116 = no rows found (expected for new users)
        console.error("Failed to load freelancer profile:", freelancerError);
      }

      if (!freelancerRow) {
        // User exists but hasn't completed onboarding
        dispatch({ type: "SET_LOADING", payload: false });
        return;
      }

      const freelancer = rowToFreelancer(freelancerRow);
      dispatch({ type: "SET_FREELANCER", payload: freelancer });

      // Load clients (with pagination limit)
      const { data: clientRows, error: clientsError } = await supabase
        .from("clients")
        .select("*")
        .eq("freelancer_id", freelancer.id)
        .order("created_at", { ascending: false })
        .limit(100);

      if (clientsError) {
        console.error("Failed to load clients:", clientsError);
      }

      const clients = (clientRows || []).map(rowToClient);
      dispatch({ type: "SET_CLIENTS", payload: clients });

      // Build a client name lookup
      const clientMap = new Map(clients.map((c) => [c.id, c.name]));

      // Load proposals (with pagination limit)
      const { data: proposalRows, error: proposalsError } = await supabase
        .from("proposals")
        .select("*")
        .eq("freelancer_id", freelancer.id)
        .order("created_at", { ascending: false })
        .limit(200);

      if (proposalsError) {
        console.error("Failed to load proposals:", proposalsError);
      }

      const proposals = (proposalRows || []).map((r) =>
        rowToProposal(r, clientMap.get(r.client_id as string) || "Unknown")
      );
      dispatch({ type: "SET_PROPOSALS", payload: proposals });

      // Load invoices (with pagination limit)
      const { data: invoiceRows, error: invoicesError } = await supabase
        .from("invoices")
        .select("*")
        .eq("freelancer_id", freelancer.id)
        .order("created_at", { ascending: false })
        .limit(200);

      if (invoicesError) {
        console.error("Failed to load invoices:", invoicesError);
      }

      const invoices = (invoiceRows || []).map((r) =>
        rowToInvoice(r, clientMap.get(r.client_id as string) || "Unknown")
      );
      dispatch({ type: "SET_INVOICES", payload: invoices });

      // Load messages for all clients (with pagination limit)
      const clientIds = clients.map((c) => c.id);
      if (clientIds.length > 0) {
        const { data: messageRows, error: messagesError } = await supabase
          .from("messages")
          .select("*")
          .in("client_id", clientIds)
          .order("created_at", { ascending: true })
          .limit(500);

        if (messagesError) {
          console.error("Failed to load messages:", messagesError);
        }

        const messages = (messageRows || []).map(rowToMessage);
        dispatch({ type: "SET_MESSAGES", payload: messages });
      }

      dispatch({ type: "SET_LOADING", payload: false });
    }

    loadData();

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        dispatch({ type: "SET_AUTHENTICATED", payload: false });
        dispatch({ type: "SET_FREELANCER", payload: null });
        dispatch({ type: "SET_CLIENTS", payload: [] });
        dispatch({ type: "SET_PROPOSALS", payload: [] });
        dispatch({ type: "SET_INVOICES", payload: [] });
        dispatch({ type: "SET_MESSAGES", payload: [] });
        dispatch({ type: "SET_TESTIMONIALS", payload: [] });
        dispatch({ type: "SET_REFERRALS", payload: [] });
        analytics.resetUser();
      } else if (event === "SIGNED_IN") {
        // Reload data on sign in
        loadData();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}
