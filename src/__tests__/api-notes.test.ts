import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// Mock auth + notes
const mockGetUser = vi.fn();
const mockGetNotes = vi.fn();
const mockCreateNote = vi.fn();

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => ({
    auth: { getUser: mockGetUser },
  })),
}));

vi.mock('@/lib/notes', () => ({
  getNotes: (...args: any[]) => mockGetNotes(...args),
  createNote: (...args: any[]) => mockCreateNote(...args),
}));

const { GET, POST } = await import('@/app/api/notes/route');

const authedUser = { id: 'user-1', email: 'test@example.com' };

function makeRequest(url: string, init?: RequestInit) {
  return new NextRequest(new URL(url, 'http://localhost:3000'), init);
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('GET /api/notes', () => {
  it('returns 401 when not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: { message: 'No session' } });

    const res = await GET(makeRequest('http://localhost:3000/api/notes'));
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error).toBe('Unauthorized');
  });

  it('returns paginated notes with metadata', async () => {
    mockGetUser.mockResolvedValue({ data: { user: authedUser }, error: null });
    mockGetNotes.mockResolvedValue({
      notes: [{ id: '1', title: 'Note 1' }],
      total: 25,
    });

    const res = await GET(makeRequest('http://localhost:3000/api/notes?limit=10&offset=0'));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data).toHaveLength(1);
    expect(body.total).toBe(25);
    expect(body.limit).toBe(10);
    expect(body.offset).toBe(0);
    expect(body.hasMore).toBe(true);
  });

  it('uses default limit=50 and offset=0', async () => {
    mockGetUser.mockResolvedValue({ data: { user: authedUser }, error: null });
    mockGetNotes.mockResolvedValue({ notes: [], total: 0 });

    const res = await GET(makeRequest('http://localhost:3000/api/notes'));
    const body = await res.json();

    expect(body.limit).toBe(50);
    expect(body.offset).toBe(0);
    expect(mockGetNotes).toHaveBeenCalledWith('user-1', { limit: 50, offset: 0 });
  });

  it('sets hasMore=false when all notes are returned', async () => {
    mockGetUser.mockResolvedValue({ data: { user: authedUser }, error: null });
    mockGetNotes.mockResolvedValue({
      notes: [{ id: '1' }, { id: '2' }],
      total: 2,
    });

    const res = await GET(makeRequest('http://localhost:3000/api/notes?limit=10&offset=0'));
    const body = await res.json();

    expect(body.hasMore).toBe(false);
  });
});

describe('POST /api/notes', () => {
  it('returns 401 when not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: { message: 'No session' } });

    const res = await POST(
      makeRequest('http://localhost:3000/api/notes', {
        method: 'POST',
        body: JSON.stringify({ title: 'New' }),
      })
    );

    expect(res.status).toBe(401);
  });

  it('creates a note and returns 201', async () => {
    mockGetUser.mockResolvedValue({ data: { user: authedUser }, error: null });
    mockCreateNote.mockResolvedValue({ id: 'new-1', title: 'My Note', content: '' });

    const res = await POST(
      makeRequest('http://localhost:3000/api/notes', {
        method: 'POST',
        body: JSON.stringify({ title: 'My Note' }),
        headers: { 'Content-Type': 'application/json' },
      })
    );
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(body.title).toBe('My Note');
    expect(mockCreateNote).toHaveBeenCalledWith('user-1', 'My Note', '');
  });
});
