# @terrarium/mcp-server

Connect your AI agent to Knowledge Terrarium — your self-organizing knowledge graph.

This MCP server exposes the Terrarium REST API as tools for Claude Desktop, Cursor, and other AI agents.

## Requirements

- Node.js 18+
- `TERRARIUM_API_KEY` environment variable

## Usage

### Claude Desktop

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "terrarium": {
      "command": "npx",
      "args": ["@terrarium/mcp-server"],
      "env": {
        "TERRARIUM_API_KEY": "your-api-key-here"
      }
    }
  }
}
```

## Available Tools

- **list_notes** — List notes with pagination
- **get_note** — Get a single note by ID
- **create_note** — Create a new note
- **update_note** — Update a note's title or content
- **delete_note** — Archive (soft-delete) a note
- **search_notes** — Full-text search across notes

## Development

```bash
cd packages/mcp-server
npm install
npm run build
TERRARIUM_API_KEY=your-key npx tsx src/index.ts
```

## License

MIT
