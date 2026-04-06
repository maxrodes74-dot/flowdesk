'use client';

import React, { useState, useCallback } from 'react';
import Terrarium from '@/components/terrarium/terrarium';
import EditorPanel from '@/components/terrarium/editor-panel';
import Toolbar from '@/components/terrarium/toolbar';
import SearchModal from '@/components/terrarium/search-modal';
import LeftSidebar, { type SidebarPanel } from '@/components/terrarium/left-sidebar';

export default function GardenPage() {
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [activePanel, setActivePanel] = useState<SidebarPanel>(null);
  const [noteCount, setNoteCount] = useState(0);

  const handleNoteCountChange = useCallback((count: number) => {
    setNoteCount(count);
  }, []);

  const handleSelectNote = useCallback((noteId: string) => {
    setSelectedNoteId(noteId || null);
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

  const handleSetPanel = useCallback((panel: SidebarPanel) => {
    setActivePanel(panel);
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
    <div className="relative h-full w-full flex flex-col">
      {/* The Terrarium fills the entire viewport */}
      <Terrarium
        onSelectNote={handleSelectNote}
        selectedNoteId={selectedNoteId}
        onNoteCountChange={handleNoteCountChange}
      />

      {/* Floating toolbar */}
      <Toolbar
        onSeed={handleSeed}
        onSearch={() => setIsSearchOpen(true)}
        activePanel={activePanel}
        onSetPanel={handleSetPanel}
        noteCount={noteCount}
      />

      {/* Left sidebar — always mounted, slides via CSS transform */}
      <LeftSidebar
        activePanel={activePanel}
        onSelectNote={handleSelectNote}
        selectedNoteId={selectedNoteId}
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
