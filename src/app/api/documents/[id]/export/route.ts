// =============================================================
// MTR-283: Server-side PDF generation
// POST /api/documents/[id]/export
// =============================================================

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const format = (body.format as string) || "pdf";

  if (!["pdf", "docx"].includes(format)) {
    return NextResponse.json(
      { error: "Unsupported format. Use 'pdf' or 'docx'" },
      { status: 400 }
    );
  }

  // Get document
  const { data: doc, error } = await supabase
    .from("documents")
    .select("*")
    .eq("id", id)
    .eq("freelancer_id", user.id)
    .single();

  if (error || !doc) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  // Get freelancer profile for branding
  const { data: freelancer } = await supabase
    .from("freelancers")
    .select("name, email, brand_color, logo_url, portfolio_url")
    .eq("id", user.id)
    .single();

  // Get client info if linked
  let client = null;
  if (doc.client_id) {
    const { data: clientData } = await supabase
      .from("clients")
      .select("name, email, company")
      .eq("id", doc.client_id)
      .single();
    client = clientData;
  }

  if (format === "pdf") {
    // Generate HTML then convert to PDF buffer
    const html = renderDocumentToHTML(doc, freelancer, client);

    // For now, return HTML as a downloadable file
    // In production, use Puppeteer or @react-pdf/renderer
    // This works as a server-rendered HTML-to-PDF path
    const pdfBuffer = await htmlToPdfBuffer(html);

    if (!pdfBuffer) {
      // Fallback: return HTML document for client-side printing
      return new NextResponse(html, {
        headers: {
          "Content-Type": "text/html",
          "Content-Disposition": `attachment; filename="${doc.title}.html"`,
        },
      });
    }

    // Upload to Supabase Storage
    const serviceClient = createServiceClient();
    const storagePath = `${user.id}/${id}/v${doc.version}.pdf`;
    await serviceClient.storage
      .from("documents")
      .upload(storagePath, pdfBuffer, {
        contentType: "application/pdf",
        upsert: true,
      });

    const {
      data: { publicUrl },
    } = serviceClient.storage.from("documents").getPublicUrl(storagePath);

    // Update document with file URL
    await supabase
      .from("documents")
      .update({ file_url: storagePath, file_type: "pdf" })
      .eq("id", id);

    return new NextResponse(pdfBuffer as unknown as BodyInit, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${doc.title}.pdf"`,
      },
    });
  }

  return NextResponse.json({ error: "Format not yet supported" }, { status: 501 });
}

// ---- HTML rendering ----

function renderDocumentToHTML(
  doc: Record<string, unknown>,
  freelancer: Record<string, unknown> | null,
  client: Record<string, unknown> | null
): string {
  const content = doc.content as Record<string, unknown>;
  const metadata = doc.metadata as Record<string, unknown>;
  const brandColor = (freelancer?.brand_color as string) || "#6366f1";

  let bodyHTML = "";

  switch (doc.type) {
    case "proposal":
      bodyHTML = renderProposal(content, metadata, client);
      break;
    case "invoice":
      bodyHTML = renderInvoice(content, metadata, client);
      break;
    case "sow":
      bodyHTML = renderSOW(content, metadata, client);
      break;
    default:
      bodyHTML = renderGeneric(content, doc.type as string);
  }

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${doc.title}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #1a1a2e; line-height: 1.6; padding: 40px; max-width: 800px; margin: 0 auto; }
    h1 { font-size: 28px; color: ${brandColor}; margin-bottom: 8px; }
    h2 { font-size: 20px; color: #333; margin-top: 24px; margin-bottom: 12px; border-bottom: 2px solid ${brandColor}; padding-bottom: 4px; }
    h3 { font-size: 16px; margin-top: 16px; margin-bottom: 8px; }
    p { margin-bottom: 12px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px; padding-bottom: 16px; border-bottom: 3px solid ${brandColor}; }
    .header-left h1 { margin-bottom: 4px; }
    .header-right { text-align: right; font-size: 13px; color: #666; }
    .meta-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
    .meta-label { font-weight: 600; color: #555; }
    table { width: 100%; border-collapse: collapse; margin: 16px 0; }
    th { background: ${brandColor}; color: white; padding: 10px 12px; text-align: left; font-size: 13px; }
    td { padding: 10px 12px; border-bottom: 1px solid #eee; font-size: 14px; }
    tr:nth-child(even) { background: #f8f9fa; }
    .total-row { font-weight: 700; font-size: 16px; background: #f0f0ff; }
    .footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #ddd; font-size: 12px; color: #888; text-align: center; }
    .section { margin-bottom: 24px; }
    ul { margin-left: 20px; margin-bottom: 12px; }
    li { margin-bottom: 4px; }
  </style>
</head>
<body>
  <div class="header">
    <div class="header-left">
      <h1>${doc.title}</h1>
      <p style="color:#666; font-size:14px;">${(doc.type as string).replace(/_/g, " ").toUpperCase()}</p>
    </div>
    <div class="header-right">
      ${freelancer ? `<strong>${freelancer.name}</strong><br>${freelancer.email}` : ""}
      ${client ? `<br><br><strong>To:</strong> ${client.name}${client.company ? ` — ${client.company}` : ""}` : ""}
      <br><br>${new Date(doc.created_at as string).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
    </div>
  </div>
  ${bodyHTML}
  <div class="footer">
    Generated by ScopePad &middot; ${new Date().toLocaleDateString()}
  </div>
</body>
</html>`;
}

function renderProposal(
  content: Record<string, unknown>,
  metadata: Record<string, unknown>,
  client: Record<string, unknown> | null
): string {
  const deliverables = (content.deliverables as Array<Record<string, string>>) || [];
  return `
    <div class="section">
      <h2>Overview</h2>
      <p>${content.overview || ""}</p>
    </div>
    <div class="section">
      <h2>Deliverables</h2>
      <table>
        <thead><tr><th>Deliverable</th><th>Description</th><th>Due Date</th></tr></thead>
        <tbody>
          ${deliverables.map((d) => `<tr><td><strong>${d.title}</strong></td><td>${d.description}</td><td>${d.due_date || "TBD"}</td></tr>`).join("")}
        </tbody>
      </table>
    </div>
    ${content.timeline ? `<div class="section"><h2>Timeline</h2><p>${content.timeline}</p></div>` : ""}
    ${content.pricing ? `<div class="section"><h2>Pricing</h2><p>${content.pricing}</p></div>` : ""}
    ${metadata.total_price ? `<div class="meta-row"><span class="meta-label">Total Price</span><span>$${Number(metadata.total_price).toLocaleString()}</span></div>` : ""}
    ${content.terms ? `<div class="section"><h2>Terms & Conditions</h2><p>${content.terms}</p></div>` : ""}
  `;
}

function renderInvoice(
  content: Record<string, unknown>,
  metadata: Record<string, unknown>,
  client: Record<string, unknown> | null
): string {
  const lineItems = (content.line_items as Array<Record<string, unknown>>) || [];
  const total = (metadata.total as number) || lineItems.reduce((sum, li) => sum + (li.quantity as number) * (li.rate as number), 0);
  return `
    <div class="section">
      ${metadata.due_date ? `<div class="meta-row"><span class="meta-label">Due Date</span><span>${metadata.due_date}</span></div>` : ""}
      ${metadata.payment_terms ? `<div class="meta-row"><span class="meta-label">Payment Terms</span><span>${metadata.payment_terms}</span></div>` : ""}
    </div>
    <table>
      <thead><tr><th>Description</th><th style="text-align:right">Qty</th><th style="text-align:right">Rate</th><th style="text-align:right">Amount</th></tr></thead>
      <tbody>
        ${lineItems.map((li) => `<tr><td>${li.description}</td><td style="text-align:right">${li.quantity}</td><td style="text-align:right">$${Number(li.rate).toFixed(2)}</td><td style="text-align:right">$${((li.quantity as number) * (li.rate as number)).toFixed(2)}</td></tr>`).join("")}
        <tr class="total-row"><td colspan="3" style="text-align:right">Total</td><td style="text-align:right">$${total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td></tr>
      </tbody>
    </table>
    ${content.notes ? `<div class="section"><h2>Notes</h2><p>${content.notes}</p></div>` : ""}
  `;
}

function renderSOW(
  content: Record<string, unknown>,
  metadata: Record<string, unknown>,
  client: Record<string, unknown> | null
): string {
  const scope = (content.scope_of_work as Array<Record<string, unknown>>) || [];
  const assumptions = (content.assumptions as string[]) || [];
  const exclusions = (content.exclusions as string[]) || [];
  return `
    <div class="section"><h2>Project Overview</h2><p>${content.project_overview || ""}</p></div>
    ${(content.objectives as string[])?.length ? `<div class="section"><h2>Objectives</h2><ul>${(content.objectives as string[]).map((o) => `<li>${o}</li>`).join("")}</ul></div>` : ""}
    <div class="section">
      <h2>Scope of Work</h2>
      ${scope.map((s) => `<h3>${s.phase}</h3><p>${s.description}</p>${(s.deliverables as string[])?.length ? `<ul>${(s.deliverables as string[]).map((d) => `<li>${d}</li>`).join("")}</ul>` : ""}`).join("")}
    </div>
    ${assumptions.length ? `<div class="section"><h2>Assumptions</h2><ul>${assumptions.map((a) => `<li>${a}</li>`).join("")}</ul></div>` : ""}
    ${exclusions.length ? `<div class="section"><h2>Exclusions</h2><ul>${exclusions.map((e) => `<li>${e}</li>`).join("")}</ul></div>` : ""}
    ${content.acceptance_process ? `<div class="section"><h2>Acceptance Process</h2><p>${content.acceptance_process}</p></div>` : ""}
  `;
}

function renderGeneric(content: Record<string, unknown>, type: string): string {
  return Object.entries(content)
    .map(([key, value]) => {
      const label = key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
      if (typeof value === "string") return `<div class="section"><h2>${label}</h2><p>${value}</p></div>`;
      if (Array.isArray(value)) return `<div class="section"><h2>${label}</h2><ul>${value.map((v) => `<li>${typeof v === "string" ? v : JSON.stringify(v)}</li>`).join("")}</ul></div>`;
      return `<div class="section"><h2>${label}</h2><pre>${JSON.stringify(value, null, 2)}</pre></div>`;
    })
    .join("");
}

// ---- PDF generation (Puppeteer-free fallback) ----

async function htmlToPdfBuffer(html: string): Promise<Buffer | null> {
  // In production, use Puppeteer or a headless Chrome service
  // For Vercel serverless, consider @vercel/og or an external PDF API
  // Returning null triggers the HTML fallback
  try {
    // Check if Puppeteer is available (won't be in all environments)
    // @ts-ignore puppeteer is optional
    const puppeteer = await import("puppeteer").catch(() => null);
    if (!puppeteer) return null;

    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });
    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "20mm", bottom: "20mm", left: "15mm", right: "15mm" },
    });
    await browser.close();
    return Buffer.from(pdf);
  } catch {
    return null;
  }
}
