'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import TiptapEditor from '@/components/editor/tiptap-editor';
import BacklinksPanel from '@/components/garden/backlinks-panel';
import type { Note } from '@/lib/notes';

export default function NoteEditorPage() {
  const params = useParams();
  const noteId = params.noteId as string;

  const [note, setNote] = useState<Note | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch note
  useEffect(() => {
    const fetchNote = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/notes/${noteId}`);
        if (!response.ok) {
          if (response.status === 404) {
            setError('Note not found');
          } else {
            setError('Failed to load note');
          }
          setNote(null);
        } else {
          const data = await response.json();
          setNote(data);
        }
      } catch (err) {
        console.error('Failed to fetch note:', err);
        setError('Failed to load note');
        setNote(null);
      } finally {
        setIsLoading(false);
      }
    };

    if (noteId) {
      fetchNote();
    }
  }, [noteId]);

  // Debounced auto-save
  const autoSaveNote = useCallback(
    async (updatedNote: Note) => {
      setIsSaving(true);
      try {
        const response = await fetch(`/api/notes/${noteId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: updatedNote.title,
            content: updatedNote.content,
          }),
        });

        if (response.ok) {
          const saved = await response.json();
          setNote(saved);
        }
      } catch (err) {
        console.error('Failed to save note:', err);
      } finally {
        setIsSaving(false);
      }
    },
    [noteId]
  );

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!note) return;

    const updated = {
      ...note,
      title: e.target.value,
    };
    setNote(updated);

    // Auto-save after user stops typing
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }
    autoSaveTimeoutRef.current = setTimeout(() => {
      autoSaveNote(updated);
    }, 1000);
  };

  const handleContentChange = (content: string) => {
    if (!note) return;

    const updated = {
      ...note,
      content,
    };
    setNote(updated);

    // Auto-save after user stops editing
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }
    autoSaveTimeoutRef.current = setTimeout(() => {
      autoSaveNote(updated);
    }, 1000);
  };

  const autoSaveTimeoutRef = React.useRef<NodeJS.Timeout | undefined>(undefined);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center text-[var(--text-secondary)]">
        Loading note...
      </div>
    );
  }

  if (error || !note) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-[var(--text)] mb-2">
            {error || 'Note not found'}
          </h2>
          <p className="text-[var(--text-secondary)]">
            The note you're looking for doesn't exist or has been deleted.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Main Editor Area */}
      <div className="flex-1 overflow-y-auto flex flex-col">
        {/* Title Input */}
        <div className="px-6 pt-6 pb-2 border-b border-[var(--border)]">
          <input
            type="text"
            value={note.title}
            onChange={handleTitleChange}
            placeholder="Untitled Note"
            className="
              w-full
              text-3xl
              font-bold
              bg-transparent
              text-[var(--text)]
              placeholder-[var(--text-secondary)]
              outline-none
            "
          />
          <div className="mt-2 text-xs text-[var(--text-secondary)]">
            {isSaving ? 'Saving...' : 'Saved'}
          </div>
        </div>

        {/* Editor */}
        <div className="flex-1 overflow-y-auto">
          <TiptapEditor
            content={note.content}
            onChange={handleContentChange}
            editable={true}
          />
        </div>
      </div>

      {/* Backlinks Panel */}
      <BacklinksPanel noteId={noteId} />
    </div>
  );
}
