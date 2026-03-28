// ============================================================
// Project Wrap-Up Automation Logic
// ============================================================

import type { Proposal, Milestone, Invoice } from "../types";

export interface WrapUpSequence {
  projectTitle: string;
  clientId: string;
  clientName: string;
  steps: WrapUpStep[];
}

export interface WrapUpStep {
  type: "invoice" | "thank_you" | "testimonial" | "referral";
  scheduledFor: string; // ISO date string
  completed: boolean;
  message?: string;
}

export function checkProjectCompletion(
  proposal: Proposal,
  milestones: Milestone[]
): boolean {
  if (milestones.length === 0) return false;

  // Check if all milestones are completed
  return milestones.every((m) => m.status === "completed");
}

export function generateWrapUpSequence(
  proposal: Proposal,
  clientName: string,
  config: {
    delayDays: number;
    includeTestimonialRequest: boolean;
    includeReferralAsk: boolean;
  }
): WrapUpSequence {
  const today = new Date();
  const steps: WrapUpStep[] = [];

  // Day 0: Final invoice (if needed)
  steps.push({
    type: "invoice",
    scheduledFor: today.toISOString().split("T")[0],
    completed: false,
    message: "Generate final invoice if not already sent",
  });

  // Day 1: Thank you message
  const thankYouDate = new Date(today);
  thankYouDate.setDate(thankYouDate.getDate() + 1);
  steps.push({
    type: "thank_you",
    scheduledFor: thankYouDate.toISOString().split("T")[0],
    completed: false,
    message: "Send thank you and wrap-up message",
  });

  // Day (1+config.delayDays): Testimonial request
  if (config.includeTestimonialRequest) {
    const testimonialDate = new Date(today);
    testimonialDate.setDate(testimonialDate.getDate() + config.delayDays);
    steps.push({
      type: "testimonial",
      scheduledFor: testimonialDate.toISOString().split("T")[0],
      completed: false,
      message: "Request testimonial or case study",
    });
  }

  // Day (2+config.delayDays): Referral ask
  if (config.includeReferralAsk) {
    const referralDate = new Date(today);
    referralDate.setDate(referralDate.getDate() + config.delayDays + 1);
    steps.push({
      type: "referral",
      scheduledFor: referralDate.toISOString().split("T")[0],
      completed: false,
      message: "Ask for referrals or future work opportunities",
    });
  }

  return {
    projectTitle: proposal.title,
    clientId: proposal.clientId,
    clientName,
    steps,
  };
}

export function generateWrapUpMessages(
  projectTitle: string,
  clientName: string,
  tone: "professional" | "friendly" | "confident"
) {
  const messages = {
    thank_you: {
      professional: `Thank you for the opportunity to work on ${projectTitle}. It has been a pleasure collaborating with you. We hope the deliverables meet your expectations and look forward to future opportunities.`,
      friendly: `${clientName}, thanks so much for letting me work on ${projectTitle}! It was a blast working with you, and I hope you love the final product. Excited to work together again soon!`,
      confident: `${projectTitle} is complete. Proud of what we delivered together. You made great calls throughout this process.`,
    },
    testimonial_request: {
      professional:
        "If you're satisfied with the work, I would greatly appreciate a testimonial. Your feedback helps me serve future clients better.",
      friendly:
        "If you have a few minutes, I'd love to hear your thoughts in a quick testimonial. It really helps me keep improving!",
      confident:
        "A quick testimonial would be amazing if you're happy with the work. Helps me help other clients like you.",
    },
    referral_request: {
      professional:
        "If you know others who might benefit from similar services, I'd be grateful for referrals. We pride ourselves on delivering excellent results.",
      friendly:
        "Know anyone else who could use my help? I'd love to work with your network! Feel free to pass along my details.",
      confident:
        "If your network needs what we just delivered, send them my way. I make great things happen.",
    },
  };

  return messages;
}
