'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Search, Trash2, FileText, Clock, Zap, Play, Check, AlertCircle, Loader2 } from 'lucide-react';
import type { Note } from '@/lib/notes';

export type SidebarPanel = 'notes' | 'automations' | null;

interface LeftSidebarProps {
  activePanel: SidebarPanel;
  onSelectNote: (noteId: string) => void;
  selectedNoteId: string | null;
}

// ─── Utilities ───

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks}w ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

function contentPreview(content: string): string {
  const stripped = content
    .replace(/#{1,6}\s/g, '')
    .replace(/\*\*|__/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/<[^>]+>/g, '')
    .trim();
  if (stripped.length <= 80) return stripped;
  return stripped.slice(0, 80) + '…';
}

// ─── Automation definitions ───

type AutomationStatus = 'idle' | 'running' | 'done' | 'error' | 'no-key';

type Automation = {
  id: string;
  name: string;
  description: string;
  trigger: string;
  requiresKey: boolean;
};

const AUTOMATIONS: Automation[] = [
  {
    id: 'auto-link',
    name: 'Auto-Link',
    description: 'Discover connections between notes via embedding similarity',
    trigger: 'On note create/update',
    requiresKey: false,
  },
  {
    id: 'auto-tag',
    name: 'Auto-Tag',
    description: 'Classify notes and apply tags automatically',
    trigger: 'On note create/update',
    requiresKey: true,
  },
  {
    id: 'synthesis',
    name: 'Synthesis',
    description: 'Generate new notes combining related insights',
    trigger: 'Daily scan',
    requiresKey: true,
  },
  {
    id: 'foraging',
    name: 'Web Enrichment',
    description: 'Search the web for related info to enrich notes',
    trigger: 'Daily (Pro)',
    requiresKey: true,
  },
  {
    id: 'pruning',
    name: 'Decay & Cleanup',
    description: 'Flag stale notes, duplicates, and contradictions',
    trigger: 'Weekly',
    requiresKey: true,
  },
  {
    id: 'reorganize',
    name: 'Auto-Reorganize',
    description: 'Re-cluster and reorganize notes spatially',
    trigger: 'Weekly',
    requiresKey: false,
  },
  {
    id: 'gap-detection',
    name: 'Gap Detection',
    description: 'Find missing connective knowledge in your graph',
    trigger: 'Weekly',
    requiresKey: true,
  },
  {
    id: 'cluster-emergence',
    name: 'Cluster Emergence',
    description: 'Discover and name topic clusters organically',
    trigger: 'Weekly',
    requiresKey: false,
  },
  {
    id: 'digest',
    name: 'Knowledge Digest',
    description: 'Periodic summary of terrarium activity',
    trigger: 'Weekly',
    requiresKey: true,
  },
];

// ─── Main component ───

export default function LeftSidebar({ activePanel, onSelectNote, selectedNoteId }: LeftSidebarProps) {
  const isOpen = activePanel !== null;

  return (
    <div
      className="absolute top-0 left-0 h-full z-30 pointer-events-none"
      style={{ width: '320px' }}
    >
      <div
        className="h-full w-full bg-[var(--color-surface)] border-r border-[var(--color-border)] shadow-2xl flex flex-col pointer-events-auto"
        style={{
          transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {activePanel === 'notes' && (
          <NotesContent
            onSelectNote={onSelectNote}
            selectedNoteId={selectedNoteId}
          />
        )}
        {activePanel === 'automations' && <AutomationsContent />}
      </div>
    </div>
  );
}

// ─── Notes panel ───

function NotesContent({
  onSelectNote,
  selectedNoteId,
}: {
  onSelectNote: (noteId: string) => void;
  selectedNoteId: string | null;
}) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [filteredNotes, setFilteredNotes] = useState<Note[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchNotes = async () => {
      try {
        const res = await fetch('/api/notes');
        if (res.ok) {
          const data = await res.json();
          setNotes(data);
          setFilteredNotes(data);
        }
      } catch (err) {
        console.error('Failed to fetch notes:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchNotes();
  }, []);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredNotes(notes);
      return;
    }
    const q = searchQuery.toLowerCase();
    setFilteredNotes(
      notes.filter(
        (n) =>
          n.title.toLowerCase().includes(q) ||
          n.content.toLowerCase().includes(q)
      )
    );
  }, [searchQuery, notes]);

  useEffect(() => {
    searchRef.current?.focus();
  }, []);

  const handleDelete = useCallback(async (noteId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Archive this note? It can be recovered later.')) return;
    setDeletingId(noteId);
    try {
      const res = await fetch(`/api/notes/${noteId}`, { method: 'DELETE' });
      if (res.ok) {
        setNotes((prev) => prev.filter((n) => n.id !== noteId));
      }
    } catch (err) {
      console.error('Failed to delete:', err);
    } finally {
      setDeletingId(null);
    }
  }, []);

  return (
    <>
      <div className="px-3 pt-4 pb-2">
        <h2 className="text-xs font-semibold text-[var(--color-foreground-secondary)] uppercase tracking-wider mb-3 px-1">
          Notes
        </h2>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--color-muted)]" />
          <input
            ref={searchRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter notes..."
            className="w-full pl-8 pr-3 py-2 rounded-lg bg-[var(--color-background)] border border-[var(--color-border)] text-[var(--color-foreground)] placeholder-[var(--color-muted)] text-xs outline-none focus:border-[var(--color-accent)]"
          />
        </div>
        <div className="text-[10px] text-[var(--color-muted)] mt-2 px-1">
          {filteredNotes.length} {filteredNotes.length === 1 ? 'note' : 'notes'}
          {searchQuery && ` matching "${searchQuery}"`}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-1.5 pb-2">
        {isLoading ? (
          <div className="flex items-center justify-center h-32 text-xs text-[var(--color-muted)]">
            Loading notes...
          </div>
        ) : filteredNotes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-xs text-[var(--color-muted)]">
            <FileText className="w-6 h-6 mb-2 opacity-30" />
            {searchQuery ? 'No notes match your search' : 'No notes yet — plant a seed!'}
          </div>
        ) : (
          filteredNotes.map((note) => (
            <button
              key={note.id}
              onClick={() => onSelectNote(note.id)}
              className={`
                w-full text-left px-3 py-2.5 rounded-lg mb-0.5
                transition-colors group
                ${
                  selectedNoteId === note.id
                    ? 'bg-[var(--color-accent)]/10 border border-[var(--color-accent)]/20'
                    : 'hover:bg-[var(--color-surface-secondary)] border border-transparent'
                }
              `}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-[var(--color-foreground)] truncate">
                    {note.title || 'Untitled Note'}
                  </div>
                  {note.content && (
                    <div className="text-[11px] text-[var(--color-foreground-secondary)] mt-0.5 line-clamp-2">
                      {contentPreview(note.content)}
                    </div>
                  )}
                  <div className="flex items-center gap-1 mt-1 text-[10px] text-[var(--color-muted)]">
                    <Clock className="w-2.5 h-2.5" />
                    {timeAgo(note.updated_at)}
                  </div>
                </div>
                <button
                  onClick={(e) => handleDelete(note.id, e)}
                  className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-[var(--color-danger)]/10 transition-opacity shrink-0 mt-0.5"
                  title="Archive note"
                  disabled={deletingId === note.id}
                >
                  <Trash2 className="w-3 h-3 text-[var(--color-danger)]" />
                </button>
              </div>
            </button>
          ))
        )}
      </div>
    </>
  );
}

// ─── Automations panel ───

function AutomationsContent() {
  const [hasKey, setHasKey] = useState<boolean | null>(null);
  const [runningId, setRunningId] = useState<string | null>(null);
  const [statuses, setStatuses] = useState<Record<string, AutomationStatus>>({});
  const [results, setResults] = useState<Record<string, string>>({});

  // Check if user has a BYOT key set
  useEffect(() => {
    const checkKey = async () => {
      try {
        const res = await fetch('/api/settings');
        if (res.ok) {
          const data = await res.json();
          setHasKey(data.llm_api_key_set || false);
        }
      } catch {
        setHasKey(false);
      }
    };
    checkKey();
  }, []);

  const handleRun = useCallback(async (automationId: string) => {
    setRunningId(automationId);
    setStatuses((prev) => ({ ...prev, [automationId]: 'running' }));

    try {
      const res = await fetch(`/api/automations/${automationId}`, {
        method: 'POST',
      });

      const data = await res.json();

      if (res.ok) {
        setStatuses((prev) => ({ ...prev, [automationId]: 'done' }));
        setResults((prev) => ({ ...prev, [automationId]: data.message || 'Done' }));
        setTimeout(() => {
          setStatuses((prev) => ({ ...prev, [automationId]: 'idle' }));
        }, 10000);
      } else {
        setStatuses((prev) => ({ ...prev, [automationId]: 'error' }));
        setResults((prev) => ({ ...prev, [automationId]: data.error || 'Failed' }));
      }
    } catch {
      setStatuses((prev) => ({ ...prev, [automationId]: 'error' }));
      setResults((prev) => ({ ...prev, [automationId]: 'Network error' }));
    } finally {
      setRunningId(null);
    }
  }, []);

  return (
    <div className="flex-1 overflow-y-auto flex flex-col">
      <div className="px-3 pt-4 pb-2">
        <h2 className="text-xs font-semibold text-[var(--color-foreground-secondary)] uppercase tracking-wider mb-1 px-1">
          Quick Automations
        </h2>
        <p className="text-[10px] text-[var(--color-muted)] px-1 mb-3">
          One-click runs. For custom prompts & scheduling,{' '}
          <a href="/garden/automations" className="text-[var(--color-accent)] hover:underline">
            open the full manager
          </a>.
          {hasKey === false && (
            <span className="text-[var(--color-warning)]">
              {' '}Add an API key in Settings to enable LLM automations.
            </span>
          )}
        </p>
      </div>

      <div className="px-2 pb-2 space-y-1 flex-1">
        {AUTOMATIONS.map((auto) => {
          const status = statuses[auto.id] || 'idle';
          const result = results[auto.id];
          const needsKey = auto.requiresKey && !hasKey;
          const isRunning = runningId === auto.id;

          return (
            <div
              key={auto.id}
              className={`px-3 py-3 rounded-lg border transition-colors ${
                needsKey
                  ? 'border-[var(--color-border)] opacity-50'
                  : 'border-[var(--color-border)] hover:border-[var(--color-accent)]/30'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <Zap className={`w-3 h-3 shrink-0 ${
                      needsKey ? 'text-[var(--color-muted)]' : 'text-[var(--color-accent)]'
                    }`} />
                    <span className="text-sm font-medium text-[var(--color-foreground)]">
                      {auto.name}
                    </span>
                    {needsKey && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-[var(--color-warning)]/10 text-[var(--color-warning)]">
                        needs key
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-[var(--color-foreground-secondary)] mt-1">
                    {auto.description}
                  </p>
                  <p className="text-[10px] text-[var(--color-muted)] mt-1">
                    {auto.trigger}
                  </p>
                  {/* Show result/error inline */}
                  {(status === 'done' || status === 'error') && result && (
                    <p className={`text-[10px] mt-1.5 px-2 py-1 rounded ${
                      status === 'error'
                        ? 'bg-[var(--color-danger)]/10 text-[var(--color-danger)]'
                        : 'bg-[var(--color-success)]/10 text-[var(--color-success)]'
                    }`}>
                      {result.length > 150 ? result.slice(0, 150) + '…' : result}
                    </p>
                  )}
                </div>

                {/* Run button */}
                <button
                  onClick={() => handleRun(auto.id)}
                  disabled={isRunning || needsKey}
                  className={`p-1.5 rounded-lg shrink-0 transition-colors ${
                    status === 'done'
                      ? 'text-[var(--color-success)]'
                      : status === 'error'
                        ? 'text-[var(--color-danger)]'
                        : needsKey
                          ? 'text-[var(--color-muted)] cursor-not-allowed'
                          : 'text-[var(--color-foreground-secondary)] hover:text-[var(--color-accent)] hover:bg-[var(--color-surface-secondary)]'
                  }`}
                  title={needsKey ? 'Add API key in Settings' : `Run ${auto.name} now`}
                >
                  {isRunning ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : status === 'done' ? (
                    <Check className="w-4 h-4" />
                  ) : status === 'error' ? (
                    <AlertCircle className="w-4 h-4" />
                  ) : (
                    <Play className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Link to full automations manager */}
      <div className="px-3 pb-4 pt-2 border-t border-[var(--color-border)]">
        <a
          href="/garden/automations"
          className="flex items-center justify-center gap-2 w-full px-3 py-2.5 rounded-lg bg-[var(--color-accent)]/10 border border-[var(--color-accent)]/20 text-[var(--color-accent)] text-xs font-medium hover:bg-[var(--color-accent)]/20 transition-colors"
        >
          <Zap className="w-3.5 h-3.5" />
          Manage Automations & Custom Prompts
        </a>
      </div>
    </div>
  );
}
