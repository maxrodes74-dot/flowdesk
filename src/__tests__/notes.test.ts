import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Note } from '@/lib/notes';

// Mock Supabase server client
const mockSelect = vi.fn();
const mockInsert = vi.fn();
const mockUpdate = vi.fn();
const mockFrom = vi.fn();

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => ({
    from: mockFrom,
  })),
}));

// Import after mocking
const { getNotes, getNote, createNote, updateNote, deleteNote, searchNotes } =
  await import('@/lib/notes');

const fakeNote: Note = {
  id: '123',
  user_id: 'user-1',
  title: 'Test Note',
  content: '<p>Hello</p>',
  created_at: '2026-04-01T00:00:00Z',
  updated_at: '2026-04-01T00:00:00Z',
  is_archived: false,
  metadata: {},
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('getNotes', () => {
  it('returns paginated notes and total count', async () => {
    const chainMock = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      range: vi.fn().mockResolvedValue({
        data: [fakeNote],
        error: null,
        count: 1,
      }),
    };
    mockFrom.mockReturnValue(chainMock);

    const result = await getNotes('user-1', { limit: 10, offset: 0 });

    expect(result.notes).toEqual([fakeNote]);
    expect(result.total).toBe(1);
    expect(mockFrom).toHaveBeenCalledWith('notes');
  });

  it('clamps limit to 100', async () => {
    const chainMock = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      range: vi.fn().mockResolvedValue({ data: [], error: null, count: 0 }),
    };
    mockFrom.mockReturnValue(chainMock);

    await getNotes('user-1', { limit: 999 });

    // range should be called with 0..99 (100 items max)
    expect(chainMock.range).toHaveBeenCalledWith(0, 99);
  });

  it('defaults limit to 50 and offset to 0', async () => {
    const chainMock = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      range: vi.fn().mockResolvedValue({ data: [], error: null, count: 0 }),
    };
    mockFrom.mockReturnValue(chainMock);

    await getNotes('user-1');

    expect(chainMock.range).toHaveBeenCalledWith(0, 49);
  });

  it('throws on Supabase error', async () => {
    const chainMock = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      range: vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'DB error', code: '500' },
        count: null,
      }),
    };
    mockFrom.mockReturnValue(chainMock);

    await expect(getNotes('user-1')).rejects.toEqual({ message: 'DB error', code: '500' });
  });
});

describe('getNote', () => {
  it('returns a note by ID', async () => {
    const chainMock = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: fakeNote, error: null }),
    };
    mockFrom.mockReturnValue(chainMock);

    const result = await getNote('123');

    expect(result).toEqual(fakeNote);
  });

  it('returns null when note is not found (PGRST116)', async () => {
    const chainMock = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: null,
        error: { code: 'PGRST116', message: 'Not found' },
      }),
    };
    mockFrom.mockReturnValue(chainMock);

    const result = await getNote('not-exist');

    expect(result).toBeNull();
  });
});

describe('createNote', () => {
  it('creates and returns a new note', async () => {
    const chainMock = {
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: fakeNote, error: null }),
    };
    mockFrom.mockReturnValue(chainMock);

    const result = await createNote('user-1', 'Test Note', '<p>Hello</p>');

    expect(result).toEqual(fakeNote);
    expect(chainMock.insert).toHaveBeenCalledWith({
      user_id: 'user-1',
      title: 'Test Note',
      content: '<p>Hello</p>',
    });
  });
});

describe('updateNote', () => {
  it('updates and returns the note', async () => {
    const updated = { ...fakeNote, title: 'Updated' };
    const chainMock = {
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: updated, error: null }),
    };
    mockFrom.mockReturnValue(chainMock);

    const result = await updateNote('123', { title: 'Updated' });

    expect(result.title).toBe('Updated');
  });
});

describe('deleteNote', () => {
  it('soft deletes by setting is_archived to true', async () => {
    const chainMock = {
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ error: null }),
    };
    mockFrom.mockReturnValue(chainMock);

    await deleteNote('123');

    expect(chainMock.update).toHaveBeenCalledWith({ is_archived: true });
  });
});

describe('searchNotes', () => {
  it('returns matching notes', async () => {
    const chainMock = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      or: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({ data: [fakeNote], error: null }),
    };
    mockFrom.mockReturnValue(chainMock);

    const results = await searchNotes('user-1', 'test');

    expect(results).toEqual([fakeNote]);
  });

  it('sanitizes % and _ from query', async () => {
    const chainMock = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      or: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({ data: [], error: null }),
    };
    mockFrom.mockReturnValue(chainMock);

    await searchNotes('user-1', 'test%_injection');

    // The or call should use the sanitized query (no % or _)
    expect(chainMock.or).toHaveBeenCalledWith(
      'title.ilike.%testinjection%,content.ilike.%testinjection%'
    );
  });
});
