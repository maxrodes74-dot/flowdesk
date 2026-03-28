import { NextResponse } from "next/server";

interface ProposalData {
  title: string;
  clientName: string;
  brief: string;
  scope: Array<{
    title: string;
    description: string;
    dueDate: string;
  }>;
  timeline: string;
  budget: string;
  totalPrice: number;
  terms: string;
  freelancerName?: string;
  freelancerEmail?: string;
  createdAt?: string;
}

/**
 * POST /api/proposals/export-pdf
 * Generates HTML for a proposal that can be converted to PDF
 * The client can then use print-to-PDF or a library like jspdf to save it
 */
export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON in request body" },
      { status: 400 }
    );
  }

  const proposal = body as ProposalData;

  // Validate required fields
  if (!proposal.title || !proposal.clientName || !proposal.scope) {
    return NextResponse.json(
      { error: "Missing required proposal fields" },
      { status: 400 }
    );
  }

  try {
    const formatDate = (dateStr: string): string => {
      try {
        return new Date(dateStr).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        });
      } catch {
        return dateStr;
      }
    };

    const formatCurrency = (amount: number): string => {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(amount);
    };

    const scopeHtml = proposal.scope
      .map(
        (item, idx) => `
      <div class="scope-item">
        <div class="scope-number">${idx + 1}</div>
        <div class="scope-content">
          <h3>${escapeHtml(item.title)}</h3>
          <p>${escapeHtml(item.description)}</p>
          <p class="scope-date"><strong>Due:</strong> ${formatDate(item.dueDate)}</p>
        </div>
      </div>
    `
      )
      .join("");

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(proposal.title)}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #1f2937;
      background-color: white;
      padding: 40px;
    }
    
    .container {
      max-width: 900px;
      margin: 0 auto;
    }
    
    .header {
      border-bottom: 3px solid #2563eb;
      margin-bottom: 40px;
      padding-bottom: 30px;
    }
    
    .title {
      font-size: 36px;
      font-weight: 700;
      color: #1f2937;
      margin-bottom: 10px;
    }
    
    .client-info {
      font-size: 18px;
      color: #6b7280;
      margin-bottom: 20px;
    }
    
    .client-info strong {
      color: #1f2937;
    }
    
    .date {
      font-size: 14px;
      color: #9ca3af;
    }
    
    .section {
      margin-bottom: 50px;
    }
    
    .section-title {
      font-size: 24px;
      font-weight: 600;
      color: #1f2937;
      margin-bottom: 20px;
      border-left: 4px solid #2563eb;
      padding-left: 16px;
    }
    
    .scope-item {
      display: flex;
      gap: 20px;
      margin-bottom: 24px;
      padding: 20px;
      background-color: #f9fafb;
      border-radius: 8px;
    }
    
    .scope-number {
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      width: 40px;
      height: 40px;
      background-color: #2563eb;
      color: white;
      font-weight: 700;
      border-radius: 50%;
      font-size: 18px;
    }
    
    .scope-content h3 {
      font-size: 18px;
      color: #1f2937;
      margin-bottom: 8px;
    }
    
    .scope-content p {
      font-size: 14px;
      color: #6b7280;
      margin-bottom: 8px;
    }
    
    .scope-date {
      font-size: 13px;
      color: #9ca3af;
    }
    
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-bottom: 30px;
    }
    
    .info-item {
      padding: 16px;
      background-color: #f9fafb;
      border-radius: 8px;
    }
    
    .info-label {
      font-size: 12px;
      font-weight: 600;
      color: #9ca3af;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 8px;
    }
    
    .info-value {
      font-size: 16px;
      font-weight: 600;
      color: #1f2937;
    }
    
    .terms-text {
      font-size: 14px;
      color: #6b7280;
      line-height: 1.8;
      padding: 20px;
      background-color: #f9fafb;
      border-radius: 8px;
    }
    
    .price-summary {
      display: flex;
      justify-content: flex-end;
      margin-top: 30px;
      padding-top: 20px;
      border-top: 2px solid #e5e7eb;
    }
    
    .price-box {
      text-align: right;
    }
    
    .price-label {
      font-size: 14px;
      color: #9ca3af;
      margin-bottom: 8px;
    }
    
    .price-amount {
      font-size: 32px;
      font-weight: 700;
      color: #2563eb;
    }
    
    .footer {
      margin-top: 60px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      font-size: 12px;
      color: #9ca3af;
    }
    
    @media print {
      body {
        padding: 0;
      }
      
      .container {
        max-width: 100%;
      }
      
      @page {
        margin: 0.5in;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="title">${escapeHtml(proposal.title)}</div>
      <div class="client-info">For: <strong>${escapeHtml(proposal.clientName)}</strong></div>
      ${proposal.createdAt ? `<div class="date">Created: ${formatDate(proposal.createdAt)}</div>` : ""}
    </div>
    
    ${
      proposal.brief
        ? `
    <div class="section">
      <div class="section-title">Project Brief</div>
      <p style="font-size: 15px; color: #6b7280; line-height: 1.8;">
        ${escapeHtml(proposal.brief)}
      </p>
    </div>
    `
        : ""
    }
    
    <div class="section">
      <div class="section-title">Deliverables & Timeline</div>
      ${scopeHtml}
    </div>
    
    <div class="section">
      <div class="section-title">Project Details</div>
      <div class="info-grid">
        <div class="info-item">
          <div class="info-label">Timeline</div>
          <div class="info-value">${escapeHtml(proposal.timeline)}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Budget</div>
          <div class="info-value">${escapeHtml(proposal.budget)}</div>
        </div>
      </div>
    </div>
    
    ${
      proposal.terms
        ? `
    <div class="section">
      <div class="section-title">Terms & Conditions</div>
      <div class="terms-text">
        ${escapeHtml(proposal.terms).replace(/\n/g, "<br />")}
      </div>
    </div>
    `
        : ""
    }
    
    <div class="price-summary">
      <div class="price-box">
        <div class="price-label">Total Project Value</div>
        <div class="price-amount">${formatCurrency(proposal.totalPrice)}</div>
      </div>
    </div>
    
    <div class="footer">
      <p>This proposal was generated on ${new Date().toLocaleDateString()}.</p>
      ${proposal.freelancerEmail ? `<p>Contact: ${escapeHtml(proposal.freelancerEmail)}</p>` : ""}
    </div>
  </div>
</body>
</html>
    `;

    return NextResponse.json({
      html,
      filename: `${proposal.title.replace(/[^a-z0-9]/gi, "-").toLowerCase()}-proposal.html`,
    });
  } catch (error) {
    console.error("PDF export error:", error);
    return NextResponse.json(
      { error: "Failed to generate proposal HTML" },
      { status: 500 }
    );
  }
}

function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };
  return text.replace(/[&<>"']/g, (char) => map[char]);
}
