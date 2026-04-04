'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Search } from 'lucide-react';
import type { Note } from '@/lib/notes';

interface SearchBarProps {
  onSelect: (noteId: string) => void;
}

export default function SearchBar({ onSelect }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Note[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | undefined>(undefined);

  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/search?q=${encodeURIComponent(searchQuery)}`
      );
      if (response.ok) {
        const data = await response.json();
        setResults(data);
      }
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleInputChange = (value: string) => {
    setQuery(value);
    setIsOpen(true);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      performSearch(value);
    }, 300);
  };

  const handleSelect = (noteId: string) => {
    setQuery('');
    setResults([]);
    setIsOpen(false);
    onSelect(noteId);
  };

  useEffect(() => {
    const handleClickOutside = () => {
      setIsOpen(false);
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  return (
    <div className="relative w-full">
      <div className="relative flex items-center">
        <Search className="absolute left-3 w-4 h-4 text-[var(--text-secondary)]" />
        <input
          type="text"
          value={query}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => setIsOpen(true)}
          placeholder="Search notes..."
          className="
            w-full
            pl-9
            pr-3
            py-2
            rounded
            bg-[var(--surface)]
            border border-[var(--border)]
            text-[var(--text)]
            placeholder-[var(--text-secondary)]
            focus:outline-none
            focus:border-[var(--accent)]
            transition-colors
          "
        />
      </div>

      {isOpen && query.trim() && (
        <div className="absolute top-full left-0 right-0 mt-2 rounded border border-[var(--border)] bg-[var(--surface)] shadow-lg z-50 max-h-64 overflow-y-auto">
          {isLoading && (
            <div className="p-3 text-center text-[var(--text-secondary)] text-sm">
              Searching...
            </div>
          )}

          {!isLoading && results.length === 0 && (
            <div className="p-3 text-center text-[var(--text-secondary)] text-sm">
              No notes found
            </div>
          )}

          {!isLoading && results.length > 0 && (
            <ul className="divide-y divide-[var(--border)]">
              {results.map((note) => (
                <li key={note.id}>
                  <button
                    onClick={() => handleSelect(note.id)}
                    className="
                      w-full
                      px-3
                      py-2
                      text-left
                      hover:bg-[var(--bg)]
                      transition-colors
                      text-sm
                    "
                  >
                    <div className="font-medium text-[var(--text)]">
                      {note.title}
                    </div>
                    <div className="text-xs text-[var(--text-secondary)] line-clamp-1 mt-1">
                      {note.content.replace(/<[^>]*>/g, '')}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
