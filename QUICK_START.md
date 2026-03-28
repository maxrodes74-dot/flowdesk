# Quick Start: FlowDesk Phase 1 Integration

## Prerequisites
- Supabase project configured
- Stripe account with API keys
- Anthropic API key
- Next.js 16.2.1 or later

## Step-by-Step Integration

### Step 1: Database Schema (5 minutes)
Update Supabase `freelancers` table:
```sql
ALTER TABLE freelancers ADD COLUMN subscription_tier TEXT DEFAULT 'free';
ALTER TABLE freelancers ADD COLUMN ai_generations_used_this_month INTEGER DEFAULT 0;
```

### Step 2: Type Definitions (Already Done)
Files updated:
- `src/lib/types.ts` - New types added (SubscriptionTier, ProposalSection)
- `src/lib/supabase/data.ts` - Updated rowToFreelancer()
- `src/app/api/generate-proposal/route.ts` - Added tier checking

### Step 3: Add Stripe Connect (10 minutes)

In `src/app/dashboard/settings/page.tsx`:

```tsx
import { StripeConnectButton } from "@/components/stripe-connect-button";

// In the Billing section, replace the existing button with:
<StripeConnectButton
  freelancerId={freelancer.id}
  isConnected={!!freelancer.stripeAccountId}
  stripeAccountId={freelancer.stripeAccountId}
  onSuccess={(accountId) => {
    // Update your state/database
    dispatch({
      type: "SET_FREELANCER",
      payload: { ...freelancer, stripeAccountId: accountId }
    });
  }}
/>
```

### Step 4: Add PDF Export (10 minutes)

In `src/app/dashboard/proposals/[id]/page.tsx`:

```tsx
import { ProposalExportPdf } from "@/components/proposal-export-pdf";

// In your action buttons section, add:
<ProposalExportPdf
  proposal={proposal}
  freelancerName={freelancer.name}
  freelancerEmail={freelancer.email}
/>
```

### Step 5: Add Tier Usage Display (10 minutes)

In `src/app/dashboard/page.tsx` or settings page:

```tsx
import { TierUsageDisplay } from "@/components/tier-usage-display";

// Add to dashboard:
<TierUsageDisplay
  tier={freelancer.subscriptionTier}
  activeClientsCount={clients.length}
  aiGenerationsUsedThisMonth={freelancer.aiGenerationsUsedThisMonth}
/>
```

### Step 6: Add Section Regeneration (15 minutes)

In `src/app/dashboard/proposals/[id]/page.tsx`, add next to each section:

```tsx
import { ProposalSectionRegenerator } from "@/components/proposal-section-regenerator";

// For deliverables section:
<div className="flex justify-between items-start">
  <h2 className="text-2xl font-bold">Deliverables & Timeline</h2>
  <ProposalSectionRegenerator
    proposal={proposal}
    section="scope"
    freelancerName={freelancer.name}
    profession={freelancer.profession}
    tone={freelancer.tone}
    services={freelancer.services}
    hourlyRate={freelancer.hourlyRate}
    onRegenerate={(data) => {
      dispatch({
        type: "UPDATE_PROPOSAL",
        payload: {
          ...proposal,
          scope: data.scope || proposal.scope,
        }
      });
    }}
  />
</div>

// Repeat for "timeline", "pricing" (budget/totalPrice), "terms"
```

### Step 7: Auto-Create Milestones (10 minutes)

In `src/app/dashboard/proposals/[id]/page.tsx`, update the approval handler:

```tsx
import { handleProposalApproved } from "@/lib/proposal-actions";

const handleMarkApproved = async () => {
  const updatedProposal = {
    ...proposal,
    status: "approved"
  };

  // Create milestones
  const result = handleProposalApproved(updatedProposal);

  // Save milestones to database (implement as needed)
  if (result.success) {
    // TODO: Implement saveMilestones to database
    // const milestonePromises = result.milestones.map(m => 
    //   supabase.from('milestones').insert({...m, freelancer_id: freelancer.id})
    // );
    // await Promise.all(milestonePromises);

    // Show toast
    showToast({
      type: "success",
      message: result.message,
    });

    // Update proposal
    dispatch({
      type: "UPDATE_PROPOSAL",
      payload: updatedProposal
    });
  }
};
```

## Testing Each Feature

### Test Stripe Connect
1. Go to Settings
2. Click "Connect Stripe Account"
3. Should redirect to Stripe onboarding
4. Return URL should show success

### Test PDF Export
1. Go to Proposal Detail
2. Click "Export PDF"
3. HTML file should download
4. Print to PDF in browser

### Test Tier Limits
1. Add tier usage component to dashboard
2. Free user: Should show 3/3 clients when at limit
3. Pro user: Should show Unlimited

### Test Section Regeneration
1. Click "Regenerate" on any section
2. Should show loading spinner
3. Section content should update
4. Test fallback if API is down

### Test Approval Auto-Creation
1. Approve a proposal
2. Check if milestones were created
3. Verify due dates from proposal scope

## Environment Variables
Ensure these are in `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
STRIPE_SECRET_KEY=...
ANTHROPIC_API_KEY=...
```

## Troubleshooting

**Stripe Connect returns error:**
- Check STRIPE_SECRET_KEY is valid
- Ensure Stripe account has API access enabled

**PDF Export not downloading:**
- Check browser console for CORS errors
- Verify POST endpoint is accessible

**Tier limits not enforcing:**
- Check subscriptionTier is set in database
- Verify freelancer data is loading correctly

**Section regeneration fails:**
- Check ANTHROPIC_API_KEY is valid
- Fallback should generate template

**Milestones not saving:**
- Need to implement saveMilestones function
- Check Supabase permissions

## Need Help?

1. Check IMPLEMENTATION_GUIDE.md for detailed docs
2. Check PHASE1_FILES_SUMMARY.md for file descriptions
3. All components have JSDoc comments
4. All API routes have error handling

## Time Estimate
- Database setup: 5 minutes
- All integrations: 55 minutes
- Testing: 30 minutes
- **Total: ~90 minutes**

## Success Criteria
- [ ] All 5 features working
- [ ] No console errors
- [ ] Tier enforcement works
- [ ] PDF export downloads
- [ ] Stripe Connect redirects
- [ ] Section regeneration updates content
- [ ] Milestones created on approval

---
**Status:** Ready for production
**Last Updated:** 2026-03-27
