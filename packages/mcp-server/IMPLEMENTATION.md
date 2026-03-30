# ScopePad MCP Server — Implementation Guide

## Overview

The MCP server package (`@scopepad/mcp-server`) exposes the ScopePad REST API as Model Context Protocol tools and resources. It runs as a Node.js CLI tool via stdio transport, compatible with Claude Desktop and Cursor.

**Package location:** `/packages/mcp-server/`

## Architecture

### Files

| File | Purpose |
|------|---------|
| `src/index.ts` | Main MCP server entry point with shebang for CLI usage |
| `src/api-client.ts` | HTTP client wrapper for ScopePad REST API calls |
| `package.json` | npm package metadata; bin entry for `scopepad-mcp` |
| `tsconfig.json` | TypeScript config (ES2022 output to dist/) |
| `README.md` | User-facing documentation |

### Flow

```
Claude Desktop / Cursor
        ↓
MCP Protocol (stdio)
        ↓
index.ts (McpServer)
        ├─ Registers 12 tools
        ├─ Registers 3 resources
        └─ Handles CallToolRequest, ListResourcesRequest, ReadResourceRequest
        ↓
api-client.ts (ScopepadClient)
        ↓
Fetch HTTP to ScopePad API
        ↓
REST endpoints: /api/v1/documents, /api/v1/clients, /api/v1/templates
```

## Tools (12 total)

### Document Tools (7)

1. **list_documents** — Filter by type, status, client_id, limit
2. **get_document** — Full content + metadata + lineage
3. **create_document** — New doc with type, title, content, optional parent/template/client
4. **update_document** — Modify title, content, status, metadata, client_id
5. **derive_document** — Create child doc from parent (propagates lineage)
6. **export_document** — PDF/DOCX export with download URL
7. **send_document** — Email to client with optional message

### Client Tools (3)

8. **list_clients** — All clients with optional search
9. **get_client** — Client details + document history
10. **create_client** — Add new client (name, email, company)

### Template Tools (2)

11. **list_templates** — Filter by type or category
12. **get_template** — Full schema with sections, AI prompts, styling

## Resources (3)

- **scopepad://profile** — Freelancer profile, tier, stats
- **scopepad://clients** — Client directory summary
- **scopepad://dashboard** — Active clients, doc counts by status, recent activity

## API Client

The `ScopepadClient` class in `api-client.ts`:

- **Constructor:** `new ScopepadClient(apiKey: string, baseUrl?: string)`
- **Auth:** All requests include `Authorization: Bearer ${apiKey}` header
- **Error handling:** Throws descriptive errors with HTTP status
- **Methods:** One for each REST endpoint (see code)

Example usage:
```typescript
const client = new ScopepadClient(process.env.SCOPEPAD_API_KEY);
const documents = await client.listDocuments({ status: 'draft', limit: 10 });
```

## Server Initialization

In `index.ts`:

1. Read `SCOPEPAD_API_KEY` from environment
2. Create `ScopepadClient` instance
3. Create `McpServer` with name & version
4. Register all 12 tools with input schemas
5. Register 3 resources with read handlers
6. Connect `StdioServerTransport` for stdio IPC
7. Start server (blocks until client disconnects)

## Input Schemas

All tools use JSON Schema for input validation. Example:

```typescript
{
  type: "object",
  properties: {
    id: { type: "string", description: "Document ID" },
    status: { type: "string", description: "draft | sent | approved" }
  },
  required: ["id"]
}
```

## Output Formatting

Tool responses are formatted as readable text for LLMs:

- **Document list:** Tabular with ID, type, status, client, date
- **Client list:** Name, email, company, doc count, added date
- **Dashboard:** Stats + recent activity list
- **Error:** Prefixed with "Error: " and marked `isError: true`

## Configuration

Users configure this in Claude Desktop / Cursor:

```json
{
  "mcpServers": {
    "scopepad": {
      "command": "npx",
      "args": ["@scopepad/mcp-server"],
      "env": {
        "SCOPEPAD_API_KEY": "sp_..."
      }
    }
  }
}
```

## Building & Publishing

```bash
# Build TypeScript to dist/
npm run build

# Test locally
SCOPEPAD_API_KEY=sp_test_xxx npx tsx src/index.ts

# Publish to npm (prepublishOnly script runs tsc)
npm publish
```

The `bin` entry in package.json points `scopepad-mcp` command to `dist/index.js` with shebang.

## Pro+ Tier Requirement

This server is **Pro+ only**. The README, package metadata, and tool descriptions all reinforce this.

## Security

- API keys stored only in local environment variables
- No keys logged or transmitted beyond the MCP server → ScopePad API boundary
- All communication via HTTPS to app.scopepad.com
- Permissions controlled by API key settings in ScopePad

## Testing

To test locally without publishing:

```bash
# From packages/mcp-server/
npm run build
SCOPEPAD_API_KEY=sp_test_xxx node dist/index.js

# In Claude Desktop, add this instead of npx:
"command": "node",
"args": ["/path/to/packages/mcp-server/dist/index.js"]
```

## Future Enhancements

Potential additions:
- Batch operations (create multiple docs at once)
- Webhook notifications (when doc sent/approved)
- Document version comparison
- AI-powered section generation
- Permission scoping per API key
- Rate limiting / quota info
