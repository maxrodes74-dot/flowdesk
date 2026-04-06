'use client';

import React from 'react';
import type { Note } from '@/lib/notes';

interface NoteListProps {
  notes: Note[];
  activeNoteId?: string;
  onSelect: (id: string) => void;
}

function getRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const secondsAgo = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (secondsAgo < 60) return 'just now';
  if (secondsAgo < 3600) return `${Math.floor(secondsAgo / 60)}m ago`;
  if (secondsAgo < 86400) return `${Math.floor(secondsAgo / 3600)}h ago`;
  if (secondsAgo < 604800) return `${Math.floor(secondsAgo / 86400)}d ago`;
  return date.toLocaleDateString();
}

export default function NoteList({
  notes,
  activeNoteId,
  onSelect,
}: NoteListProps) {
  if (notes.length === 0) {
    return (
      <div className="px-3 py-6 text-center text-[var(--text-secondary)] text-sm">
        No notes yet. Create one to get started.
      </div>
    );
  }

  return (
    <ul className="flex flex-col gap-1 px-2">
      {notes.map((note) => (
        <li key={note.id}>
          <button
            onClick={() => onSelect(note.id)}
            className={`
              w-full
              px-3
              py-2
              rounded
              text-left
              text-sm
              transition-colors
              ${
                activeNoteId === note.id
                  ? 'bg-[var(--accent)] text-[var(--bg)]'
                  : 'text-[var(--text)] hover:bg-[var(--surface)]'
              }
            `}
          >
            <div className="font-medium truncate">{note.title}</div>
            <div
              className={`text-xs ${
                activeNoteId === note.id
                  ? 'opacity-80'
                  : 'text-[var(--text-secondary)]'
              }`}
            >
              {getRelativeTime(note.updated_at)}
            </div>
          </button>
        </li>
      ))}
    </ul>
  );
}
