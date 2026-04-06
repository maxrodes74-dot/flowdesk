# Deep Garden

AI-native, self-organizing knowledge graph. Notes are living creatures in a digital terrarium.

## Tech Stack
- **Framework:** Next.js 16 / React 19 (App Router, Turbopack)
- **Database:** Supabase (Postgres + pgvector + Auth + RLS)
- **Editor:** Tiptap (ProseMirror-based, markdown-first)
- **Graph viz:** react-force-graph-2d with custom Canvas 2D creature rendering
- **Styling:** Tailwind v4 with CSS custom properties (dark theme)
- **Hosting:** Vercel (terrarium-v1 branch) + Supabase
- **BYOT:** Users bring their own Anthropic/OpenAI API keys

## Project Structure
```
src/app/                — Next.js pages (app router)
src/app/garden/         — Main terrarium view (authenticated)
src/app/garden/automations/ — Automation manager (templates + custom)
src/app/garden/settings/    — BYOT key management, provider/model picker
src/app/api/            — API routes (notes, automations, settings, graph, search, embeddings)
src/app/(auth)/         — Auth pages (login, signup, forgot-password)
src/components/         — React components (terrarium, sidebar, toolbar, editor)
src/lib/                — Shared utilities, Supabase clients, auth context
src/lib/models.ts       — Single source of truth for valid LLM model IDs
src/lib/byot.ts         — BYOT key retrieval and LLM call wrappers
src/lib/automation-engine.ts — Automation execution (context building, LLM calls, result parsing)
src/lib/automation-templates.ts — 10 prebuilt automation templates
src/lib/embeddings.ts   — OpenAI text-embedding-3-small pipeline
supabase/               — Migrations
```

## Key Patterns
- Server components by default, "use client" only where needed
- Supabase server client: `@/lib/supabase/server` (for API routes, server components)
- Supabase browser client: `@/lib/supabase/client` (for client components)
- Auth context: `@/lib/auth-context` (useAuth hook)
- All tables have RLS enabled — user isolation by default
- Dark theme via CSS custom properties (--color-background, --color-surface, --color-border, --color-foreground, --color-foreground-secondary, --color-accent)
- BYOT keys stored as base64 in profiles.settings.llm_api_key_encrypted
- Model validation via resolveModel() in src/lib/models.ts — never trust raw DB model strings

## Automation System
Two systems coexist:
1. **Sidebar automations** — 9 hardcoded quick-run automations (string IDs like "auto-link", "auto-tag")
2. **DB automations** — Full CRUD via /garden/automations page (UUID IDs, templates, custom prompts, run history)

The API route at /api/automations/[automationId] handles both — uses isUUID() to distinguish.

## Commands
- `npm run dev` — Start dev server
- `npm run build` — Production build
- `npm run lint` — ESLint
- `npm run test` — Vitest

## Database
Schema in `supabase/migrations/`
Core tables: notes, links, tags, profiles, automations, automation_runs
