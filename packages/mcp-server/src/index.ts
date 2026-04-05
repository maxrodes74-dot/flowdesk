#!/usr/bin/env node

/**
 * Knowledge Terrarium MCP Server
 * Exposes the Terrarium REST API as Model Context Protocol tools
 * Transport: stdio (Claude Desktop, Cursor)
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { TerrariumClient } from './api-client.js';

// ============================================================
// Initialization
// ============================================================

const apiKey = process.env.TERRARIUM_API_KEY;
if (!apiKey) {
  console.error('Error: TERRARIUM_API_KEY environment variable is not set');
  process.exit(1);
}

const baseUrl = process.env.TERRARIUM_BASE_URL || 'http://localhost:3000';
const client = new TerrariumClient(apiKey, baseUrl);

const server = new McpServer({
  name: 'terrarium-mcp',
  version: '0.1.0',
});

// ============================================================
// Tools
// ============================================================

server.tool(
  'list_notes',
  'List notes from your Knowledge Terrarium, with optional pagination',
  {
    limit: z.number().optional().describe('Max notes to return (default 50, max 100)'),
    offset: z.number().optional().describe('Offset for pagination'),
  },
  async ({ limit, offset }) => {
    const result = await client.listNotes({ limit, offset });
    return {
      content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
    };
  }
);

server.tool(
  'get_note',
  'Get a single note by ID with full content',
  {
    id: z.string().describe('Note ID (UUID)'),
  },
  async ({ id }) => {
    const note = await client.getNote(id);
    return {
      content: [{ type: 'text', text: JSON.stringify(note, null, 2) }],
    };
  }
);

server.tool(
  'create_note',
  'Create a new note in your Knowledge Terrarium',
  {
    title: z.string().describe('Note title'),
    content: z.string().optional().describe('Note content (HTML or plain text)'),
  },
  async ({ title, content }) => {
    const note = await client.createNote({ title, content });
    return {
      content: [{ type: 'text', text: `Note created: ${note.id}\nTitle: ${note.title}` }],
    };
  }
);

server.tool(
  'update_note',
  'Update an existing note',
  {
    id: z.string().describe('Note ID (UUID)'),
    title: z.string().optional().describe('New title'),
    content: z.string().optional().describe('New content'),
  },
  async ({ id, title, content }) => {
    const note = await client.updateNote(id, { title, content });
    return {
      content: [{ type: 'text', text: `Note updated: ${note.id}\nTitle: ${note.title}` }],
    };
  }
);

server.tool(
  'delete_note',
  'Archive (soft-delete) a note',
  {
    id: z.string().describe('Note ID (UUID)'),
  },
  async ({ id }) => {
    await client.deleteNote(id);
    return {
      content: [{ type: 'text', text: `Note ${id} archived successfully` }],
    };
  }
);

server.tool(
  'search_notes',
  'Search notes by title or content',
  {
    query: z.string().describe('Search query'),
  },
  async ({ query }) => {
    const results = await client.searchNotes(query);
    return {
      content: [{ type: 'text', text: JSON.stringify(results, null, 2) }],
    };
  }
);

// ============================================================
// Server Startup
// ============================================================

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);

  if (process.env.DEBUG) {
    console.error('[MCP] Knowledge Terrarium MCP server started');
  }
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
