# ScopePad Phase 1 PRD Implementation Guide

This document provides implementation details for the Phase 1 PRD features. All code has been created and is ready to be integrated into your application.

## Summary of Implementations

### 1. Stripe Connect Onboarding Flow
**Location:** `src/app/api/stripe/connect/route.ts`
**Component:** `src/components/stripe-connect-button.tsx`

Creates a Stripe Connect Express account and handles OAuth onboarding flow.

**API Endpoints:**
- `POST /api/stripe/connect` - Initiates Stripe Connect account creation and returns onboarding URL
- `GET /api/stripe/connect?account_id={id}` - Checks account onboarding status

**Integration Example (in Settings page):**
```tsx
import { StripeConnectButton } from "@/components/stripe-connect-button";

// In your component
<StripeConnectButton
  freelancerId={freelancer.id}
  isConnected={!!freelancer.stripeAccountId}
  stripeAccountId={freelancer.stripeAccountId}
  onSuccess={(accountId) => {
    // Update freelancer record with accountId
    dispatch({
      type: "SET_FREELANCER",
      payload: { ...freelancer, stripeAccountId: accountId }
    });
  }}
/>
```

**Database Update Needed:**
Add these fields to the `freelancers` table in Supabase:
- `subscription_tier` (text, default: 'free')
- `ai_generations_used_this_month` (integer, default: 0)

---

### 2. PDF Export for Proposals
**Location:** `src/app/api/proposals/export-pdf/route.ts`
**Component:** `src/components/proposal-export-pdf.tsx`

Generates clean, printable HTML for proposals that can be saved as PDF via browser print dialog.

**API Endpoint:**
- `POST /api/proposals/export-pdf` - Generates HTML from proposal data

**Features:**
- Professional styling optimized for printing
- Includes all proposal sections (deliverables, timeline, pricing, terms)
- Responsive design
- Proper formatting for PDF conversion

**Integration Example (in Proposal Detail page):**
```tsx
import { ProposalExportPdf } from "@/components/proposal-export-pdf";

// In your component
<ProposalExportPdf
  proposal={proposal}
  freelancerName={freelancer.name}
  freelancerEmail={freelancer.email}
/>
```

---

### 3. Free Tier Enforcement
**Location:** `src/lib/tier-limits.ts`
**Component:** `src/components/tier-usage-display.tsx`

Defines subscription tier limits and provides utilities to enforce them.

**Tier Limits:**
- **Free:** 3 active clients, 5 AI generations/month, no automations
- **Pro:** Unlimited clients, unlimited AI generations, no automations
- **Pro+:** Unlimited clients, unlimited AI generations, has automations

**Available Functions:**
```typescript
// Check if user can create a client
canCreateClient(tier: SubscriptionTier, currentCount: number): boolean

// Check if user can generate proposals
canGenerateProposal(tier: SubscriptionTier, usageThisMonth: number): boolean

// Check if user has automation access
hasAutomations(tier: SubscriptionTier): boolean

// Get formatted limit messages for UI
getClientLimitMessage(tier: SubscriptionTier, current: number): string
getAiGenerationLimitMessage(tier: SubscriptionTier, current: number): string
```

**Integration in Proposal Generation:**
The `/api/generate-proposal` route now includes tier checks. Pass subscription info in request:
```typescript
const response = await fetch("/api/generate-proposal", {
  method: "POST",
  body: JSON.stringify({
    // existing fields...
    subscriptionTier: freelancer.subscriptionTier,
    aiGenerationsUsedThisMonth: freelancer.aiGenerationsUsedThisMonth,
  }),
});
```

**Integration in Dashboard:**
```tsx
import { TierUsageDisplay } from "@/components/tier-usage-display";

// In your dashboard component
<TierUsageDisplay
  tier={freelancer.subscriptionTier}
  activeClientsCount={clients.length}
  aiGenerationsUsedThisMonth={freelancer.aiGenerationsUsedThisMonth}
/>
```

---

### 4. Section-by-Section Proposal Regeneration
**Location:** `src/app/api/proposals/regenerate-section/route.ts`
**Component:** `src/components/proposal-section-regenerator.tsx`

Allows regenerating individual proposal sections while maintaining context.

**Supported Sections:**
- `scope` - Deliverables and timeline items
- `timeline` - Project duration
- `pricing` - Budget and total price
- `terms` - Payment terms and conditions

**API Endpoint:**
- `POST /api/proposals/regenerate-section` - Regenerates a specific proposal section

**Integration Example (in Proposal Detail page):**
```tsx
import { ProposalSectionRegenerator } from "@/components/proposal-section-regenerator";

// For each section you want to allow regeneration on
<ProposalSectionRegenerator
  proposal={proposal}
  section="scope"
  freelancerName={freelancer.name}
  profession={freelancer.profession}
  tone={freelancer.tone}
  services={freelancer.services}
  hourlyRate={freelancer.hourlyRate}
  onRegenerate={(data) => {
    // Update proposal with new section data
    // data will contain: { scope: [...] } or { timeline: "..." }, etc.
    dispatch({
      type: "UPDATE_PROPOSAL",
      payload: {
        ...proposal,
        ...data,
        // Handle specific field mappings
      }
    });
  }}
/>
```

---

### 5. Proposal Approval → Auto Project Creation
**Location:** `src/lib/proposal-actions.ts`

Automatically creates milestones when a proposal is approved.

**Available Functions:**
```typescript
// Creates milestone objects from proposal deliverables
createMilestonesFromProposal(proposal: Proposal): Array<Milestone>

// Main handler for approval workflow
handleProposalApproved(proposal: Proposal): {
  success: boolean;
  milestones: Array<Milestone>;
  message: string;
  notificationType: "success";
}

// Validates proposal sections for regeneration
isValidProposalSection(section: unknown): boolean

// Gets context for section regeneration
getSectionRegenerationContext(proposal: Proposal, section: ProposalSection)
```

**Integration Example (in Proposal Detail page):**
```tsx
import { handleProposalApproved } from "@/lib/proposal-actions";

const handleMarkApproved = async () => {
  // Update proposal status
  const updatedProposal = {
    ...proposal,
    status: "approved"
  };
  
  // Create milestones
  const result = handleProposalApproved(updatedProposal);
  
  if (result.success) {
    // Save milestones to database (implement as needed)
    const milestonePromises = result.milestones.map(m =>
      saveMilestone(freelancer.id, m)
    );
    await Promise.all(milestonePromises);
    
    // Show success notification
    showToast({
      type: "success",
      message: result.message,
    });
    
    // Update UI
    dispatch({
      type: "UPDATE_PROPOSAL",
      payload: updatedProposal
    });
  }
};
```

---

## Updated Type Definitions

The `Freelancer` type now includes:

```typescript
export interface Freelancer {
  // ... existing fields ...
  stripeAccountId: string | null;
  subscriptionTier: SubscriptionTier;           // NEW
  aiGenerationsUsedThisMonth: number;           // NEW
  createdAt: string;
}

export type SubscriptionTier = "free" | "pro" | "pro+"; // NEW

export type ProposalSection = "scope" | "timeline" | "pricing" | "terms"; // NEW
```

---

## Database Schema Updates

You'll need to add these fields to Supabase:

### freelancers table:
```sql
ALTER TABLE freelancers ADD COLUMN subscription_tier TEXT DEFAULT 'free';
ALTER TABLE freelancers ADD COLUMN ai_generations_used_this_month INTEGER DEFAULT 0;
```

---

## Integration Checklist

- [ ] Update Supabase database schema with new fields
- [ ] Import and add `StripeConnectButton` to settings page
- [ ] Import and add `ProposalExportPdf` to proposal detail page
- [ ] Import and add `TierUsageDisplay` to dashboard/settings
- [ ] Add `ProposalSectionRegenerator` components next to each proposal section
- [ ] Update proposal detail page to call `handleProposalApproved` when status changes
- [ ] Implement milestone saving function in your data layer
- [ ] Update the proposal generation flow to pass tier information
- [ ] Add toast/notification system if not present
- [ ] Test all flows end-to-end

---

## Important Notes

1. **Stripe Connect:** The API creates Express accounts. You'll need to configure your Stripe settings to match your use case (fees, currencies, etc.)

2. **PDF Export:** Uses browser's print capability. Users can print to PDF directly from the exported HTML, or use additional libraries like jsPDF if needed.

3. **Tier Tracking:** Remember to increment `aiGenerationsUsedThisMonth` after successful proposal generation, and reset it monthly.

4. **Milestones:** The auto-creation feature creates milestone objects but doesn't handle saving to the database—you'll need to implement that in your data layer.

5. **Error Handling:** All API routes include comprehensive error handling. Always check response status codes when calling these endpoints.

---

## Environment Variables

Ensure these are set in your `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key
STRIPE_SECRET_KEY=your_stripe_secret_key
ANTHROPIC_API_KEY=your_anthropic_key
```

---

## File Structure

```
src/
├── app/api/
│   ├── stripe/
│   │   └── connect/route.ts          [NEW]
│   └── proposals/
│       ├── export-pdf/route.ts       [NEW]
│       └── regenerate-section/route.ts [NEW]
├── components/
│   ├── stripe-connect-button.tsx     [NEW]
│   ├── proposal-export-pdf.tsx       [NEW]
│   ├── proposal-section-regenerator.tsx [NEW]
│   └── tier-usage-display.tsx        [NEW]
├── lib/
│   ├── tier-limits.ts                [NEW]
│   ├── proposal-actions.ts           [NEW]
│   ├── types.ts                      [UPDATED]
│   └── supabase/data.ts              [UPDATED]
```

All implementations follow existing ScopePad patterns and conventions.
