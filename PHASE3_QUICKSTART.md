# Phase 3 Automations - Quick Start Guide

## Setup Instructions

### 1. Create Database Table

Run this SQL migration in Supabase:

```sql
CREATE TABLE automations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  freelancer_id UUID NOT NULL REFERENCES freelancers(id),
  type TEXT NOT NULL CHECK (type IN ('payment_reminders', 'scope_creep_detection', 'project_wrap_up', 're_engagement_ping')),
  enabled BOOLEAN DEFAULT false,
  config JSONB,
  created_at TIMESTAMP DEFAULT now(),
  UNIQUE(freelancer_id, type)
);

CREATE INDEX idx_automations_freelancer_id ON automations(freelancer_id);
CREATE INDEX idx_automations_type ON automations(type);
```

### 2. Set Environment Variables

Add to your `.env.local`:

```bash
# Required for email delivery
RESEND_API_KEY=your_resend_api_key_here

# Required for AI scope creep detection and message generation
ANTHROPIC_API_KEY=your_anthropic_api_key_here

# Required for email links
NEXT_PUBLIC_BASE_URL=https://yoursite.com
```

### 3. Test the Implementation

#### A. Payment Reminders

```bash
curl -X POST http://localhost:3000/api/automations/payment-reminders \
  -H "Content-Type: application/json" \
  -d '{"freelancerId": "YOUR_FREELANCER_ID"}'
```

#### B. Scope Creep Detection

```bash
curl -X POST http://localhost:3000/api/automations/scope-creep \
  -H "Content-Type: application/json" \
  -d '{
    "freelancerId": "YOUR_FREELANCER_ID",
    "clientId": "CLIENT_ID",
    "proposalId": "PROPOSAL_ID",
    "clientMessage": "Can you also add a mobile app?"
  }'
```

#### C. Project Wrap-Up

```bash
curl -X POST http://localhost:3000/api/automations/wrap-up \
  -H "Content-Type: application/json" \
  -d '{
    "freelancerId": "YOUR_FREELANCER_ID",
    "proposalId": "PROPOSAL_ID"
  }'
```

#### D. Re-engagement Ping

```bash
curl -X POST http://localhost:3000/api/automations/re-engagement \
  -H "Content-Type: application/json" \
  -d '{"freelancerId": "YOUR_FREELANCER_ID"}'
```

### 4. Configure Automations in UI

1. Navigate to `http://localhost:3000/dashboard/automations`
2. Toggle each automation on/off
3. Click "Configure" on each to set up options
4. Changes save automatically to database

## Quick Configuration

### Payment Reminders
- Enable reminder emails for Day 1, 7, and/or 14 after invoice becomes overdue
- Optional late fee: percentage or flat amount
- Emails adapt to your tone (professional, friendly, confident)

### Scope Creep Detection
- Sensitivity: strict (flag small additions), moderate (recommended), or relaxed (only major changes)
- Auto-draft change orders with estimated hours and cost
- Alerts sent to your email with AI analysis

### Project Wrap-Up
- Triggers when all project milestones marked complete
- Sends thank you message
- Optional testimonial request (day 1+delay)
- Optional referral ask (day 2+delay)
- Customizable delay between messages (3-7 days)

### Re-engagement Ping
- Find clients with no active projects for 30/60/90 days
- AI generates personalized check-in message
- Send one email per client
- Runs on schedule (recommend monthly)

## Integration Examples

### Add Scope Creep Detection to Message Handler

In your client messaging component:

```typescript
import { createClient } from '@/lib/supabase/client';

async function handleNewClientMessage(message: string) {
  const supabase = createClient();

  // Save message...

  // Check for scope creep
  const response = await fetch('/api/automations/scope-creep', {
    method: 'POST',
    body: JSON.stringify({
      freelancerId: user.freelancer.id,
      clientId: client.id,
      proposalId: proposal.id,
      clientMessage: message
    })
  });

  const result = await response.json();

  if (result.scopeCreepDetected) {
    showNotification({
      type: 'warning',
      title: 'Scope Creep Detected',
      message: result.analysis.explanation,
      action: 'Review',
      onAction: () => showChangeOrderModal(result.changeOrder)
    });
  }
}
```

### Schedule Payment Reminders with External Cron

Using EasyCron, AWS EventBridge, or similar:

```
POST http://yoursite.com/api/automations/payment-reminders
Content-Type: application/json

{"freelancerId": "USER_ID"}
```

Schedule: Daily at 9 AM or Weekly on Monday morning

### Schedule Re-engagement with External Cron

```
POST http://yoursite.com/api/automations/re-engagement
Content-Type: application/json

{"freelancerId": "USER_ID"}
```

Schedule: First day of month at 8 AM

## Key Files

### Core Logic
- `/src/lib/automations/payment-reminders.ts` - Payment reminder logic
- `/src/lib/automations/scope-creep.ts` - Scope creep analysis
- `/src/lib/automations/wrap-up.ts` - Project wrap-up sequences
- `/src/lib/automations/re-engagement.ts` - Re-engagement logic

### Email
- `/src/lib/email.ts` - Resend integration and templates

### API Routes
- `/src/app/api/automations/*/route.ts` - API endpoints

### UI
- `/src/app/dashboard/automations/page.tsx` - Configuration interface

### Types
- `/src/lib/types.ts` - All type definitions

### Docs
- `/AUTOMATIONS.md` - Complete technical documentation

## Customization

### Change Email Templates

Edit `/src/lib/email.ts` email template section to modify:
- Email styling
- Brand colors
- Message text
- Dynamic content

### Add New Automation Type

1. Add type to `AutomationType` in `types.ts`
2. Create config interface (e.g., `MyAutomationConfig`)
3. Create logic file in `/src/lib/automations/`
4. Create API route in `/src/app/api/automations/`
5. Add UI modal to `/src/app/dashboard/automations/page.tsx`

### Modify Sensitivity Levels

Edit keyword lists in `/src/lib/automations/scope-creep.ts`:

```typescript
const SENSITIVITY_KEYWORDS = {
  strict: [...],
  moderate: [...],
  relaxed: [...]
};
```

## Troubleshooting

### Emails Not Sending
- Check Resend API key is valid
- Check email deliverability logs in Resend dashboard
- Verify `NEXT_PUBLIC_BASE_URL` is correct
- Check for rate limiting

### Scope Creep Not Detecting
- Verify Claude API key is valid
- Try "moderate" sensitivity if too strict
- Check API rate limits
- Review client message for actual scope creep

### Re-engagement Not Finding Clients
- Ensure clients have proposals
- Increase inactivity threshold if needed
- Check that proposal dates are recent enough

### Database Errors
- Verify automations table is created
- Check freelancer_id is valid UUID
- Ensure config JSON is valid

## Monitoring

### Check Automation Status

Query the database:

```sql
SELECT type, enabled, config
FROM automations
WHERE freelancer_id = 'USER_ID';
```

### Monitor Email Delivery

Check Resend dashboard for:
- Delivery status
- Bounce rates
- Click rates (if enabled)

### Log Automation Runs

Consider adding to database:

```sql
CREATE TABLE automation_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  automation_id UUID REFERENCES automations(id),
  freelancer_id UUID REFERENCES freelancers(id),
  type TEXT,
  status TEXT, -- success, failed
  result JSONB,
  created_at TIMESTAMP DEFAULT now()
);
```

Then log each automation execution.

## Next Steps

1. Create automations table
2. Set environment variables
3. Navigate to `/dashboard/automations`
4. Configure each automation to your preference
5. Test with sample data
6. Set up external cron jobs for automated runs
7. Monitor email delivery and adjust as needed

## Support

For detailed information, see `/AUTOMATIONS.md`

For questions:
- Check error logs in browser console
- Check Supabase dashboard for query errors
- Check Resend dashboard for email failures
- Check API response messages in network tab
