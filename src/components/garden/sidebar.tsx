'use client';

import React from 'react';
import { Plus, Leaf } from 'lucide-react';
import SearchBar from './search-bar';
import NoteList from './note-list';
import type { Note } from '@/lib/notes';

interface SidebarProps {
  notes: Note[];
  activeNoteId?: string;
  onNewNote: () => void;
  onSelectNote: (id: string) => void;
  onSearch: (noteId: string) => void;
}

export default function Sidebar({
  notes,
  activeNoteId,
  onNewNote,
  onSelectNote,
  onSearch,
}: SidebarProps) {
  return (
    <aside className="w-60 bg-[var(--surface)] border-r border-[var(--border)] flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-4 border-b border-[var(--border)]">
        <div className="flex items-center gap-2 mb-4">
          <Leaf className="w-5 h-5 text-[var(--accent)]" />
          <h1 className="text-lg font-semibold text-[var(--text)]">
            Terrarium
          </h1>
        </div>

        {/* Search */}
        <SearchBar onSelect={onSearch} />
      </div>

      {/* New Note Button */}
      <button
        onClick={onNewNote}
        className="
          mx-2
          mt-3
          px-3
          py-2
          rounded
          bg-[var(--accent)]
          text-[var(--bg)]
          font-medium
          text-sm
          hover:opacity-90
          transition-opacity
          flex
          items-center
          justify-center
          gap-2
        "
      >
        <Plus className="w-4 h-4" />
        New Note
      </button>

      {/* Notes List */}
      <div className="flex-1 overflow-y-auto mt-4">
        <NoteList
          notes={notes}
          activeNoteId={activeNoteId}
          onSelect={onSelectNote}
        />
      </div>
    </aside>
  );
}
