# ScopePad Phase 3: Automation Features

This document describes the complete Phase 3 automation implementation for ScopePad.

## Overview

ScopePad now includes four powerful automation features designed to help freelancers save time and grow their business:

1. **Payment Reminders** - Escalating reminders for overdue invoices
2. **Scope Creep Detection** - AI-powered alerts when clients request out-of-scope work
3. **Project Wrap-Up** - Automated thank yous, testimonials, and referral requests
4. **Re-engagement Ping** - Keep past clients interested with personalized check-ins

## Architecture

### Core Structure

```
src/
├── lib/
│   ├── automations/
│   │   ├── payment-reminders.ts       # Payment reminder logic
│   │   ├── scope-creep.ts             # Scope creep analysis
│   │   ├── wrap-up.ts                 # Project wrap-up sequences
│   │   └── re-engagement.ts           # Client re-engagement logic
│   ├── email.ts                       # Resend email service
│   └── types.ts                       # Automation type definitions
├── app/
│   ├── api/automations/
│   │   ├── payment-reminders/route.ts
│   │   ├── scope-creep/route.ts
│   │   ├── wrap-up/route.ts
│   │   └── re-engagement/route.ts
│   └── dashboard/
│       └── automations/page.tsx       # Configuration UI
```

### Type System

All automation configurations are stored in the `automations` table with:
- `freelancer_id` - Links to the freelancer
- `type` - One of: `payment_reminders`, `scope_creep_detection`, `project_wrap_up`, `re_engagement_ping`
- `enabled` - Boolean toggle
- `config` - JSON config object (type-specific)

```typescript
interface Automation {
  id: string;
  freelancerId: string;
  type: AutomationType;
  enabled: boolean;
  config: PaymentReminderConfig | ScopeCreepConfig | ProjectWrapUpConfig | ReEngagementConfig;
  createdAt: string;
}
```

---

## 1. Payment Reminder Automation

### Purpose
Automatically send escalating payment reminders for overdue invoices.

### Configuration

```typescript
interface PaymentReminderConfig {
  enabled: boolean;
  escalationSchedule: {
    day1: boolean;    // Send on day 1 of overdue
    day7: boolean;    // Send on day 7 of overdue
    day14: boolean;   // Send on day 14+ of overdue
  };
  lateFee?: {
    type: "percentage" | "flat";
    amount: number;   // Percentage (1-50) or flat amount ($)
  };
}
```

### Features

- **Three-stage escalation:**
  - Day 1: Gentle, friendly reminder
  - Day 7: Firmer follow-up
  - Day 14: Final notice with consequences

- **Tone-aware messages:** Messages adapt to freelancer's tone preference (professional, friendly, confident)

- **Optional late fees:** Specify percentage or flat amount added to overdue invoices

- **Smart status detection:** Only targets invoices in "sent", "viewed", or "overdue" status

### API Endpoint

```
POST /api/automations/payment-reminders
```

**Request Body:**
```json
{
  "freelancerId": "string"
}
```

**Response:**
```json
{
  "success": true,
  "remindersProcessed": 3,
  "details": [
    {
      "invoiceId": "string",
      "clientEmail": "string",
      "escalationStage": "day1" | "day7" | "day14",
      "sent": true
    }
  ]
}
```

### Usage

**Recommended Setup:**
Use a cron job or scheduled task to call this endpoint daily or weekly.

```bash
# Daily at 9 AM
0 9 * * * curl -X POST https://yoursite.com/api/automations/payment-reminders \
  -H "Content-Type: application/json" \
  -d '{"freelancerId": "YOUR_FREELANCER_ID"}'
```

---

## 2. Scope Creep Detection

### Purpose
Analyze client messages in real-time to detect and alert on out-of-scope requests.

### Configuration

```typescript
interface ScopeCreepConfig {
  enabled: boolean;
  sensitivityLevel: "strict" | "moderate" | "relaxed";
  autoDraftChangeOrder: boolean;
}
```

**Sensitivity Levels:**
- **Strict:** Flags even small additions or modifications (e.g., "can you also...")
- **Moderate:** Flags meaningful additions (recommended)
- **Relaxed:** Only flags major new features or entirely different services

### Features

- **AI-powered analysis:** Uses Claude to compare client messages against proposal scope
- **Fallback keyword detection:** Works without API key using heuristics
- **Change order drafting:** Auto-generates change orders with estimated hours and cost
- **Freelancer alerts:** Sends detailed email to freelancer with suggested response

### API Endpoint

```
POST /api/automations/scope-creep
```

**Request Body:**
```json
{
  "freelancerId": "string",
  "clientId": "string",
  "proposalId": "string",
  "clientMessage": "string"
}
```

**Response:**
```json
{
  "success": true,
  "scopeCreepDetected": true,
  "analysis": {
    "isScopeCreep": true,
    "confidence": 0.85,
    "explanation": "Client message requests additional features beyond scope",
    "suggestedResponse": "Thank you for the request..."
  },
  "changeOrder": {
    "description": "Scope Addition: Additional dashboard widget integration",
    "estimatedHours": 6,
    "costPerHour": 100
  },
  "emailSent": true
}
```

### Usage

**Integration Points:**
1. Call when new client messages arrive
2. Add to dashboard notification panel if scope creep detected
3. Show suggested response to freelancer
4. Allow quick approval to create change order

```typescript
// Example integration in message handler
const response = await fetch('/api/automations/scope-creep', {
  method: 'POST',
  body: JSON.stringify({
    freelancerId: user.freelancer.id,
    clientId: message.clientId,
    proposalId: proposal.id,
    clientMessage: message.body
  })
});

if (response.analysis.isScopeCreep) {
  // Show notification banner
  showNotification({
    type: 'warning',
    title: 'Possible Scope Creep Detected',
    message: response.analysis.explanation,
    action: 'Review'
  });
}
```

---

## 3. Project Wrap-Up Automation

### Purpose
Automate the end-of-project workflow: thank you message, testimonial request, and referral ask.

### Configuration

```typescript
interface ProjectWrapUpConfig {
  enabled: boolean;
  delayDays: number;                    // 3-7, time between messages
  includeTestimonialRequest: boolean;
  includeReferralAsk: boolean;
}
```

### Features

- **Multi-step sequence:** Automatically scheduled messages over days
- **Milestone-based trigger:** Fires when all project milestones marked complete
- **Customizable messaging:** Includes thank you, testimonial request, referral ask
- **Tone-aware:** Messages match freelancer's tone preference

### Sequence

1. **Day 0:** Final invoice generated (if needed)
2. **Day 1:** Thank you message sent
3. **Day (1+delayDays):** Testimonial request (if enabled)
4. **Day (2+delayDays):** Referral ask (if enabled)

### API Endpoint

```
POST /api/automations/wrap-up
```

**Request Body:**
```json
{
  "freelancerId": "string",
  "proposalId": "string"
}
```

**Response:**
```json
{
  "success": true,
  "projectComplete": true,
  "wrapUpInitiated": true,
  "sequence": {
    "projectTitle": "Website Redesign",
    "clientId": "string",
    "clientName": "Acme Corp",
    "steps": [
      {
        "type": "invoice",
        "scheduledFor": "2026-03-27",
        "completed": false
      },
      {
        "type": "thank_you",
        "scheduledFor": "2026-03-28",
        "completed": false
      },
      {
        "type": "testimonial",
        "scheduledFor": "2026-03-30",
        "completed": false
      },
      {
        "type": "referral",
        "scheduledFor": "2026-03-31",
        "completed": false
      }
    ]
  }
}
```

### Usage

**Automatic Trigger:**
Call when all milestones for a project are marked as complete:

```typescript
// In milestone update handler
if (allMilestonesComplete(proposal)) {
  await fetch('/api/automations/wrap-up', {
    method: 'POST',
    body: JSON.stringify({
      freelancerId: user.freelancer.id,
      proposalId: proposal.id
    })
  });
}
```

---

## 4. Re-engagement Ping

### Purpose
Automatically reach out to past clients who haven't had active projects.

### Configuration

```typescript
interface ReEngagementConfig {
  enabled: boolean;
  inactivityThresholdDays: number; // 30, 60, or 90
}
```

### Features

- **Smart client detection:** Finds clients with no recent projects
- **AI-generated messages:** Claude crafts personalized re-engagement messages
- **Tone-aware:** Messages match freelancer's personality
- **Industry-aware:** References relevant industry knowledge

### API Endpoint

```
POST /api/automations/re-engagement
```

**Request Body:**
```json
{
  "freelancerId": "string"
}
```

**Response:**
```json
{
  "success": true,
  "inactiveClientsFound": 3,
  "emailsSent": 3,
  "details": [
    {
      "clientId": "string",
      "clientEmail": "jane@acme.com",
      "daysInactive": 125,
      "sent": true,
      "message": "Hey Jane! Hope you're doing great..."
    }
  ]
}
```

### Usage

**Recommended Setup:**
Run monthly or quarterly:

```bash
# First of every month at 8 AM
0 8 1 * * curl -X POST https://yoursite.com/api/automations/re-engagement \
  -H "Content-Type: application/json" \
  -d '{"freelancerId": "YOUR_FREELANCER_ID"}'
```

---

## Email Service

### Overview

The `src/lib/email.ts` service handles all automation emails using Resend.

### Email Templates

All email templates are branded with:
- Freelancer's name and tone
- Brand color for CTAs
- Professional yet personalized styling
- Base URL for dynamic links

### Supported Templates

1. **payment_reminder** - Escalating payment reminders
2. **scope_creep_alert** - Scope creep notifications
3. **wrap_up_thank_you** - Project completion thank you
4. **re_engagement** - Client check-in message
5. **proposal_sent** - Proposal delivery
6. **invoice_sent** - Invoice delivery

### Configuration

Set `RESEND_API_KEY` in environment:

```bash
RESEND_API_KEY=re_xxxxxxxxxxxxx
NEXT_PUBLIC_BASE_URL=https://yourdomain.com
```

### API Functions

```typescript
// Payment reminder
await sendPaymentReminderEmail(
  clientEmail: string,
  clientName: string,
  freelancer: Freelancer,
  invoiceData: {
    id: string;
    amount: number;
    dueDate: string;
    escalationDay: number;
    lateFee?: { type: "percentage" | "flat"; amount: number };
  }
): Promise<boolean>

// Scope creep alert
await sendScopeCreepAlertEmail(
  freelancerEmail: string,
  freelancer: Freelancer,
  data: {
    clientName: string;
    clientId: string;
    clientMessage: string;
    analysis: string;
    suggestedResponse: string;
  }
): Promise<boolean>

// Wrap up
await sendWrapUpEmail(
  clientEmail: string,
  clientName: string,
  freelancer: Freelancer,
  data: {
    projectTitle: string;
    includeTestimonial: boolean;
    includeReferral: boolean;
    clientId: string;
  }
): Promise<boolean>

// Re-engagement
await sendReEngagementEmail(
  clientEmail: string,
  clientName: string,
  freelancer: Freelancer,
  data: {
    portalSlug: string;
  }
): Promise<boolean>
```

---

## Configuration UI

### Location

```
/dashboard/automations
```

### Features

- **Toggle controls:** Enable/disable each automation
- **Configuration modals:** Type-specific settings for each automation
- **Live saving:** Configurations save to database immediately
- **Status indicators:** Visual feedback on save success/error

### Components

1. **AutomationCard** - Main card for each automation type
2. **Toggle** - Enable/disable switch
3. **PaymentReminderModal** - Payment reminder settings
4. **ScopeCreepModal** - Scope creep sensitivity and options
5. **ProjectWrapUpModal** - Delay and message selection
6. **ReEngagementModal** - Inactivity threshold selection

---

## Database Schema

### automations Table

```sql
CREATE TABLE automations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  freelancer_id UUID NOT NULL REFERENCES freelancers(id),
  type TEXT NOT NULL, -- payment_reminders, scope_creep_detection, project_wrap_up, re_engagement_ping
  enabled BOOLEAN DEFAULT false,
  config JSONB,
  created_at TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_automations_freelancer ON automations(freelancer_id);
CREATE INDEX idx_automations_type ON automations(type);
```

---

## Implementation Checklist

- [x] Type definitions for all automations
- [x] Email service with Resend integration
- [x] Payment reminder automation logic and API
- [x] Scope creep detection with AI analysis
- [x] Project wrap-up automation
- [x] Re-engagement ping automation
- [x] Configuration UI with modals
- [x] Data conversion helpers
- [x] API routes for all automations

## Future Enhancements

1. **Activity logging:** Track all automation events
2. **A/B testing:** Test different email templates
3. **Advanced scheduling:** Cron-like custom schedules
4. **Integration webhooks:** Connect to external cron services
5. **Analytics dashboard:** Track automation metrics
6. **Template customization:** Allow freelancers to customize email templates
7. **Multi-language support:** Localize automation messages
8. **SMS notifications:** Complement email with SMS

---

## Troubleshooting

### Emails not sending
- Check `RESEND_API_KEY` is set correctly
- Verify `NEXT_PUBLIC_BASE_URL` is configured
- Check Resend dashboard for delivery failures

### Scope creep not detecting changes
- Ensure `ANTHROPIC_API_KEY` is configured
- Check API rate limits
- Review sensitivity level (try "moderate" if too strict)

### Re-engagement not finding clients
- Ensure clients have at least one past proposal
- Check inactivity threshold setting
- Verify freelancer has clients in database

### API endpoint returns 404
- Verify route file exists at correct path
- Check freelancer ID exists
- Ensure automation config is saved first

---

## Security Considerations

1. **API Key Protection:** Store all API keys in environment variables
2. **Email Validation:** All email addresses are validated
3. **Rate Limiting:** Consider implementing rate limits on API endpoints
4. **Data Privacy:** Ensure GDPR/CCPA compliance for email opt-outs
5. **Injection Prevention:** All user inputs are sanitized

---

## Performance Notes

- Payment reminders: O(n) where n = number of overdue invoices
- Scope creep: Single API call per message
- Wrap-up: Runs once per completed project
- Re-engagement: O(m) where m = number of past clients

Typical execution times:
- Payment reminders: < 500ms
- Scope creep: 1-2s (includes AI API call)
- Wrap-up: < 500ms
- Re-engagement: 2-5s (includes AI message generation)
