/**
 * Prebuilt automation templates — solid prompts users can use as-is or customize.
 * Each template ships pre-filled but editable.
 */

export type AutomationTemplate = {
  key: string;
  name: string;
  description: string;
  prompt: string;
  schedule: string;
  category: 'organize' | 'create' | 'research' | 'maintain';
  icon: string; // lucide icon name
  tier: 'free' | 'pro';
};

export const AUTOMATION_TEMPLATES: AutomationTemplate[] = [
  // === ORGANIZE ===
  {
    key: 'auto_link',
    name: 'Auto-Link Discovery',
    description: 'Find hidden connections between notes and suggest new links based on content overlap, shared concepts, and thematic relationships.',
    prompt: `You are a knowledge graph assistant. You have access to the user's notes below.

Your task: Find notes that should be linked but aren't. Look for:
- Notes that discuss the same concept, person, project, or idea
- Notes where one provides context or background for another
- Notes that contradict each other (link with context "contradicts")
- Notes that are sequential (part 1/part 2 of an idea)

For each suggested link, respond with a JSON array:
[
  {
    "source_title": "exact title of source note",
    "target_title": "exact title of target note",
    "reason": "one sentence explaining why these should be linked",
    "strength": 0.0-1.0
  }
]

Only suggest links with strength >= 0.7. Max 10 suggestions per run.
Be conservative — a bad link is worse than a missing one.

NOTES:
{{notes}}`,
    schedule: 'daily_8am',
    category: 'organize',
    icon: 'Link',
    tier: 'free',
  },
  {
    key: 'auto_tag',
    name: 'Auto-Tag Classification',
    description: 'Read your notes and apply consistent tags based on content. Discovers your taxonomy instead of requiring predefined categories.',
    prompt: `You are a knowledge classifier. You have access to the user's notes and their existing tags.

Your task: Review untagged or under-tagged notes and suggest tags. Rules:
- Reuse existing tags when they fit (consistency > novelty)
- Create new tags only when no existing tag covers the concept
- Use lowercase, hyphenated tags (e.g. "machine-learning", "project-ideas", "meeting-notes")
- Assign 1-3 tags per note, never more
- Skip notes that are already well-tagged

Existing tags in use: {{existing_tags}}

Respond with a JSON array:
[
  {
    "note_title": "exact title of the note",
    "tags": ["tag-one", "tag-two"],
    "reasoning": "brief explanation"
  }
]

NOTES:
{{notes}}`,
    schedule: 'on_create',
    category: 'organize',
    icon: 'Tags',
    tier: 'free',
  },
  {
    key: 'auto_reorganize',
    name: 'Cluster Reorganization',
    description: 'Analyze your graph structure and suggest how notes should be reorganized into better clusters as your understanding evolves.',
    prompt: `You are a knowledge architect. You have access to the user's notes, their current tags, and links.

Your task: Analyze the graph and suggest reorganization:
- Identify notes that seem miscategorized or orphaned
- Suggest cluster merges (two topics that are really one)
- Suggest cluster splits (one topic that's really two)
- Flag notes that are "bridge" notes connecting disparate clusters
- Suggest renames for clusters that have outgrown their original label

Respond with a JSON object:
{
  "cluster_suggestions": [
    { "action": "merge|split|rename", "details": "..." }
  ],
  "orphaned_notes": [
    { "note_title": "...", "suggested_cluster": "..." }
  ],
  "bridge_notes": [
    { "note_title": "...", "connects": ["cluster-a", "cluster-b"] }
  ]
}

Current graph state:
{{graph_summary}}

NOTES:
{{notes}}`,
    schedule: 'monthly_1st',
    category: 'organize',
    icon: 'GitBranch',
    tier: 'pro',
  },

  // === CREATE ===
  {
    key: 'synthesis',
    name: 'Note Synthesis',
    description: 'Find pairs of notes with enough overlap and complementary information, then generate new synthesized notes combining their insights.',
    prompt: `You are a knowledge synthesizer. You have access to the user's notes.

Your task: Find 1-3 opportunities where two or more existing notes can be synthesized into a new insight that neither note contains alone. Look for:
- Notes that approach the same topic from different angles
- Notes where combining information reveals a pattern
- Notes that, together, suggest a conclusion neither reaches alone

For each synthesis, respond with:
[
  {
    "parent_titles": ["note A title", "note B title"],
    "new_title": "suggested title for synthesis note",
    "content": "the actual synthesized content in markdown (2-4 paragraphs)",
    "insight": "one sentence describing what's new that wasn't in either parent"
  }
]

Quality bar: Only synthesize if the result is genuinely novel. Don't just concatenate.

NOTES:
{{notes}}`,
    schedule: 'daily_9pm',
    category: 'create',
    icon: 'Sparkles',
    tier: 'pro',
  },
  {
    key: 'research',
    name: 'Deep Research',
    description: 'Point this at any topic and it will create detailed, well-structured notes based on current knowledge. "Go research lizards."',
    prompt: `You are a research assistant writing notes for a personal knowledge base.

Your task: Research the topic below and create 1-3 well-structured markdown notes. Each note should:
- Have a clear, specific title (not just the topic name)
- Be 200-500 words of substantive content
- Include specific facts, dates, numbers, names — not vague overviews
- Use [[wiki-links]] to reference concepts that the user might already have notes about
- End with 2-3 "related questions" that could become future research prompts

Topic to research: {{custom_input}}

Existing note titles (use [[wiki-links]] to these where relevant): {{note_titles}}

Respond with a JSON array:
[
  {
    "title": "note title",
    "content": "full markdown content with [[wiki-links]]",
    "tags": ["relevant-tag-1", "relevant-tag-2"]
  }
]

Write like a knowledgeable friend explaining to a smart person, not like a textbook.`,
    schedule: 'manual',
    category: 'research',
    icon: 'Telescope',
    tier: 'pro',
  },
  {
    key: 'expand_note',
    name: 'Expand & Enrich',
    description: 'Find thin notes that need more detail and expand them with real information, examples, and connections.',
    prompt: `You are a knowledge enrichment assistant. You have access to the user's notes.

Your task: Find 1-3 notes that are thin (under 100 words, or lacking detail) but cover important topics, and expand them. For each:
- Add substantive detail: specific facts, examples, explanations
- Add [[wiki-links]] to other relevant notes in the vault
- Maintain the author's voice and framing — expand, don't rewrite
- Add a "## See also" section at the bottom if relevant

Respond with:
[
  {
    "note_title": "exact title of the note to expand",
    "original_length": 45,
    "expanded_content": "the full expanded markdown content",
    "what_was_added": "brief description of what you added"
  }
]

Only expand notes where you can add genuinely useful information. Don't pad.

NOTES:
{{notes}}`,
    schedule: 'weekly_sunday',
    category: 'create',
    icon: 'Maximize2',
    tier: 'pro',
  },

  // === RESEARCH ===
  {
    key: 'gap_detection',
    name: 'Knowledge Gap Detection',
    description: 'Analyze your graph for missing knowledge — topics referenced but never explained, clusters with thin coverage, obvious holes.',
    prompt: `You are a knowledge gap analyst. You have access to the user's notes and links.

Your task: Find gaps in the knowledge graph. Look for:
1. **Referenced but missing**: Concepts mentioned in notes (especially in [[wiki-links]]) that don't have their own note
2. **Thin clusters**: Topic areas with only 1-2 notes that deserve deeper coverage
3. **Missing bridges**: Clusters that should be connected but aren't
4. **Stale areas**: Topics where the notes are old and the field has likely changed

Respond with:
{
  "missing_notes": [
    { "concept": "name", "referenced_in": ["note title 1", "note title 2"], "priority": "high|medium|low" }
  ],
  "thin_areas": [
    { "topic": "name", "existing_notes": 2, "suggested_notes": ["title 1", "title 2"] }
  ],
  "missing_bridges": [
    { "cluster_a": "name", "cluster_b": "name", "why_connect": "reason" }
  ]
}

Prioritize gaps that would make the biggest impact on the graph's usefulness.

NOTES:
{{notes}}`,
    schedule: 'monthly_1st',
    category: 'research',
    icon: 'CircleDashed',
    tier: 'pro',
  },

  // === MAINTAIN ===
  {
    key: 'stale_detection',
    name: 'Stale Note Cleanup',
    description: 'Find notes that are outdated, duplicated, or no longer relevant. Suggests archiving, merging, or updating.',
    prompt: `You are a knowledge garden maintainer. You have access to the user's notes with their timestamps.

Your task: Identify notes that need attention:
1. **Stale**: Notes not updated in 90+ days that reference time-sensitive topics
2. **Duplicates**: Notes covering the same topic that should be merged
3. **Contradictions**: Notes that make conflicting claims
4. **Empty/stub**: Notes with less than 20 words that are just placeholders

Respond with:
{
  "stale": [
    { "note_title": "...", "last_updated": "...", "reason": "why it's stale", "action": "update|archive" }
  ],
  "duplicates": [
    { "notes": ["title 1", "title 2"], "suggested_merge_title": "..." }
  ],
  "contradictions": [
    { "note_a": "...", "note_b": "...", "conflict": "description of conflict" }
  ],
  "stubs": [
    { "note_title": "...", "action": "expand|archive" }
  ]
}

Be conservative with archive recommendations. When in doubt, suggest "update" not "archive".

NOTES:
{{notes}}`,
    schedule: 'weekly_monday',
    category: 'maintain',
    icon: 'Leaf',
    tier: 'free',
  },
  {
    key: 'daily_digest',
    name: 'Daily Knowledge Digest',
    description: 'Morning briefing of what happened in your garden — new links, suggestions, what needs attention today.',
    prompt: `You are a garden briefing assistant. Summarize the state of the knowledge garden.

Your task: Create a concise daily digest covering:
1. **New since yesterday**: Notes created or significantly updated in the last 24 hours
2. **Connections formed**: New links (auto or manual) since yesterday
3. **Needs attention**: Notes flagged as stale, thin, or contradicting
4. **Today's suggestion**: One specific, actionable thing the user could do to improve their garden (e.g. "Your notes on X and Y are closely related but not linked — consider connecting them")

Keep it under 200 words. Write it conversational, not like a report.
Start with a one-line summary like "Your garden grew by 3 notes yesterday. 2 new connections formed."

Respond with:
{
  "digest_title": "Daily Digest — April 5, 2026",
  "content": "the full digest in markdown",
  "highlight": "the single most important thing to surface"
}

NOTES (recent activity):
{{notes}}`,
    schedule: 'daily_8am',
    category: 'maintain',
    icon: 'Newspaper',
    tier: 'pro',
  },
  {
    key: 'link_review',
    name: 'Link Quality Review',
    description: 'Review existing links — strengthen good ones, flag weak ones, remove connections that no longer make sense.',
    prompt: `You are a link quality reviewer. You have access to the user's notes and their current links.

Your task: Review the links in the graph and assess their quality:
1. **Strong links**: Links where the connection is clear and meaningful — confirm these
2. **Weak links**: Links where the connection is tenuous or outdated — suggest removal
3. **Missing context**: Links that exist but have no explanation — suggest adding context
4. **Wrong direction**: Links where the relationship would be better described differently

Respond with:
{
  "remove": [
    { "source": "note title", "target": "note title", "reason": "why this link is bad" }
  ],
  "add_context": [
    { "source": "note title", "target": "note title", "suggested_context": "..." }
  ],
  "new_links": [
    { "source": "note title", "target": "note title", "reason": "why these should be linked" }
  ]
}

Be conservative with removals. Only remove links that are clearly wrong or meaningless.

CURRENT LINKS:
{{links}}

NOTES:
{{notes}}`,
    schedule: 'daily_8am',
    category: 'maintain',
    icon: 'Unlink',
    tier: 'free',
  },
];

export const SCHEDULE_OPTIONS = [
  { value: 'manual', label: 'Manual only', description: 'Run on demand' },
  { value: 'on_create', label: 'On note create', description: 'Runs when you create a new note' },
  { value: 'on_update', label: 'On note update', description: 'Runs when you edit a note' },
  { value: 'daily_8am', label: 'Daily at 8am', description: 'Runs every morning' },
  { value: 'daily_9pm', label: 'Daily at 9pm', description: 'Runs every evening' },
  { value: 'weekly_monday', label: 'Weekly (Monday)', description: 'Runs every Monday morning' },
  { value: 'weekly_sunday', label: 'Weekly (Sunday)', description: 'Runs every Sunday evening' },
  { value: 'monthly_1st', label: 'Monthly (1st)', description: 'Runs on the 1st of each month' },
];

export const CATEGORY_META = {
  organize: { label: 'Organize', color: '#7c6fe0' },
  create: { label: 'Create', color: '#4ade80' },
  research: { label: 'Research', color: '#e0a86f' },
  maintain: { label: 'Maintain', color: '#4a9ead' },
};
