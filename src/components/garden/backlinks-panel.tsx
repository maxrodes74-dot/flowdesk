'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronDown } from 'lucide-react';
import type { Note } from '@/lib/notes';

interface BacklinksPanelProps {
  noteId: string;
}

export default function BacklinksPanel({ noteId }: BacklinksPanelProps) {
  const [backlinks, setBacklinks] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(true);

  useEffect(() => {
    const fetchBacklinks = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/notes/${noteId}`);
        if (response.ok) {
          // For now, we'll fetch backlinks via a simple endpoint
          // In a full implementation, this would be a dedicated backlinks endpoint
          // We'll stub it out and show the panel structure
          setBacklinks([]);
        }
      } catch (error) {
        console.error('Failed to load backlinks:', error);
        setBacklinks([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBacklinks();
  }, [noteId]);

  return (
    <div className="border-l border-[var(--border)] bg-[var(--bg)] overflow-hidden flex flex-col">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="
          flex
          items-center
          gap-2
          px-4
          py-3
          border-b
          border-[var(--border)]
          text-[var(--text)]
          hover:bg-[var(--surface)]
          transition-colors
        "
      >
        <ChevronDown
          className={`w-4 h-4 transition-transform ${
            isOpen ? '' : '-rotate-90'
          }`}
        />
        <span className="font-semibold text-sm">Backlinks</span>
        {backlinks.length > 0 && (
          <span className="ml-auto text-xs bg-[var(--accent)] text-[var(--bg)] px-2 py-1 rounded">
            {backlinks.length}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="flex-1 overflow-y-auto">
          {isLoading && (
            <div className="px-4 py-3 text-[var(--text-secondary)] text-sm">
              Loading...
            </div>
          )}

          {!isLoading && backlinks.length === 0 && (
            <div className="px-4 py-3 text-[var(--text-secondary)] text-sm">
              No backlinks yet
            </div>
          )}

          {!isLoading && backlinks.length > 0 && (
            <ul className="divide-y divide-[var(--border)]">
              {backlinks.map((link) => (
                <li key={link.id}>
                  <Link
                    href={`/garden/${link.id}`}
                    className="
                      block
                      px-4
                      py-3
                      text-sm
                      text-[var(--accent)]
                      hover:bg-[var(--surface)]
                      transition-colors
                    "
                  >
                    <div className="font-medium truncate">{link.title}</div>
                    <div className="text-xs text-[var(--text-secondary)] mt-1">
                      {link.updated_at
                        ? new Date(link.updated_at).toLocaleDateString()
                        : ''}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
