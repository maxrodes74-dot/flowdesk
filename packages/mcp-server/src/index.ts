#!/usr/bin/env node

/**
 * ScopePad MCP Server
 * Exposes ScopePad REST API as Model Context Protocol tools & resources
 * Transport: stdio (Claude Desktop, Cursor)
 * Pro+ tier only
 */

import {
  McpServer,
  StdioServerTransport,
} from "@modelcontextprotocol/sdk/server/index.js";
import {
  CallToolRequest,
  ListResourcesRequest,
  ReadResourceRequest,
  Tool,
  Resource,
  ResourceTemplate,
} from "@modelcontextprotocol/sdk/types.js";
import { ScopepadClient } from "./api-client.js";

// ============================================================
// Initialization
// ============================================================

const apiKey = process.env.SCOPEPAD_API_KEY;
if (!apiKey) {
  console.error("Error: SCOPEPAD_API_KEY environment variable is not set");
  process.exit(1);
}

const client = new ScopepadClient(apiKey);
const server = new McpServer({
  name: "scopepad-mcp",
  version: "0.1.0",
});

// ============================================================
// Tool Definitions
// ============================================================

const TOOLS: Tool[] = [
  // Documents
  {
    name: "list_documents",
    description:
      "List and filter documents (proposals, invoices, SOWs, etc.) from your ScopePad workspace",
    inputSchema: {
      type: "object" as const,
      properties: {
        type: {
          type: "string",
          description:
            "Filter by document type (proposal, invoice, sow, brief, contract, etc.)",
        },
        status: {
          type: "string",
          description:
            "Filter by document status (draft, sent, approved, rejected)",
        },
        client_id: {
          type: "string",
          description: "Filter by client ID",
        },
        limit: {
          type: "number",
          description: "Maximum number of documents to return (default: 50)",
        },
      },
    },
  },
  {
    name: "get_document",
    description:
      "Get full document content, metadata, version history, and lineage",
    inputSchema: {
      type: "object" as const,
      properties: {
        id: {
          type: "string",
          description: "Document ID",
        },
      },
      required: ["id"],
    },
  },
  {
    name: "create_document",
    description:
      "Create a new document (proposal, invoice, SOW, contract, brief, etc.)",
    inputSchema: {
      type: "object" as const,
      properties: {
        type: {
          type: "string",
          description: "Document type (proposal, invoice, sow, contract, brief)",
        },
        title: {
          type: "string",
          description: "Document title",
        },
        content: {
          type: "object",
          description: "Document content as structured JSON",
        },
        client_id: {
          type: "string",
          description: "Optional: Assign to a client",
        },
        template_id: {
          type: "string",
          description: "Optional: Base from a template",
        },
        parent_id: {
          type: "string",
          description:
            "Optional: Parent document ID (for creating child documents)",
        },
        status: {
          type: "string",
          description: "Optional: Initial status (draft, sent, approved)",
        },
      },
      required: ["type", "title", "content"],
    },
  },
  {
    name: "update_document",
    description: "Update document content, metadata, status, or title",
    inputSchema: {
      type: "object" as const,
      properties: {
        id: {
          type: "string",
          description: "Document ID",
        },
        title: {
          type: "string",
          description: "New title",
        },
        content: {
          type: "object",
          description: "Updated content",
        },
        status: {
          type: "string",
          description: "New status (draft, sent, approved, rejected)",
        },
        metadata: {
          type: "object",
          description: "Custom metadata",
        },
        client_id: {
          type: "string",
          description: "Reassign to a different client",
        },
      },
      required: ["id"],
    },
  },
  {
    name: "derive_document",
    description:
      "Create a child document from a parent (e.g., brief → SOW → proposal)",
    inputSchema: {
      type: "object" as const,
      properties: {
        id: {
          type: "string",
          description: "Parent document ID",
        },
        type: {
          type: "string",
          description: "New document type",
        },
        title: {
          type: "string",
          description: "New document title",
        },
        content: {
          type: "object",
          description: "Optional: Seed content for the derived document",
        },
      },
      required: ["id", "type", "title"],
    },
  },
  {
    name: "export_document",
    description: "Generate a PDF or DOCX export of a document",
    inputSchema: {
      type: "object" as const,
      properties: {
        id: {
          type: "string",
          description: "Document ID",
        },
      },
      required: ["id"],
    },
  },
  {
    name: "send_document",
    description: "Send a document to a client for review, approval, or signing",
    inputSchema: {
      type: "object" as const,
      properties: {
        id: {
          type: "string",
          description: "Document ID",
        },
        client_email: {
          type: "string",
          description: "Optional: Override recipient email",
        },
        message: {
          type: "string",
          description:
            "Optional: Custom message to include in the email to client",
        },
      },
      required: ["id"],
    },
  },

  // Clients
  {
    name: "list_clients",
    description: "List all clients in your ScopePad workspace",
    inputSchema: {
      type: "object" as const,
      properties: {
        search: {
          type: "string",
          description: "Optional: Search by name or email",
        },
      },
    },
  },
  {
    name: "get_client",
    description: "Get detailed client information with document history",
    inputSchema: {
      type: "object" as const,
      properties: {
        id: {
          type: "string",
          description: "Client ID",
        },
      },
      required: ["id"],
    },
  },
  {
    name: "create_client",
    description: "Add a new client to your workspace",
    inputSchema: {
      type: "object" as const,
      properties: {
        name: {
          type: "string",
          description: "Client name",
        },
        email: {
          type: "string",
          description: "Client email",
        },
        company: {
          type: "string",
          description: "Optional: Client company name",
        },
      },
      required: ["name", "email"],
    },
  },

  // Templates
  {
    name: "list_templates",
    description: "List available document templates for your tier",
    inputSchema: {
      type: "object" as const,
      properties: {
        type: {
          type: "string",
          description:
            "Filter by document type (proposal, invoice, sow, contract, brief)",
        },
        category: {
          type: "string",
          description:
            "Filter by category (general, development, design, consulting, creative)",
        },
      },
    },
  },
  {
    name: "get_template",
    description:
      "Get template details with section schema and AI generation prompts",
    inputSchema: {
      type: "object" as const,
      properties: {
        id: {
          type: "string",
          description: "Template ID",
        },
      },
      required: ["id"],
    },
  },
];

// ============================================================
// Tool Handlers
// ============================================================

server.setRequestHandler(
  CallToolRequest,
  async (request: CallToolRequest) => {
    const { name, arguments: args } = request;

    try {
      let result: Record<string, unknown>;

      switch (name) {
        // Documents
        case "list_documents":
          result = await client.listDocuments(
            args as {
              type?: string;
              status?: string;
              client_id?: string;
              limit?: number;
            }
          );
          return {
            content: [
              {
                type: "text",
                text: formatDocumentList(result),
              },
            ],
          };

        case "get_document":
          result = await client.getDocument((args as { id: string }).id);
          return {
            content: [
              {
                type: "text",
                text: formatDocument(result),
              },
            ],
          };

        case "create_document":
          result = await client.createDocument(
            args as {
              type: string;
              title: string;
              content: Record<string, unknown>;
              client_id?: string;
              template_id?: string;
              parent_id?: string;
              metadata?: Record<string, unknown>;
              status?: string;
              ai_generated?: boolean;
            }
          );
          return {
            content: [
              {
                type: "text",
                text: `Document created successfully:\nID: ${(result as Record<string, any>).id}\nTitle: ${(result as Record<string, any>).title}\nStatus: ${(result as Record<string, any>).status}`,
              },
            ],
          };

        case "update_document":
          result = await client.updateDocument(
            (args as { id: string }).id,
            args as {
              title?: string;
              content?: Record<string, unknown>;
              metadata?: Record<string, unknown>;
              status?: string;
              client_id?: string;
            }
          );
          return {
            content: [
              {
                type: "text",
                text: `Document updated successfully:\nID: ${(result as Record<string, any>).id}\nTitle: ${(result as Record<string, any>).title}\nUpdated: ${(result as Record<string, any>).updated_at}`,
              },
            ],
          };

        case "derive_document":
          result = await client.deriveDocument(
            (args as { id: string }).id,
            args as {
              type: string;
              title: string;
              content?: Record<string, unknown>;
            }
          );
          return {
            content: [
              {
                type: "text",
                text: `Child document created successfully:\nID: ${(result as Record<string, any>).id}\nTitle: ${(result as Record<string, any>).title}\nParent: ${(result as Record<string, any>).parent_id}`,
              },
            ],
          };

        case "export_document":
          result = await client.exportDocument(
            (args as { id: string }).id
          );
          return {
            content: [
              {
                type: "text",
                text: `Export started successfully:\nDownload URL: ${(result as Record<string, any>).download_url || "Check your email"}\nFormat: ${(result as Record<string, any>).format || "PDF"}`,
              },
            ],
          };

        case "send_document":
          result = await client.sendDocument(
            (args as { id: string }).id,
            args as { client_email?: string; message?: string }
          );
          return {
            content: [
              {
                type: "text",
                text: `Document sent successfully to ${(result as Record<string, any>).recipient_email}\nSent at: ${(result as Record<string, any>).sent_at}`,
              },
            ],
          };

        // Clients
        case "list_clients":
          result = await client.listClients(
            (args as { search?: string }).search
          );
          return {
            content: [
              {
                type: "text",
                text: formatClientList(result),
              },
            ],
          };

        case "get_client":
          result = await client.getClient((args as { id: string }).id);
          return {
            content: [
              {
                type: "text",
                text: formatClient(result),
              },
            ],
          };

        case "create_client":
          result = await client.createClient(
            args as { name: string; email: string; company?: string }
          );
          return {
            content: [
              {
                type: "text",
                text: `Client created successfully:\nID: ${(result as Record<string, any>).id}\nName: ${(result as Record<string, any>).name}\nEmail: ${(result as Record<string, any>).email}`,
              },
            ],
          };

        // Templates
        case "list_templates":
          result = await client.listTemplates(
            args as { type?: string; category?: string }
          );
          return {
            content: [
              {
                type: "text",
                text: formatTemplateList(result),
              },
            ],
          };

        case "get_template":
          result = await client.getTemplate((args as { id: string }).id);
          return {
            content: [
              {
                type: "text",
                text: formatTemplate(result),
              },
            ],
          };

        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      return {
        content: [
          {
            type: "text",
            text: `Error: ${errorMessage}`,
          },
        ],
        isError: true,
      };
    }
  }
);

// ============================================================
// Resource Handlers
// ============================================================

const RESOURCES: ResourceTemplate[] = [
  {
    uri: "scopepad://profile",
    name: "Freelancer Profile",
    description: "Your profile, tier, and account information",
    mimeType: "text/plain",
  },
  {
    uri: "scopepad://clients",
    name: "Clients Directory",
    description: "Summary of all clients in your workspace",
    mimeType: "text/plain",
  },
  {
    uri: "scopepad://dashboard",
    name: "Dashboard",
    description:
      "Business overview: active clients, documents by status, recent activity",
    mimeType: "text/plain",
  },
];

server.setRequestHandler(
  ListResourcesRequest,
  async () => ({
    resources: RESOURCES,
  })
);

server.setRequestHandler(
  ReadResourceRequest,
  async (request: ReadResourceRequest) => {
    const { uri } = request;

    try {
      if (uri === "scopepad://profile") {
        const profile = await client.getProfile();
        return {
          contents: [
            {
              uri,
              mimeType: "text/plain",
              text: formatProfile(profile),
            },
          ],
        };
      }

      if (uri === "scopepad://clients") {
        const clients = await client.listClients();
        return {
          contents: [
            {
              uri,
              mimeType: "text/plain",
              text: formatClientList(clients),
            },
          ],
        };
      }

      if (uri === "scopepad://dashboard") {
        const dashboard = await client.getDashboard();
        return {
          contents: [
            {
              uri,
              mimeType: "text/plain",
              text: formatDashboard(dashboard),
            },
          ],
        };
      }

      throw new Error(`Unknown resource: ${uri}`);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      return {
        contents: [
          {
            uri,
            mimeType: "text/plain",
            text: `Error loading resource: ${errorMessage}`,
          },
        ],
      };
    }
  }
);

// ============================================================
// Formatters
// ============================================================

function formatProfile(profile: Record<string, any>): string {
  return `
=== Your ScopePad Profile ===
Name: ${profile.name || "N/A"}
Email: ${profile.email || "N/A"}
Tier: ${profile.tier || "N/A"}
Company: ${profile.company || "N/A"}
Hourly Rate: $${profile.hourly_rate || "N/A"}
Total Clients: ${profile.total_clients || 0}
Active Projects: ${profile.active_projects || 0}
Lifetime Revenue: $${profile.lifetime_revenue || 0}
Joined: ${profile.created_at || "N/A"}
`.trim();
}

function formatDashboard(dashboard: Record<string, any>): string {
  const stats = dashboard.stats || {};
  const recent = dashboard.recent_activity || [];

  let text = `
=== Your ScopePad Dashboard ===
Active Clients: ${stats.active_clients || 0}
Total Documents: ${stats.total_documents || 0}
Documents by Status:
  - Draft: ${stats.draft_count || 0}
  - Sent: ${stats.sent_count || 0}
  - Approved: ${stats.approved_count || 0}
  - Rejected: ${stats.rejected_count || 0}

Recent Activity (last 5):
`;

  if (Array.isArray(recent) && recent.length > 0) {
    recent.slice(0, 5).forEach((activity: any) => {
      text += `  - ${activity.action} on "${activity.document_title}" (${activity.created_at})\n`;
    });
  } else {
    text += "  (No recent activity)\n";
  }

  return text.trim();
}

function formatDocumentList(result: Record<string, any>): string {
  const documents = result.data || [];

  if (documents.length === 0) {
    return "No documents found.";
  }

  let text = `Found ${documents.length} document(s):\n\n`;
  documents.forEach((doc: any, idx: number) => {
    text += `${idx + 1}. ${doc.title} (${doc.type})\n`;
    text += `   ID: ${doc.id}\n`;
    text += `   Status: ${doc.status}\n`;
    text += `   Client: ${doc.client_id ? `ID ${doc.client_id}` : "Unassigned"}\n`;
    text += `   Updated: ${doc.updated_at}\n\n`;
  });

  return text.trim();
}

function formatDocument(doc: Record<string, any>): string {
  let text = `
=== Document: ${doc.title} ===
ID: ${doc.id}
Type: ${doc.type}
Status: ${doc.status}
Client: ${doc.client_id ? `ID ${doc.client_id}` : "Unassigned"}
Template: ${doc.template_id || "None"}
Version: ${doc.version || 1}
AI Generated: ${doc.ai_generated ? "Yes" : "No"}

Created: ${doc.created_at}
Updated: ${doc.updated_at}
${doc.sent_at ? `Sent: ${doc.sent_at}\n` : ""}${doc.approved_at ? `Approved: ${doc.approved_at}\n` : ""}

Content Preview:
${JSON.stringify(doc.content, null, 2).substring(0, 500)}...

Metadata:
${JSON.stringify(doc.metadata || {}, null, 2)}

Lineage: ${doc.lineage_chain && doc.lineage_chain.length > 0 ? doc.lineage_chain.join(" → ") : "Root document"}
`.trim();

  return text;
}

function formatClientList(result: Record<string, any>): string {
  const clients = result.data || result;

  if (
    !Array.isArray(clients) ||
    clients.length === 0
  ) {
    return "No clients found.";
  }

  let text = `Found ${clients.length} client(s):\n\n`;
  clients.forEach((c: any, idx: number) => {
    text += `${idx + 1}. ${c.name}\n`;
    text += `   ID: ${c.id}\n`;
    text += `   Email: ${c.email}\n`;
    text += `   Company: ${c.company || "N/A"}\n`;
    text += `   Documents: ${c.document_count || 0}\n`;
    text += `   Added: ${c.created_at}\n\n`;
  });

  return text.trim();
}

function formatClient(client: Record<string, any>): string {
  const docs = client.documents || [];

  let text = `
=== Client: ${client.name} ===
ID: ${client.id}
Email: ${client.email}
Company: ${client.company || "N/A"}
Total Documents: ${client.document_count || docs.length || 0}
Added: ${client.created_at}

Documents:
`;

  if (docs.length > 0) {
    docs.slice(0, 10).forEach((doc: any) => {
      text += `  - ${doc.title} (${doc.type}, ${doc.status})\n`;
    });
    if (docs.length > 10) {
      text += `  ... and ${docs.length - 10} more\n`;
    }
  } else {
    text += "  (No documents yet)\n";
  }

  return text.trim();
}

function formatTemplateList(result: Record<string, any>): string {
  const templates = result.data || result;

  if (!Array.isArray(templates) || templates.length === 0) {
    return "No templates available for your tier.";
  }

  let text = `Found ${templates.length} template(s):\n\n`;
  templates.forEach((t: any, idx: number) => {
    text += `${idx + 1}. ${t.name}\n`;
    text += `   ID: ${t.id}\n`;
    text += `   Type: ${t.type}\n`;
    text += `   Category: ${t.category}\n`;
    text += `   Sections: ${t.sections?.length || 0}\n`;
    text += `   Tier: ${t.tier_required}\n\n`;
  });

  return text.trim();
}

function formatTemplate(template: Record<string, any>): string {
  const sections = template.sections || [];

  let text = `
=== Template: ${template.name} ===
ID: ${template.id}
Type: ${template.type}
Category: ${template.category}
Tier: ${template.tier_required}
Description: ${template.description}

Sections (${sections.length}):
`;

  sections.forEach((section: any) => {
    text += `
  • ${section.label} (${section.key})
    Type: ${section.type}
    Required: ${section.required ? "Yes" : "No"}
    Placeholder: ${section.placeholder}
    AI Prompt: ${section.ai_prompt}`;
  });

  text += `

Styling:
  Header Style: ${template.styling?.header_style || "N/A"}
  Font: ${template.styling?.font_family || "N/A"}
  Logo: ${template.styling?.show_logo ? "Yes" : "No"}

Default Export Format: ${template.default_file_type || "PDF"}
`;

  return text.trim();
}

// ============================================================
// Server Startup
// ============================================================

async function main() {
  const transport = new StdioServerTransport();

  server.setRequestHandler(
    (request: any) => {
      // Log requests for debugging
      if (process.env.DEBUG) {
        console.error(`[MCP] Received: ${request.method}`);
      }
      return undefined;
    }
  );

  // Register all tools
  server.tool("list_documents", TOOLS[0]);
  server.tool("get_document", TOOLS[1]);
  server.tool("create_document", TOOLS[2]);
  server.tool("update_document", TOOLS[3]);
  server.tool("derive_document", TOOLS[4]);
  server.tool("export_document", TOOLS[5]);
  server.tool("send_document", TOOLS[6]);
  server.tool("list_clients", TOOLS[7]);
  server.tool("get_client", TOOLS[8]);
  server.tool("create_client", TOOLS[9]);
  server.tool("list_templates", TOOLS[10]);
  server.tool("get_template", TOOLS[11]);

  // Connect transport
  await server.connect(transport);

  if (process.env.DEBUG) {
    console.error("[MCP] ScopePad MCP server started");
    console.error(`[MCP] API Key: ${apiKey.substring(0, 10)}...`);
  }
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
