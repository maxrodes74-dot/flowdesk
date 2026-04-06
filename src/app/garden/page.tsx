'use client';

import React, { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Terrarium from '@/components/terrarium/terrarium';
import EditorPanel from '@/components/terrarium/editor-panel';
import Toolbar from '@/components/terrarium/toolbar';
import SearchModal from '@/components/terrarium/search-modal';

export default function GardenPage() {
  const router = useRouter();
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [noteCount, setNoteCount] = useState(0);

  // Track note count from terrarium data
  const handleSelectNote = useCallback((noteId: string) => {
    if (noteId) {
      setSelectedNoteId(noteId);
    } else {
      setSelectedNoteId(null);
    }
  }, []);

  const handleSeed = useCallback(async () => {
    try {
      const response = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Untitled Note',
          content: '',
        }),
      });

      if (response.ok) {
        const newNote = await response.json();
        setSelectedNoteId(newNote.id);
      }
    } catch (error) {
      console.error('Failed to create note:', error);
    }
  }, []);

  const handleCloseEditor = useCallback(() => {
    setSelectedNoteId(null);
  }, []);

  // Global ⌘K handler
  React.useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  return (
    <div className="relative h-screen w-full overflow-hidden">
      {/* The Terrarium fills the entire viewport */}
      <Terrarium
        onSelectNote={handleSelectNote}
        selectedNoteId={selectedNoteId}
      />

      {/* Floating toolbar */}
      <Toolbar
        onSeed={handleSeed}
        onSearch={() => setIsSearchOpen(true)}
        noteCount={noteCount}
      />

      {/* Editor panel slides in from right */}
      {selectedNoteId && (
        <EditorPanel
          noteId={selectedNoteId}
          onClose={handleCloseEditor}
        />
      )}

      {/* Search modal */}
      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectNote={handleSelectNote}
      />
    </div>
  );
}
