# @scopepad/mcp-server

Connect your AI agent to ScopePad — the freelance workspace for proposals, invoices, contracts, and more.

This MCP server exposes ScopePad's REST API as tools & resources for Claude Desktop, Cursor, and other AI agents.

## Requirements

- **ScopePad Pro+ subscription** (MCP server available to Pro+ members only)
- Node.js 18+
- SCOPEPAD_API_KEY environment variable

## Installation

```bash
npm install -g @scopepad/mcp-server
```

## Usage

### Claude Desktop

Add to your `claude_desktop_config.json` (usually `~/.claude/claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "scopepad": {
      "command": "npx",
      "args": ["@scopepad/mcp-server"],
      "env": {
        "SCOPEPAD_API_KEY": "your-api-key-here"
      }
    }
  }
}
```

### Cursor

Add to your `.cursor/mcp_config.json` or Cursor settings:

```json
{
  "mcpServers": {
    "scopepad": {
      "command": "npx",
      "args": ["@scopepad/mcp-server"],
      "env": {
        "SCOPEPAD_API_KEY": "your-api-key-here"
      }
    }
  }
}
```

## Available Tools

### Documents
- **list_documents** — Filter documents by type, status, client, or date
- **get_document** — Fetch full content, metadata, and version history
- **create_document** — Create new proposals, invoices, SOWs, contracts, or briefs
- **update_document** — Update content, status, client assignment, or metadata
- **derive_document** — Create child documents from parent (brief → SOW → proposal)
- **export_document** — Generate PDF or DOCX export
- **send_document** — Send to client for review, approval, or signing

### Clients
- **list_clients** — View all clients with optional search
- **get_client** — Get client details with document history
- **create_client** — Add a new client to your workspace

### Templates
- **list_templates** — Browse available templates for your tier
- **get_template** — Get template details with section schema and AI prompts

### Resources
- **scopepad://profile** — Your profile, tier, account info
- **scopepad://clients** — Directory of all clients
- **scopepad://dashboard** — Business overview (active clients, document stats, recent activity)

## Getting Your API Key

1. Log in to [ScopePad](https://app.scopepad.com)
2. Go to **Settings → API Keys**
3. Click **Generate New Key**
4. Name it (e.g., "Claude Desktop")
5. Copy the full key immediately (you won't see it again)
6. Save it securely in your environment

## Examples

Ask Claude or Cursor:

- _"List my recent proposals"_
- _"Create an invoice for Acme Corp for the design work"_
- _"Show me the status of all client documents"_
- _"Create a contract based on my proposal for Widget Co"_
- _"Export the latest proposal to PDF"_
- _"Send the SOW to john@acmecorp.com"_

## Security

- API keys are stored only in your local environment — never transmitted to Anthropic
- The MCP server runs locally on your machine
- All requests go directly to ScopePad (https://app.scopepad.com)
- Permissions are controlled via your API key settings in ScopePad

## Troubleshooting

### MCP server won't start
- Check that `SCOPEPAD_API_KEY` is set
- Verify the API key is valid (hasn't expired)
- Try `npx @scopepad/mcp-server` manually to see error messages

### "API key not found" error
- Get a fresh API key from ScopePad settings
- Make sure it's copied completely (no extra spaces)
- Check the environment variable name is exactly `SCOPEPAD_API_KEY`

### Tool calls are slow
- The server makes direct API requests to ScopePad
- Check your internet connection
- ScopePad API may be under load; try again in a moment

## Development

```bash
# Clone the repo
git clone https://github.com/scopepad/mcp-server.git
cd mcp-server

# Install dependencies
npm install

# Build
npm run build

# Test locally
SCOPEPAD_API_KEY=sp_test_xxx npx tsx src/index.ts
```

## License

MIT

## Support

- Docs: [ScopePad Help](https://help.scopepad.com)
- Email: support@scopepad.com
