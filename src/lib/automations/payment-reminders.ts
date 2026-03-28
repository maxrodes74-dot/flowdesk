// ============================================================
// Payment Reminder Automation Logic
// ============================================================

import type { Invoice, Freelancer, Client, PaymentReminderConfig } from "../types";

export interface OverdueInvoice {
  invoice: Invoice;
  client: Client;
  daysOverdue: number;
  escalationStage: "day1" | "day7" | "day14";
  shouldRemind: boolean;
}

export function calculateDaysOverdue(dueDate: string): number {
  const due = new Date(dueDate);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - due.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
}

export function getEscalationStage(
  daysOverdue: number
): "day1" | "day7" | "day14" | null {
  if (daysOverdue >= 14) return "day14";
  if (daysOverdue >= 7) return "day7";
  if (daysOverdue >= 1) return "day1";
  return null;
}

export function checkPaymentReminders(
  invoices: Invoice[],
  clients: Map<string, Client>,
  config: PaymentReminderConfig
): OverdueInvoice[] {
  const overdueInvoices = invoices.filter(
    (inv) => inv.status === "sent" || inv.status === "viewed" || inv.status === "overdue"
  );

  return overdueInvoices
    .map((invoice) => {
      const daysOverdue = calculateDaysOverdue(invoice.dueDate);
      const escalationStage = getEscalationStage(daysOverdue);
      const client = clients.get(invoice.clientId);

      if (!client || !escalationStage) {
        return null;
      }

      const shouldRemind =
        (escalationStage === "day1" && config.escalationSchedule.day1) ||
        (escalationStage === "day7" && config.escalationSchedule.day7) ||
        (escalationStage === "day14" && config.escalationSchedule.day14);

      return {
        invoice,
        client,
        daysOverdue,
        escalationStage,
        shouldRemind,
      };
    })
    .filter((item): item is OverdueInvoice => item !== null);
}

export function generateReminderText(
  escalationStage: "day1" | "day7" | "day14",
  freelancer: Freelancer,
  clientName: string
): string {
  const tone = freelancer.tone;

  const reminders = {
    day1: {
      professional:
        "I wanted to kindly remind you that invoice #[INVOICE_ID] is now due. Please let me know if you have any questions or if you need an invoice copy.",
      friendly: `Hi ${clientName}! Just a friendly heads-up that your invoice is due soon. Let me know if you need anything!`,
      confident:
        "Your invoice is due. Let's keep things moving smoothly - payment by the due date helps us both.",
    },
    day7: {
      professional: `This is a professional follow-up regarding the overdue invoice #[INVOICE_ID]. I would greatly appreciate your prompt attention to settle this balance.`,
      friendly: `${clientName}, I wanted to reach out about the invoice that's now a week overdue. Could you prioritize this when you get a chance?`,
      confident:
        "The invoice is now 7 days overdue. Let's settle this so we can keep our partnership strong.",
    },
    day14: {
      professional: `This is a final notice regarding the significantly overdue invoice #[INVOICE_ID]. Immediate payment is required. Please remit payment without further delay, or we may need to suspend services.`,
      friendly: `${clientName}, I hate to be persistent, but this invoice is now two weeks overdue. We really need to get this resolved ASAP.`,
      confident:
        "This invoice is 14 days past due and requires immediate payment. Please handle this priority.",
    },
  };

  return reminders[escalationStage][tone as keyof typeof reminders["day1"]];
}

export function calculateLateFee(
  amount: number,
  lateFeeConfig?: { type: "percentage" | "flat"; amount: number }
): number | null {
  if (!lateFeeConfig) return null;

  if (lateFeeConfig.type === "percentage") {
    return (amount * lateFeeConfig.amount) / 100;
  } else {
    return lateFeeConfig.amount;
  }
}
