# Knowledge Terrarium

AI-native, self-organizing knowledge graph. Notes are living entities in a digital ecosystem.

## Tech Stack
- **Framework:** Next.js 15+ / React 19 (App Router)
- **Database:** Supabase (Postgres + pgvector + Auth)
- **Editor:** Tiptap (ProseMirror-based, markdown-first)
- **Graph viz:** react-force-graph-2d (Phase 2)
- **Styling:** Tailwind v4 with CSS custom properties (dark theme)
- **MCP Server:** @modelcontextprotocol/sdk (Phase 3)
- **Hosting:** Vercel + Supabase

## Project Structure
```
src/app/          — Next.js pages (app router)
src/app/garden/   — Main authenticated dashboard
src/app/api/      — API routes (notes CRUD, search)
src/app/(auth)/   — Auth pages (login, signup)
src/components/   — React components
src/lib/          — Shared utilities, Supabase clients, auth context
supabase/         — Migrations
packages/mcp-server/ — MCP server (Phase 3)
```

## Key Patterns
- Server components by default, "use client" only where needed
- Supabase server client: `@/lib/supabase/server` (for API routes, server components)
- Supabase browser client: `@/lib/supabase/client` (for client components)
- Auth context: `@/lib/auth-context` (useAuth hook)
- All tables have RLS enabled — user isolation by default
- Dark theme via CSS custom properties (--bg, --surface, --border, --text, --text-secondary, --accent)

## Commands
- `npm run dev` — Start dev server
- `npm run build` — Production build
- `npm run lint` — ESLint
- `npm run test` — Vitest

## Database
Schema in `supabase/migrations/20260403000000_knowledge_graph_schema.sql`
Core tables: notes, links, tags, api_keys, profiles
