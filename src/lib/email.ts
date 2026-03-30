// ============================================================
// Email Service using Resend
// ============================================================

import type { Freelancer } from "./types";

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

interface EmailParams {
  to: string;
  subject: string;
  html: string;
}

async function sendEmail(params: EmailParams): Promise<boolean> {
  if (!RESEND_API_KEY) {
    console.warn("RESEND_API_KEY not configured, skipping email send");
    return false;
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "FlowDesk <onboarding@resend.dev>",
        to: params.to,
        subject: params.subject,
        html: params.html,
      }),
    });

    return response.ok;
  } catch (error) {
    console.error("Failed to send email:", error);
    return false;
  }
}

interface EmailTemplate {
  subject: string;
  getHtml(data: Record<string, unknown>): string;
}

function getEmailTemplate(name: string, freelancer: Freelancer): EmailTemplate {
  const brandColor = freelancer.brandColor || "#3B82F6";
  const freelancerName = freelancer.name;

  const baseStyle = `
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
    color: #333;
    line-height: 1.6;
  `;

  const containerStyle = `
    max-width: 600px;
    margin: 0 auto;
    padding: 20px;
    background: #f9fafb;
  `;

  const cardStyle = `
    background: white;
    border-radius: 8px;
    padding: 30px;
    margin: 20px 0;
    border: 1px solid #e5e7eb;
  `;

  const buttonStyle = `
    display: inline-block;
    padding: 12px 24px;
    background: ${brandColor};
    color: white;
    text-decoration: none;
    border-radius: 6px;
    font-weight: 600;
    margin: 20px 0;
  `;

  const templates: Record<string, EmailTemplate> = {
    payment_reminder: {
      subject: "Payment Reminder: Invoice Due",
      getHtml: (data) => `
        <div style="${containerStyle}">
          <div style="${cardStyle}">
            <h1 style="color: ${brandColor}; margin-top: 0;">Payment Reminder</h1>
            <p>Hi ${data.clientName},</p>
            <p>${data.reminderText}</p>
            <p><strong>Invoice Amount:</strong> $${data.amount}</p>
            <p><strong>Due Date:</strong> ${data.dueDate}</p>
            ${data.lateFeeNote ? `<p style="color: #dc2626;"><strong>Note:</strong> ${data.lateFeeNote}</p>` : ""}
            <a href="${BASE_URL}/pay/${data.invoiceId}" style="${buttonStyle}">Pay Invoice</a>
            <p style="color: #666; font-size: 14px;">Best regards,<br>${freelancerName}</p>
          </div>
        </div>
      `,
    },
    scope_creep_alert: {
      subject: "Scope Creep Alert: Review New Request",
      getHtml: (data) => `
        <div style="${containerStyle}">
          <div style="${cardStyle}">
            <h1 style="color: ${brandColor}; margin-top: 0;">New Request Review</h1>
            <p>Hi ${freelancerName},</p>
            <p>A new client message may contain requests outside your original scope.</p>
            <p><strong>Message:</strong><br><em>${data.clientMessage}</em></p>
            <p><strong>Analysis:</strong><br>${data.analysis}</p>
            <p><strong>Suggested Response:</strong><br><em>${data.suggestedResponse}</em></p>
            <a href="${BASE_URL}/dashboard/clients/${data.clientId}" style="${buttonStyle}">View Client Messages</a>
            <p style="color: #666; font-size: 14px;">Stay on top of scope!</p>
          </div>
        </div>
      `,
    },
    wrap_up_thank_you: {
      subject: "Thank You for the Opportunity",
      getHtml: (data) => `
        <div style="${containerStyle}">
          <div style="${cardStyle}">
            <h1 style="color: ${brandColor}; margin-top: 0;">Thank You!</h1>
            <p>Hi ${data.clientName},</p>
            <p>${data.thankYouMessage}</p>
            ${data.projectTitle ? `<p><strong>Project:</strong> ${data.projectTitle}</p>` : ""}
            ${data.includeTestimonial ? `
              <p><strong>Would you mind sharing feedback?</strong></p>
              <p>If you're happy with the work, a testimonial would mean the world to us.</p>
              <a href="${BASE_URL}/testimonial/${data.clientId}" style="${buttonStyle}">Share Feedback</a>
            ` : ""}
            ${data.includeReferral ? `
              <p><strong>Know someone who needs help?</strong></p>
              <p>I'd love to work with your network. Feel free to send referrals my way!</p>
            ` : ""}
            <p style="color: #666; font-size: 14px;">Best regards,<br>${freelancerName}</p>
          </div>
        </div>
      `,
    },
    re_engagement: {
      subject: `Let's Catch Up - ${freelancerName}`,
      getHtml: (data) => `
        <div style="${containerStyle}">
          <div style="${cardStyle}">
            <h1 style="color: ${brandColor}; margin-top: 0;">Let's Chat</h1>
            <p>Hi ${data.clientName},</p>
            <p>${data.engagementMessage}</p>
            <a href="${BASE_URL}/portal/${data.portalSlug}" style="${buttonStyle}">Get in Touch</a>
            <p style="color: #666; font-size: 14px;">Looking forward to working together again!<br>${freelancerName}</p>
          </div>
        </div>
      `,
    },
    proposal_sent: {
      subject: "Your Project Proposal",
      getHtml: (data) => `
        <div style="${containerStyle}">
          <div style="${cardStyle}">
            <h1 style="color: ${brandColor}; margin-top: 0;">${data.proposalTitle}</h1>
            <p>Hi ${data.clientName},</p>
            <p>I've prepared a proposal for your project. Here's what we'll deliver:</p>
            ${data.scope ? `
              <ul>
                ${(data.scope as any)
                  .map(
                    (item: Record<string, unknown>) =>
                      `<li><strong>${item.title}</strong><br>${item.description}</li>`
                  )
                  .join("")}
              </ul>
            ` : ""}
            <p><strong>Timeline:</strong> ${data.timeline}</p>
            <p><strong>Investment:</strong> $${data.totalPrice}</p>
            <a href="${BASE_URL}/proposals/${data.proposalId}" style="${buttonStyle}">View Full Proposal</a>
            <p style="color: #666; font-size: 14px;">Questions? Let me know!<br>${freelancerName}</p>
          </div>
        </div>
      `,
    },
    invoice_sent: {
      subject: "Invoice: ${data.invoiceNumber}",
      getHtml: (data) => `
        <div style="${containerStyle}">
          <div style="${cardStyle}">
            <h1 style="color: ${brandColor}; margin-top: 0;">Invoice ${data.invoiceNumber}</h1>
            <p>Hi ${data.clientName},</p>
            <p>Invoice for work completed. Amount due: <strong>$${data.amount}</strong></p>
            <p><strong>Due Date:</strong> ${data.dueDate}</p>
            <a href="${BASE_URL}/invoices/${data.invoiceId}" style="${buttonStyle}">View Invoice</a>
            <p style="color: #666; font-size: 14px;">Thank you for your business!<br>${freelancerName}</p>
          </div>
        </div>
      `,
    },
  };

  return (
    templates[name] || {
      subject: "Message from FlowDesk",
      getHtml: () => "<p>No template found</p>",
    }
  );
}

export async function sendPaymentReminderEmail(
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
): Promise<boolean> {
  const template = getEmailTemplate("payment_reminder", freelancer);

  let reminderText = "";
  let lateFeeNote = "";

  if (invoiceData.escalationDay === 1) {
    reminderText =
      "I wanted to kindly remind you that an invoice is coming due soon. Please let me know if you have any questions.";
  } else if (invoiceData.escalationDay === 7) {
    reminderText =
      "This is a friendly follow-up about the invoice that's now past due. I'd appreciate your prompt attention to this.";
  } else {
    reminderText =
      "Unfortunately, this invoice is significantly overdue. Immediate payment is required to keep our relationship on track.";
  }

  if (invoiceData.lateFee) {
    const lateFeeAmount =
      invoiceData.lateFee.type === "percentage"
        ? ((invoiceData.amount * invoiceData.lateFee.amount) / 100).toFixed(2)
        : invoiceData.lateFee.amount.toFixed(2);
    lateFeeNote = `A late fee of $${lateFeeAmount} will be applied if payment is not received by the due date.`;
  }

  const html = template.getHtml({
    clientName,
    reminderText,
    amount: invoiceData.amount,
    dueDate: invoiceData.dueDate,
    lateFeeNote,
    invoiceId: invoiceData.id,
  });

  return sendEmail({
    to: clientEmail,
    subject: template.subject,
    html,
  });
}

export async function sendScopeCreepAlertEmail(
  freelancerEmail: string,
  freelancer: Freelancer,
  data: {
    clientName: string;
    clientId: string;
    clientMessage: string;
    analysis: string;
    suggestedResponse: string;
  }
): Promise<boolean> {
  const template = getEmailTemplate("scope_creep_alert", freelancer);
  const html = template.getHtml(data);

  return sendEmail({
    to: freelancerEmail,
    subject: template.subject,
    html,
  });
}

export async function sendWrapUpEmail(
  clientEmail: string,
  clientName: string,
  freelancer: Freelancer,
  data: {
    projectTitle: string;
    includeTestimonial: boolean;
    includeReferral: boolean;
    clientId: string;
  }
): Promise<boolean> {
  const template = getEmailTemplate("wrap_up_thank_you", freelancer);

  const thankYouMessage =
    freelancer.tone === "professional"
      ? "Thank you for the opportunity to work on your project. It was a pleasure collaborating with you."
      : freelancer.tone === "friendly"
        ? "Thanks so much for working with me! It was great getting to know you and bringing your vision to life."
        : "Thank you for the opportunity. Your project was fantastic to work on, and I'm proud of what we delivered.";

  const html = template.getHtml({
    clientName,
    thankYouMessage,
    projectTitle: data.projectTitle,
    includeTestimonial: data.includeTestimonial,
    includeReferral: data.includeReferral,
    clientId: data.clientId,
  });

  return sendEmail({
    to: clientEmail,
    subject: template.subject,
    html,
  });
}

export async function sendReEngagementEmail(
  clientEmail: string,
  clientName: string,
  freelancer: Freelancer,
  data: {
    portalSlug: string;
  }
): Promise<boolean> {
  const template = getEmailTemplate("re_engagement", freelancer);

  const engagementMessage =
    freelancer.tone === "professional"
      ? `I hope this message finds you well. I wanted to reach out and see how things have been going. I'd be delighted to help with any new projects or opportunities you might have coming up.`
      : freelancer.tone === "friendly"
        ? `Hope you're doing great! I realized it's been a while since we last worked together. I'd love to catch up and see what you're working on these days.`
        : `It's been too long! I've been keeping an eye on the industry, and I'm confident I can help you with your next big challenge. Let's reconnect.`;

  const html = template.getHtml({
    clientName,
    engagementMessage,
    portalSlug: data.portalSlug,
  });

  return sendEmail({
    to: clientEmail,
    subject: template.subject,
    html,
  });
}

export async function sendProposalEmail(
  clientEmail: string,
  clientName: string,
  freelancer: Freelancer,
  proposalData: {
    id: string;
    title: string;
    scope: Array<{ title: string; description: string }>;
    timeline: string;
    totalPrice: number;
  }
): Promise<boolean> {
  const template = getEmailTemplate("proposal_sent", freelancer);
  const html = template.getHtml({
    proposalTitle: proposalData.title,
    clientName,
    scope: proposalData.scope,
    timeline: proposalData.timeline,
    totalPrice: proposalData.totalPrice,
    proposalId: proposalData.id,
  });

  return sendEmail({
    to: clientEmail,
    subject: template.subject,
    html,
  });
}

export async function sendInvoiceEmail(
  clientEmail: string,
  clientName: string,
  freelancer: Freelancer,
  invoiceData: {
    id: string;
    number: string;
    amount: number;
    dueDate: string;
  }
): Promise<boolean> {
  const template = getEmailTemplate("invoice_sent", freelancer);
  const html = template.getHtml({
    invoiceNumber: invoiceData.number,
    clientName,
    amount: invoiceData.amount,
    dueDate: invoiceData.dueDate,
    invoiceId: invoiceData.id,
  });

  return sendEmail({
    to: clientEmail,
    subject: template.subject,
    html,
  });
}
