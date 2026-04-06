# Deep Garden

A cloud-native knowledge graph where your notes live as creatures in a 2D terrarium. They auto-link, auto-tag, synthesize, and organize themselves.

**Your notes are alive.**

## Getting Started

```bash
npm install
npm run dev
```

Set up `.env.local` with:
```
NEXT_PUBLIC_SUPABASE_URL=your-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-key
```

Run the Supabase migration in `supabase/migrations/` to set up the database schema.

## Tech Stack

Next.js 16 / React 19 / Supabase (Postgres + pgvector) / Tiptap / Tailwind v4

## Business Model

BYOT (Bring Your Own Tokens) — users provide their own Anthropic/OpenAI API keys. $10/mo Pro tier planned.

## Status

Terrarium v1 — graph view, sidebar, automations (prebuilt + custom), BYOT settings, embeddings, auto-link engine.
