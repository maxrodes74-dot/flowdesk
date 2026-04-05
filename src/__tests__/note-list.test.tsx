import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import NoteList from '@/components/garden/note-list';
import type { Note } from '@/lib/notes';

const makeNote = (overrides: Partial<Note> = {}): Note => ({
  id: '1',
  user_id: 'user-1',
  title: 'Test Note',
  content: '<p>Content</p>',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  is_archived: false,
  metadata: {},
  ...overrides,
});

describe('NoteList', () => {
  it('renders empty state when no notes', () => {
    render(<NoteList notes={[]} onSelect={vi.fn()} />);
    expect(screen.getByText('No notes yet. Create one to get started.')).toBeInTheDocument();
  });

  it('renders a list of notes', () => {
    const notes = [
      makeNote({ id: '1', title: 'First Note' }),
      makeNote({ id: '2', title: 'Second Note' }),
    ];

    render(<NoteList notes={notes} onSelect={vi.fn()} />);

    expect(screen.getByText('First Note')).toBeInTheDocument();
    expect(screen.getByText('Second Note')).toBeInTheDocument();
  });

  it('highlights the active note', () => {
    const notes = [
      makeNote({ id: '1', title: 'Active' }),
      makeNote({ id: '2', title: 'Inactive' }),
    ];

    render(<NoteList notes={notes} activeNoteId="1" onSelect={vi.fn()} />);

    const activeButton = screen.getByText('Active').closest('button');
    expect(activeButton?.className).toContain('bg-[var(--accent)]');
  });

  it('calls onSelect with the note id when clicked', () => {
    const onSelect = vi.fn();
    const notes = [makeNote({ id: 'abc', title: 'Click Me' })];

    render(<NoteList notes={notes} onSelect={onSelect} />);

    fireEvent.click(screen.getByText('Click Me'));
    expect(onSelect).toHaveBeenCalledWith('abc');
  });
});
