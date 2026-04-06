'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { X, ArrowLeft } from 'lucide-react';
import TiptapEditor from '@/components/editor/tiptap-editor';
import type { Note } from '@/lib/notes';

interface EditorPanelProps {
  noteId: string;
  onClose: () => void;
}

export default function EditorPanel({ noteId, onClose }: EditorPanelProps) {
  const [note, setNote] = useState<Note | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [backlinks, setBacklinks] = useState<Note[]>([]);
  const autoSaveRef = useRef<NodeJS.Timeout | undefined>(undefined);

  // Fetch note
  useEffect(() => {
    const fetchNote = async () => {
      setIsLoading(true);
      try {
        const [noteRes, backlinksRes] = await Promise.all([
          fetch(`/api/notes/${noteId}`),
          fetch(`/api/notes/${noteId}/backlinks`),
        ]);

        if (noteRes.ok) {
          setNote(await noteRes.json());
        }
        if (backlinksRes.ok) {
          setBacklinks(await backlinksRes.json());
        }
      } catch (err) {
        console.error('Failed to fetch note:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchNote();
  }, [noteId]);

  // Auto-save
  const saveNote = useCallback(
    async (updated: Note) => {
      setIsSaving(true);
      try {
        const response = await fetch(`/api/notes/${noteId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: updated.title,
            content: updated.content,
          }),
        });
        if (response.ok) {
          const saved = await response.json();
          setNote(saved);
        }
      } catch (err) {
        console.error('Failed to save:', err);
      } finally {
        setIsSaving(false);
      }
    },
    [noteId]
  );

  const scheduleSave = useCallback(
    (updated: Note) => {
      if (autoSaveRef.current) clearTimeout(autoSaveRef.current);
      autoSaveRef.current = setTimeout(() => saveNote(updated), 1000);
    },
    [saveNote]
  );

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!note) return;
    const updated = { ...note, title: e.target.value };
    setNote(updated);
    scheduleSave(updated);
  };

  const handleContentChange = (content: string) => {
    if (!note) return;
    const updated = { ...note, content };
    setNote(updated);
    scheduleSave(updated);
  };

  // Close on Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  return (
    <div
      className="
        absolute top-0 right-0 h-full
        w-full sm:w-[480px] md:w-[520px] lg:w-[560px]
        bg-[var(--color-surface)]
        border-l border-[var(--color-border)]
        shadow-2xl
        flex flex-col
        z-30
        animate-slide-in
      "
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-[var(--color-border)]">
        <button
          onClick={onClose}
          className="p-1.5 rounded hover:bg-[var(--color-surface-secondary)] transition-colors"
          title="Close (Esc)"
        >
          <X className="w-4 h-4 text-[var(--color-foreground-secondary)]" />
        </button>
        <div className="flex-1 text-xs text-[var(--color-foreground-secondary)]">
          {isSaving ? 'Saving...' : isLoading ? '' : 'Saved'}
        </div>
      </div>

      {isLoading ? (
        <div className="flex-1 flex items-center justify-center text-[var(--color-foreground-secondary)]">
          Loading...
        </div>
      ) : !note ? (
        <div className="flex-1 flex items-center justify-center text-[var(--color-foreground-secondary)]">
          Note not found
        </div>
      ) : (
        <>
          {/* Title */}
          <div className="px-4 pt-4 pb-2">
            <input
              type="text"
              value={note.title}
              onChange={handleTitleChange}
              placeholder="Untitled Note"
              className="
                w-full text-2xl font-bold bg-transparent
                text-[var(--color-foreground)]
                placeholder-[var(--color-foreground-secondary)]
                outline-none
              "
            />
          </div>

          {/* Editor */}
          <div className="flex-1 overflow-y-auto">
            <TiptapEditor
              content={note.content}
              onChange={handleContentChange}
              editable={true}
            />
          </div>

          {/* Backlinks */}
          {backlinks.length > 0 && (
            <div className="border-t border-[var(--color-border)] px-4 py-3">
              <div className="text-xs font-semibold text-[var(--color-foreground-secondary)] mb-2">
                Backlinks ({backlinks.length})
              </div>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {backlinks.map((bl) => (
                  <div
                    key={bl.id}
                    className="text-xs text-[var(--color-accent)] truncate cursor-pointer hover:underline"
                  >
                    {bl.title}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
