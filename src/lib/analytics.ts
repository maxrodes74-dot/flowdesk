// ============================================================
// PostHog Analytics Helper Functions
// ============================================================

type EventName =
  | "proposal_generated"
  | "proposal_sent"
  | "proposal_approved"
  | "invoice_created"
  | "invoice_sent"
  | "invoice_paid"
  | "client_created"
  | "milestone_completed"
  | "automation_enabled"
  | "automation_triggered"
  | "testimonial_requested"
  | "testimonial_submitted"
  | "referral_generated";

interface EventProperties {
  [key: string]: string | number | boolean | undefined;
}

declare global {
  interface Window {
    posthog?: {
      capture: (event: string, properties?: EventProperties) => void;
      identify: (
        userId: string,
        properties?: EventProperties
      ) => void;
      reset: () => void;
    };
  }
}

export const analytics = {
  // Proposal events
  captureProposalGenerated: (proposalId: string, clientId: string) => {
    if (typeof window !== "undefined" && window.posthog) {
      window.posthog.capture("proposal_generated", {
        proposalId,
        clientId,
      });
    }
  },

  captureProposalSent: (proposalId: string, clientId: string) => {
    if (typeof window !== "undefined" && window.posthog) {
      window.posthog.capture("proposal_sent", {
        proposalId,
        clientId,
      });
    }
  },

  captureProposalApproved: (proposalId: string, clientId: string) => {
    if (typeof window !== "undefined" && window.posthog) {
      window.posthog.capture("proposal_approved", {
        proposalId,
        clientId,
      });
    }
  },

  // Invoice events
  captureInvoiceCreated: (invoiceId: string, amount: number) => {
    if (typeof window !== "undefined" && window.posthog) {
      window.posthog.capture("invoice_created", {
        invoiceId,
        amount,
      });
    }
  },

  captureInvoiceSent: (invoiceId: string, clientId: string) => {
    if (typeof window !== "undefined" && window.posthog) {
      window.posthog.capture("invoice_sent", {
        invoiceId,
        clientId,
      });
    }
  },

  captureInvoicePaid: (invoiceId: string, amount: number) => {
    if (typeof window !== "undefined" && window.posthog) {
      window.posthog.capture("invoice_paid", {
        invoiceId,
        amount,
      });
    }
  },

  // Client events
  captureClientCreated: (clientId: string, clientName: string) => {
    if (typeof window !== "undefined" && window.posthog) {
      window.posthog.capture("client_created", {
        clientId,
        clientName,
      });
    }
  },

  // Milestone events
  captureMilestoneCompleted: (
    milestoneId: string,
    proposalId: string
  ) => {
    if (typeof window !== "undefined" && window.posthog) {
      window.posthog.capture("milestone_completed", {
        milestoneId,
        proposalId,
      });
    }
  },

  // Automation events
  captureAutomationEnabled: (automationType: string) => {
    if (typeof window !== "undefined" && window.posthog) {
      window.posthog.capture("automation_enabled", {
        automationType,
      });
    }
  },

  captureAutomationTriggered: (automationType: string) => {
    if (typeof window !== "undefined" && window.posthog) {
      window.posthog.capture("automation_triggered", {
        automationType,
      });
    }
  },

  // Testimonial events
  captureTestimonialRequested: (clientId: string) => {
    if (typeof window !== "undefined" && window.posthog) {
      window.posthog.capture("testimonial_requested", {
        clientId,
      });
    }
  },

  captureTestimonialSubmitted: (rating: number) => {
    if (typeof window !== "undefined" && window.posthog) {
      window.posthog.capture("testimonial_submitted", {
        rating,
      });
    }
  },

  // Referral events
  captureReferralGenerated: (clientId: string) => {
    if (typeof window !== "undefined" && window.posthog) {
      window.posthog.capture("referral_generated", {
        clientId,
      });
    }
  },

  // User identification
  identifyUser: (userId: string, properties?: EventProperties) => {
    if (typeof window !== "undefined" && window.posthog) {
      window.posthog.identify(userId, properties);
    }
  },

  resetUser: () => {
    if (typeof window !== "undefined" && window.posthog) {
      window.posthog.reset();
    }
  },
};
