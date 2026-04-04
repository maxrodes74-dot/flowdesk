'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Leaf } from 'lucide-react';
import type { Note } from '@/lib/notes';

export default function GardenHomePage() {
  const router = useRouter();
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchNotes = async () => {
      try {
        const response = await fetch('/api/notes');
        if (response.ok) {
          const data = await response.json();
          setNotes(data);

          // Redirect to most recent note if available
          if (data.length > 0) {
            router.push(`/garden/${data[0].id}`);
          }
        }
      } catch (error) {
        console.error('Failed to load notes:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchNotes();
  }, [router]);

  const handleCreateNote = async () => {
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
        router.push(`/garden/${newNote.id}`);
      }
    } catch (error) {
      console.error('Failed to create note:', error);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center">
      {isLoading ? (
        <div className="text-center text-[var(--text-secondary)]">
          Loading your garden...
        </div>
      ) : notes.length === 0 ? (
        <div className="text-center">
          <Leaf className="w-16 h-16 mx-auto mb-4 text-[var(--accent)] opacity-50" />
          <h2 className="text-2xl font-semibold text-[var(--text)] mb-2">
            Your Garden is Empty
          </h2>
          <p className="text-[var(--text-secondary)] mb-6">
            Create your first note to start building your knowledge terrarium
          </p>
          <button
            onClick={handleCreateNote}
            className="
              px-6
              py-2
              rounded
              bg-[var(--accent)]
              text-[var(--bg)]
              font-medium
              hover:opacity-90
              transition-opacity
            "
          >
            Create First Note
          </button>
        </div>
      ) : null}
    </div>
  );
}
