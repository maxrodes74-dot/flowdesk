'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, X } from 'lucide-react';
import type { Note } from '@/lib/notes';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectNote: (noteId: string) => void;
}

export default function SearchModal({
  isOpen,
  onClose,
  onSelectNote,
}: SearchModalProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Note[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setResults([]);
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Search debounce
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/search?q=${encodeURIComponent(query)}`
        );
        if (res.ok) {
          setResults(await res.json());
          setSelectedIndex(0);
        }
      } catch {}
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  // Keyboard nav
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, results.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === 'Enter' && results[selectedIndex]) {
        onSelectNote(results[selectedIndex].id);
        onClose();
      } else if (e.key === 'Escape') {
        onClose();
      }
    },
    [results, selectedIndex, onSelectNote, onClose]
  );

  // Global ⌘K
  useEffect(() => {
    const handleGlobal = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else {
          // Parent will need to handle opening
        }
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleGlobal);
    return () => window.removeEventListener('keydown', handleGlobal);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60" />

      {/* Modal */}
      <div
        className="relative w-full max-w-lg bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--color-border)]">
          <Search className="w-4 h-4 text-[var(--color-foreground-secondary)]" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search notes..."
            className="flex-1 bg-transparent text-[var(--color-foreground)] placeholder-[var(--color-foreground-secondary)] outline-none text-sm"
          />
          <kbd className="hidden sm:inline text-[10px] text-[var(--color-foreground-secondary)] border border-[var(--color-border)] rounded px-1.5 py-0.5">
            Esc
          </kbd>
        </div>

        {/* Results */}
        {results.length > 0 && (
          <div className="max-h-64 overflow-y-auto py-1">
            {results.map((note, i) => (
              <button
                key={note.id}
                onClick={() => {
                  onSelectNote(note.id);
                  onClose();
                }}
                className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                  i === selectedIndex
                    ? 'bg-[var(--color-surface-secondary)] text-[var(--color-foreground)]'
                    : 'text-[var(--color-foreground-secondary)] hover:bg-[var(--color-surface-secondary)]'
                }`}
              >
                <div className="font-medium truncate">{note.title}</div>
              </button>
            ))}
          </div>
        )}

        {query.trim() && results.length === 0 && (
          <div className="px-4 py-6 text-center text-sm text-[var(--color-foreground-secondary)]">
            No notes found
          </div>
        )}
      </div>
    </div>
  );
}
