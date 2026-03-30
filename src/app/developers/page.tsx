'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Code2,
  Bot,
  Webhook,
  Key,
  FileText,
  Copy,
  Check,
  Terminal,
  Zap,
  Shield,
  ChevronDown,
  Layers,
  Send,
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Copy-to-clipboard button                                           */
/* ------------------------------------------------------------------ */
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
      className="absolute top-3 right-3 p-1.5 rounded-md bg-gray-700 hover:bg-gray-600 transition-colors"
      title="Copy"
    >
      {copied ? (
        <Check className="w-4 h-4 text-green-400" />
      ) : (
        <Copy className="w-4 h-4 text-gray-300" />
      )}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  Code block with syntax highlighting (simple approach)              */
/* ------------------------------------------------------------------ */
function CodeBlock({
  code,
  language = 'bash',
  title,
}: {
  code: string;
  language?: string;
  title?: string;
}) {
  return (
    <div className="rounded-lg overflow-hidden border border-gray-800 bg-gray-900">
      {title && (
        <div className="px-4 py-2 bg-gray-800 text-gray-400 text-xs font-mono border-b border-gray-700">
          {title}
        </div>
      )}
      <div className="relative">
        <pre className="p-4 overflow-x-auto text-sm leading-relaxed">
          <code className="text-gray-100 font-mono">{code}</code>
        </pre>
        <CopyButton text={code} />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Collapsible section                                                */
/* ------------------------------------------------------------------ */
function CollapsibleSection({
  title,
  children,
  defaultOpen = false,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-gray-200 rounded-lg">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
      >
        <span className="font-semibold text-gray-900">{title}</span>
        <ChevronDown
          className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>
      {open && <div className="px-4 pb-4 border-t border-gray-100">{children}</div>}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Endpoint row                                                       */
/* ------------------------------------------------------------------ */
function Endpoint({
  method,
  path,
  description,
}: {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string;
  description: string;
}) {
  const colors = {
    GET: 'bg-green-100 text-green-700',
    POST: 'bg-blue-100 text-blue-700',
    PUT: 'bg-yellow-100 text-yellow-700',
    DELETE: 'bg-red-100 text-red-700',
  };
  return (
    <div className="flex items-start gap-3 py-3 border-b border-gray-100 last:border-0">
      <span
        className={`px-2 py-0.5 rounded text-xs font-bold font-mono flex-shrink-0 ${colors[method]}`}
      >
        {method}
      </span>
      <code className="text-sm font-mono text-indigo-600 flex-shrink-0">{path}</code>
      <span className="text-sm text-gray-600">{description}</span>
    </div>
  );
}

/* ================================================================== */
/*  Developer Documentation Page                                       */
/* ================================================================== */
export default function DevelopersPage() {
  const [activeTab, setActiveTab] = useState<'rest' | 'mcp' | 'webhooks'>('rest');

  return (
    <div className="min-h-screen bg-white">
      {/* ── Navigation ─────────────────────────────────────────── */}
      <nav className="fixed top-0 w-full z-50 bg-white/95 backdrop-blur-md shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="text-2xl font-bold text-indigo-600">
              ScopePad
            </Link>
            <div className="hidden md:flex items-center gap-8">
              <Link href="/" className="text-gray-600 hover:text-gray-900 transition-colors">
                Home
              </Link>
              <Link
                href="/developers"
                className="text-indigo-600 font-semibold"
              >
                Developers
              </Link>
              <Link
                href="/dashboard"
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
              >
                Dashboard
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* ── Hero ───────────────────────────────────────────────── */}
      <section className="pt-32 pb-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 px-4 py-1.5 rounded-full text-sm font-medium mb-6">
            <Code2 className="w-4 h-4" />
            API-first freelance platform
          </div>
          <h1 className="text-5xl font-bold text-gray-900 mb-6 leading-tight">
            Build on ScopePad
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed">
            REST API, MCP server, and webhooks. Connect your AI agent to automate
            proposals, invoices, SOWs, and the entire client lifecycle.
          </p>
          <div className="flex items-center justify-center gap-4">
            <a
              href="#quickstart"
              className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors font-medium flex items-center gap-2"
            >
              Quick start <ArrowRight className="w-4 h-4" />
            </a>
            <a
              href="#api-reference"
              className="border border-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:border-indigo-300 hover:text-indigo-600 transition-colors font-medium"
            >
              API reference
            </a>
          </div>
        </div>
      </section>

      {/* ── Capabilities grid ──────────────────────────────────── */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-8">
          {[
            {
              icon: Terminal,
              title: 'REST API',
              description:
                'Full CRUD for documents, clients, and templates. Bearer token auth. OpenAPI-compatible.',
              tag: 'Pro',
            },
            {
              icon: Bot,
              title: 'MCP Server',
              description:
                'Connect Claude Desktop or Cursor directly. 12 tools, 3 resources. One npm install.',
              tag: 'Pro+',
            },
            {
              icon: Webhook,
              title: 'Webhooks',
              description:
                'Real-time event notifications. HMAC-signed. 7 events. Build reactive agent workflows.',
              tag: 'Pro',
            },
          ].map((item) => (
            <div
              key={item.title}
              className="bg-white rounded-xl p-6 border border-gray-200 hover:border-indigo-200 hover:shadow-lg transition-all"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                  <item.icon className="w-5 h-5 text-indigo-600" />
                </div>
                <span className="text-xs font-medium bg-indigo-50 text-indigo-600 px-2 py-1 rounded">
                  {item.tag}
                </span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{item.title}</h3>
              <p className="text-gray-600 text-sm leading-relaxed">{item.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Quick start ────────────────────────────────────────── */}
      <section id="quickstart" className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Quick start</h2>
          <p className="text-gray-600 mb-10">API key to first API call in 60 seconds.</p>

          <div className="space-y-8">
            {/* Step 1 */}
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                1
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-2">Get your API key</h3>
                <p className="text-gray-600 text-sm mb-3">
                  Go to{' '}
                  <Link href="/dashboard/settings" className="text-indigo-600 underline">
                    Settings → API Keys
                  </Link>{' '}
                  and create a new key. Copy it — you&apos;ll only see it once.
                </p>
                <CodeBlock
                  code="# Your key looks like this:\nsk_scopepad_a1b2c3d4e5f6..."
                  title="API Key Format"
                />
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                2
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-2">Make your first request</h3>
                <CodeBlock
                  code={`curl -s https://app.scopepad.com/api/v1/documents \\
  -H "Authorization: Bearer sk_scopepad_YOUR_KEY" \\
  -H "Content-Type: application/json" | jq`}
                  title="List your documents"
                />
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                3
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-2">Create a document</h3>
                <CodeBlock
                  code={`curl -X POST https://app.scopepad.com/api/v1/documents \\
  -H "Authorization: Bearer sk_scopepad_YOUR_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "type": "proposal",
    "title": "Website Redesign Proposal",
    "content": {
      "overview": "Complete redesign of corporate website...",
      "deliverables": [
        { "title": "Design mockups", "description": "3 homepage concepts", "due_date": "2026-04-15" }
      ],
      "timeline": "6 weeks",
      "pricing": { "total": 8500, "currency": "USD" },
      "terms": "50% upfront, 50% on completion"
    },
    "client_id": "your-client-uuid"
  }'`}
                  title="Create a proposal"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── MCP Setup ──────────────────────────────────────────── */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <Bot className="w-7 h-7 text-indigo-600" />
            <h2 className="text-3xl font-bold text-gray-900">MCP Server Setup</h2>
          </div>
          <p className="text-gray-600 mb-10">
            Connect your AI agent to ScopePad in under a minute. Pro+ only.
          </p>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <span className="w-6 h-6 bg-purple-100 rounded text-purple-700 flex items-center justify-center text-xs font-bold">
                  C
                </span>
                Claude Desktop
              </h3>
              <CodeBlock
                language="json"
                code={`{
  "mcpServers": {
    "scopepad": {
      "command": "npx",
      "args": ["@scopepad/mcp-server"],
      "env": {
        "SCOPEPAD_API_KEY": "sk_scopepad_..."
      }
    }
  }
}`}
                title="claude_desktop_config.json"
              />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <span className="w-6 h-6 bg-blue-100 rounded text-blue-700 flex items-center justify-center text-xs font-bold">
                  {'<>'}
                </span>
                Cursor
              </h3>
              <CodeBlock
                language="json"
                code={`{
  "mcpServers": {
    "scopepad": {
      "command": "npx",
      "args": ["@scopepad/mcp-server"],
      "env": {
        "SCOPEPAD_API_KEY": "sk_scopepad_..."
      }
    }
  }
}`}
                title=".cursor/mcp.json"
              />
            </div>
          </div>

          <div className="mt-8 bg-white border border-gray-200 rounded-xl p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Available MCP Tools (12)</h3>
            <div className="grid md:grid-cols-3 gap-3 text-sm">
              {[
                ['list_documents', 'List & filter documents'],
                ['get_document', 'Get full document + lineage'],
                ['create_document', 'Create new document'],
                ['update_document', 'Edit content or status'],
                ['derive_document', 'Create child from parent'],
                ['export_document', 'Generate PDF'],
                ['send_document', 'Send to client'],
                ['list_clients', 'List all clients'],
                ['get_client', 'Client details + history'],
                ['create_client', 'Add new client'],
                ['list_templates', 'Browse templates'],
                ['get_template', 'Get template schema'],
              ].map(([tool, desc]) => (
                <div key={tool} className="flex items-start gap-2 py-1">
                  <code className="text-indigo-600 font-mono text-xs bg-indigo-50 px-1.5 py-0.5 rounded flex-shrink-0">
                    {tool}
                  </code>
                  <span className="text-gray-500 text-xs">{desc}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── API Reference ──────────────────────────────────────── */}
      <section id="api-reference" className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">API Reference</h2>
          <p className="text-gray-600 mb-8">
            Base URL: <code className="bg-gray-100 px-2 py-1 rounded text-sm">https://app.scopepad.com/api/v1</code>
            &nbsp;· Auth: <code className="bg-gray-100 px-2 py-1 rounded text-sm">Authorization: Bearer sk_scopepad_...</code>
          </p>

          {/* Tabs */}
          <div className="flex gap-1 bg-gray-100 p-1 rounded-lg mb-8 w-fit">
            {(['rest', 'mcp', 'webhooks'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === tab
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab === 'rest' ? 'REST API' : tab === 'mcp' ? 'MCP Server' : 'Webhooks'}
              </button>
            ))}
          </div>

          {/* REST API tab */}
          {activeTab === 'rest' && (
            <div className="space-y-6">
              <CollapsibleSection title="Documents" defaultOpen>
                <div className="pt-3">
                  <Endpoint method="GET" path="/documents" description="List documents with optional type, status, client_id filters" />
                  <Endpoint method="POST" path="/documents" description="Create a new document (validates content against type schema)" />
                  <Endpoint method="GET" path="/documents/:id" description="Get document with content, metadata, versions, and lineage" />
                  <Endpoint method="PUT" path="/documents/:id" description="Update content, metadata, or status (auto-versions on content change)" />
                  <Endpoint method="DELETE" path="/documents/:id" description="Soft delete (archive) a document" />
                  <Endpoint method="POST" path="/documents/:id/export" description="Generate PDF export, returns file_url" />
                  <Endpoint method="POST" path="/documents/:id/send" description="Send document to client (sets status to sent)" />
                  <Endpoint method="POST" path="/documents/:id/derive" description="Create child document from parent (e.g., brief → SOW)" />
                </div>
              </CollapsibleSection>

              <CollapsibleSection title="Clients">
                <div className="pt-3">
                  <Endpoint method="GET" path="/clients" description="List all clients, optional search query" />
                  <Endpoint method="POST" path="/clients" description="Create a new client (name, email, company)" />
                  <Endpoint method="GET" path="/clients/:id" description="Get client with recent document history" />
                </div>
              </CollapsibleSection>

              <CollapsibleSection title="Templates">
                <div className="pt-3">
                  <Endpoint method="GET" path="/templates" description="List available templates (system + custom), filter by type and category" />
                  <Endpoint method="GET" path="/templates/:id" description="Get template with section schemas and AI prompts" />
                </div>
              </CollapsibleSection>

              <CollapsibleSection title="AI Generation">
                <div className="pt-3">
                  <Endpoint method="POST" path="/generate" description="Generate full document from template + context (uses Claude API)" />
                  <Endpoint method="POST" path="/generate/section" description="Regenerate a single section with custom instructions" />
                </div>
              </CollapsibleSection>
            </div>
          )}

          {/* Webhooks tab */}
          {activeTab === 'webhooks' && (
            <div className="space-y-6">
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-indigo-600" />
                  HMAC-SHA256 Signed
                </h3>
                <p className="text-gray-600 text-sm mb-4">
                  Every webhook delivery is signed with your webhook secret. Verify the signature
                  before processing.
                </p>
                <CodeBlock
                  code={`import crypto from 'crypto';

function verifyWebhook(payload: string, signature: string, secret: string): boolean {
  const expected = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expected)
  );
}

// In your webhook handler:
const signature = req.headers['x-scopepad-signature'];
const isValid = verifyWebhook(JSON.stringify(req.body), signature, YOUR_SECRET);`}
                  language="typescript"
                  title="Verify webhook signature (TypeScript)"
                />
              </div>

              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Events</h3>
                <div className="space-y-2">
                  {[
                    ['document.created', 'Fired when a new document is created'],
                    ['document.updated', 'Fired when document content or metadata changes'],
                    ['document.sent', 'Fired when a document is sent to a client'],
                    ['document.approved', 'Fired when a client approves a document'],
                    ['document.declined', 'Fired when a client declines a document'],
                    ['invoice.paid', 'Fired when an invoice is marked as paid'],
                    ['client.created', 'Fired when a new client is added'],
                  ].map(([event, desc]) => (
                    <div key={event} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                      <code className="text-sm font-mono bg-gray-100 px-2 py-0.5 rounded text-gray-800">
                        {event}
                      </code>
                      <span className="text-sm text-gray-600">{desc}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <h3 className="font-semibold text-gray-900 mb-3">Headers</h3>
                <div className="text-sm space-y-1">
                  <p><code className="bg-gray-100 px-1.5 py-0.5 rounded">X-Scopepad-Signature</code> — HMAC-SHA256 hex digest</p>
                  <p><code className="bg-gray-100 px-1.5 py-0.5 rounded">X-Scopepad-Event</code> — Event type (e.g., document.created)</p>
                  <p><code className="bg-gray-100 px-1.5 py-0.5 rounded">X-Scopepad-Delivery</code> — Unique delivery UUID</p>
                </div>
                <p className="text-sm text-gray-500 mt-3">
                  Retries: 3 attempts with exponential backoff (10s, 60s, 300s). Pro tier: 3 endpoints. Pro+: unlimited.
                </p>
              </div>
            </div>
          )}

          {/* MCP tab */}
          {activeTab === 'mcp' && (
            <div className="space-y-6">
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <h3 className="font-semibold text-gray-900 mb-3">Install</h3>
                <CodeBlock code="npm install -g @scopepad/mcp-server" title="Terminal" />
                <p className="text-sm text-gray-500 mt-3">
                  Or run directly with <code className="bg-gray-100 px-1.5 py-0.5 rounded">npx @scopepad/mcp-server</code>
                </p>
              </div>

              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Example: Brief → SOW → Proposal pipeline</h3>
                <p className="text-gray-600 text-sm mb-4">
                  Tell your AI agent to run a full document pipeline for a new client:
                </p>
                <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-700 leading-relaxed italic">
                  &quot;Create a project brief for Acme Corp&apos;s website redesign, then derive a detailed SOW from it, then derive a proposal from the SOW. Use the Standard Proposal template. Send the proposal to jane@acme.com when it looks good.&quot;
                </div>
                <p className="text-sm text-gray-500 mt-3">
                  The agent calls <code className="bg-gray-100 px-1 rounded">create_document</code> →
                  <code className="bg-gray-100 px-1 rounded">derive_document</code> →
                  <code className="bg-gray-100 px-1 rounded">derive_document</code> →
                  <code className="bg-gray-100 px-1 rounded">send_document</code>
                </p>
              </div>

              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Resources</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-3">
                    <code className="bg-indigo-50 text-indigo-600 px-2 py-1 rounded font-mono">scopepad://profile</code>
                    <span className="text-gray-600">Your freelancer profile, services, and rates</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <code className="bg-indigo-50 text-indigo-600 px-2 py-1 rounded font-mono">scopepad://clients</code>
                    <span className="text-gray-600">Client directory with contact info</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <code className="bg-indigo-50 text-indigo-600 px-2 py-1 rounded font-mono">scopepad://dashboard</code>
                    <span className="text-gray-600">Business stats and recent activity</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── Code examples ──────────────────────────────────────── */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Code Examples</h2>
          <p className="text-gray-600 mb-10">Copy-paste ready examples in Python, TypeScript, and curl.</p>

          <div className="space-y-6">
            <CodeBlock
              language="python"
              title="Python — Create and send a proposal"
              code={`import requests

API_KEY = "sk_scopepad_..."
BASE = "https://app.scopepad.com/api/v1"
headers = {"Authorization": f"Bearer {API_KEY}", "Content-Type": "application/json"}

# Create proposal
proposal = requests.post(f"{BASE}/documents", headers=headers, json={
    "type": "proposal",
    "title": "Mobile App Development",
    "client_id": "client-uuid-here",
    "content": {
        "overview": "Native iOS and Android app for inventory management.",
        "deliverables": [
            {"title": "UI/UX Design", "description": "Figma mockups", "due_date": "2026-05-01"},
            {"title": "iOS App", "description": "Swift implementation", "due_date": "2026-06-15"},
            {"title": "Android App", "description": "Kotlin implementation", "due_date": "2026-07-01"}
        ],
        "timeline": "12 weeks",
        "pricing": {"total": 24000, "currency": "USD"},
        "terms": "30% upfront, 30% at midpoint, 40% on delivery"
    }
}).json()

doc_id = proposal["data"]["document"]["id"]

# Send to client
requests.post(f"{BASE}/documents/{doc_id}/send", headers=headers, json={
    "message": "Hi — here's the proposal we discussed. Let me know if you have any questions!"
})`}
            />

            <CodeBlock
              language="typescript"
              title="TypeScript — Derive SOW from brief"
              code={`const API_KEY = "sk_scopepad_...";
const BASE = "https://app.scopepad.com/api/v1";

const headers = {
  Authorization: \`Bearer \${API_KEY}\`,
  "Content-Type": "application/json",
};

// Get existing brief
const brief = await fetch(\`\${BASE}/documents/\${briefId}\`, { headers }).then(r => r.json());

// Derive a SOW from the brief
const sow = await fetch(\`\${BASE}/documents/\${briefId}/derive\`, {
  method: "POST",
  headers,
  body: JSON.stringify({
    type: "sow",
    title: \`SOW: \${brief.data.document.title}\`,
    content: {
      project_overview: brief.data.document.content.project_overview,
      scope: "Detailed scope derived from project brief...",
      deliverables: brief.data.document.content.requirements?.map((r: string) => ({
        title: r, description: "", due_date: ""
      })) || [],
      milestones: [],
      acceptance_criteria: "Client sign-off on each deliverable.",
      assumptions: "Requirements are final as specified in the brief.",
      exclusions: "Ongoing maintenance and hosting.",
      change_process: "All changes require a signed change order."
    }
  }),
}).then(r => r.json());

console.log("SOW created:", sow.data.document.id);`}
            />

            <CodeBlock
              language="bash"
              title="curl — List invoices and export one"
              code={`# List paid invoices
curl -s "https://app.scopepad.com/api/v1/documents?type=invoice&status=paid" \\
  -H "Authorization: Bearer sk_scopepad_..." | jq '.data.documents[].title'

# Export the first one as PDF
curl -X POST "https://app.scopepad.com/api/v1/documents/INVOICE_ID/export" \\
  -H "Authorization: Bearer sk_scopepad_..." | jq '.data.file_url'`}
            />
          </div>
        </div>
      </section>

      {/* ── Agent workflow demo ────────────────────────────────── */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Example Agent Workflow</h2>
          <p className="text-gray-600 mb-10">
            The full client lifecycle, automated by your AI agent.
          </p>

          <div className="relative">
            <div className="absolute left-[18px] top-8 bottom-8 w-0.5 bg-indigo-200"></div>
            <div className="space-y-8">
              {[
                {
                  icon: FileText,
                  title: 'Discovery call notes → Project Brief',
                  description: 'Agent creates a brief from meeting notes using the Project Brief template.',
                  tool: 'create_document',
                },
                {
                  icon: Layers,
                  title: 'Brief → Detailed SOW',
                  description: 'Agent derives a SOW from the brief, filling in deliverables and milestones.',
                  tool: 'derive_document',
                },
                {
                  icon: FileText,
                  title: 'SOW → Proposal',
                  description: 'Agent derives a client-facing proposal from the SOW with pricing.',
                  tool: 'derive_document',
                },
                {
                  icon: Send,
                  title: 'Send to client',
                  description: 'Agent sends the proposal to the client for approval.',
                  tool: 'send_document',
                },
                {
                  icon: Zap,
                  title: 'Client approves → Invoice generated',
                  description: 'Webhook fires on approval. Agent auto-creates an invoice from the proposal.',
                  tool: 'document.approved webhook → create_document',
                },
                {
                  icon: Key,
                  title: 'Invoice paid → Wrap up',
                  description: 'Webhook fires on payment. Agent sends wrap-up email and requests testimonial.',
                  tool: 'invoice.paid webhook',
                },
              ].map((step, i) => (
                <div key={i} className="flex gap-4 relative">
                  <div className="flex-shrink-0 w-9 h-9 bg-indigo-600 rounded-full flex items-center justify-center z-10">
                    <step.icon className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1 pt-1">
                    <h3 className="font-semibold text-gray-900">{step.title}</h3>
                    <p className="text-gray-600 text-sm mt-1">{step.description}</p>
                    <code className="text-xs text-indigo-500 mt-1 inline-block">{step.tool}</code>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ────────────────────────────────────────────────── */}
      <section className="py-20 px-4 bg-indigo-600">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to automate your freelance workflow?
          </h2>
          <p className="text-indigo-100 text-lg mb-8">
            Start your 14-day Pro trial. Get API access from day one.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link
              href="/signup"
              className="bg-white text-indigo-600 px-6 py-3 rounded-lg hover:bg-indigo-50 transition-colors font-semibold flex items-center gap-2"
            >
              Start free trial <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href="#quickstart"
              className="border border-indigo-400 text-white px-6 py-3 rounded-lg hover:bg-indigo-500 transition-colors font-medium"
            >
              View docs
            </a>
          </div>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────── */}
      <footer className="py-8 px-4 bg-gray-900 text-gray-400 text-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <span>© 2026 ScopePad. All rights reserved.</span>
          <div className="flex gap-6">
            <Link href="/" className="hover:text-white transition-colors">
              Home
            </Link>
            <Link href="/developers" className="hover:text-white transition-colors">
              Developers
            </Link>
            <Link href="/dashboard" className="hover:text-white transition-colors">
              Dashboard
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
