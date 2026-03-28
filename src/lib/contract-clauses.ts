// Pre-built contract clause library
import { ContractClause } from "./types";

export const PAYMENT_TERMS_CLAUSES: ContractClause[] = [
  {
    id: "payment_net30",
    name: "Payment Terms - Net 30",
    content: `Payment Terms:
    • Invoice will be issued upon completion of deliverables
    • Full payment of invoice is due within 30 days of receipt
    • Late payments will accrue interest at 1.5% per month
    • All payments should be made to the account specified in the invoice`,
  },
  {
    id: "payment_net15",
    name: "Payment Terms - Net 15",
    content: `Payment Terms:
    • Invoice will be issued upon completion of deliverables
    • Full payment of invoice is due within 15 days of receipt
    • Late payments will accrue interest at 1.5% per month
    • All payments should be made to the account specified in the invoice`,
  },
  {
    id: "payment_50_50",
    name: "Payment Terms - 50% Upfront, 50% on Completion",
    content: `Payment Terms:
    • 50% payment required upon signing this agreement
    • Remaining 50% due upon completion and delivery of final deliverables
    • Services will not commence until initial payment is received
    • Late payments may result in suspension of services`,
  },
];

export const REVISION_CLAUSES: ContractClause[] = [
  {
    id: "revisions_unlimited",
    name: "Revisions - Unlimited",
    content: `Revisions and Changes:
    • Client is entitled to unlimited revisions during the project timeline
    • All revision requests should be submitted in writing
    • Revisions will be completed within 3-5 business days of request
    • Major scope changes may require contract amendment and additional fees`,
  },
  {
    id: "revisions_limited",
    name: "Revisions - Limited (3 Rounds)",
    content: `Revisions and Changes:
    • Client is entitled to 3 rounds of revisions during the project timeline
    • Each revision round includes up to 2 rounds of iterations
    • Additional revisions beyond this limit will be charged at $75/hour
    • Revisions should be submitted in writing within 2 weeks of delivery`,
  },
  {
    id: "revisions_none",
    name: "Revisions - Specification Based",
    content: `Revisions and Changes:
    • Work will be delivered according to the specifications provided by the client
    • Revision requests that are within the original scope will be completed at no additional cost
    • Changes to the original scope or major revisions will require a contract amendment and additional fees`,
  },
];

export const IP_RIGHTS_CLAUSES: ContractClause[] = [
  {
    id: "ip_full_transfer",
    name: "Intellectual Property - Full Transfer to Client",
    content: `Intellectual Property Rights:
    • All work created under this agreement, including but not limited to designs, code, content, and concepts, becomes the exclusive property of the Client
    • Client receives full ownership and exclusive rights to all deliverables
    • Freelancer retains the right to use the work as a portfolio example with Client's permission
    • Client may use the work for any purpose, including commercial purposes`,
  },
  {
    id: "ip_licensed",
    name: "Intellectual Property - Licensed to Client",
    content: `Intellectual Property Rights:
    • Freelancer retains copyright ownership of all work created
    • Client receives a perpetual, non-exclusive license to use the deliverables
    • Freelancer grants permission to use work for Client's business purposes
    • Client may not resell, redistribute, or claim ownership of the work`,
  },
  {
    id: "ip_shared",
    name: "Intellectual Property - Shared Rights",
    content: `Intellectual Property Rights:
    • Freelancer and Client share ownership of the intellectual property created
    • Each party may use the deliverables for their respective business purposes
    • Neither party may claim exclusive ownership or prevent the other from using the work
    • Pre-existing materials and third-party assets retain their original licensing`,
  },
];

export const CANCELLATION_CLAUSES: ContractClause[] = [
  {
    id: "cancellation_strict",
    name: "Cancellation - Strict Policy",
    content: `Cancellation and Termination:
    • This agreement cannot be cancelled or terminated except by mutual written consent
    • Client is obligated to pay the full project fee regardless of project completion status
    • If Client cancels after work has begun, Client remains responsible for all work completed plus 50% of remaining fees`,
  },
  {
    id: "cancellation_flexible",
    name: "Cancellation - Flexible Policy",
    content: `Cancellation and Termination:
    • Either party may terminate this agreement with 5 business days written notice
    • Client will pay for all work completed to date plus reasonable cancellation fees
    • Cancellation fees are calculated as 25% of the remaining project value
    • Intellectual property of unfinished work reverts to Freelancer upon cancellation`,
  },
  {
    id: "cancellation_moderate",
    name: "Cancellation - Moderate Policy",
    content: `Cancellation and Termination:
    • Client may cancel this project within 14 days of contract signing with full refund
    • After 14 days, cancellation requires written notice and incurs 50% termination fee
    • Freelancer may terminate if Client breaches any major terms of this agreement
    • Upon termination, Client pays for all completed work at the agreed rate`,
  },
];

export const CONFIDENTIALITY_CLAUSES: ContractClause[] = [
  {
    id: "confidentiality_strict",
    name: "Confidentiality - Strict Mutual NDA",
    content: `Confidentiality and Non-Disclosure:
    • Both parties agree to maintain strict confidentiality regarding all project information
    • Confidential information includes but is not limited to: business strategies, financial information, client lists, and technical details
    • Confidential information may not be disclosed to third parties without written consent
    • This obligation survives for 2 years after project completion
    • Exceptions include information that becomes publicly available or is independently developed`,
  },
  {
    id: "confidentiality_one_way",
    name: "Confidentiality - Freelancer Bound Only",
    content: `Confidentiality and Non-Disclosure:
    • Freelancer agrees to maintain confidentiality of all Client business information
    • Freelancer may not disclose Client information to third parties without written consent
    • Freelancer may reference the project in portfolio with Client's prior approval
    • This obligation survives for 2 years after project completion`,
  },
  {
    id: "confidentiality_none",
    name: "Confidentiality - Limited",
    content: `Confidentiality:
    • Freelancer may publicly reference this project and Client name in professional portfolio and marketing
    • All other confidential information shall be handled with professional discretion
    • Standard confidentiality practices apply to sensitive business information`,
  },
];

export const ALL_CLAUSES = [
  ...PAYMENT_TERMS_CLAUSES,
  ...REVISION_CLAUSES,
  ...IP_RIGHTS_CLAUSES,
  ...CANCELLATION_CLAUSES,
  ...CONFIDENTIALITY_CLAUSES,
];

export const CLAUSE_CATEGORIES = {
  "Payment Terms": PAYMENT_TERMS_CLAUSES,
  Revisions: REVISION_CLAUSES,
  "IP Rights": IP_RIGHTS_CLAUSES,
  Cancellation: CANCELLATION_CLAUSES,
  Confidentiality: CONFIDENTIALITY_CLAUSES,
};
