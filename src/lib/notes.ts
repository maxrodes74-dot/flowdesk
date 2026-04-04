import { createClient } from '@/lib/supabase/server';

export type Note = {
  id: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
  is_archived: boolean;
  metadata: Record<string, unknown>;
  user_id: string;
};

/**
 * Fetch all non-archived notes for a user, ordered by updated_at descending
 */
export async function getNotes(userId: string): Promise<Note[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('notes')
    .select('id, user_id, title, content, metadata, is_archived, created_at, updated_at')
    .eq('user_id', userId)
    .eq('is_archived', false)
    .order('updated_at', { ascending: false });

  if (error) throw error;
  return (data as Note[]) || [];
}

/**
 * Fetch a single note by ID
 */
export async function getNote(noteId: string): Promise<Note | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('notes')
    .select('id, user_id, title, content, metadata, is_archived, created_at, updated_at')
    .eq('id', noteId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }

  return (data as Note) || null;
}

/**
 * Create a new note for a user
 */
export async function createNote(
  userId: string,
  title: string,
  content: string
): Promise<Note> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('notes')
    .insert({
      user_id: userId,
      title,
      content,
    })
    .select('id, user_id, title, content, metadata, is_archived, created_at, updated_at')
    .single();

  if (error) throw error;
  return data as Note;
}

/**
 * Update a note's title and/or content
 */
export async function updateNote(
  noteId: string,
  updates: { title?: string; content?: string }
): Promise<Note> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('notes')
    .update(updates)
    .eq('id', noteId)
    .select('id, user_id, title, content, metadata, is_archived, created_at, updated_at')
    .single();

  if (error) throw error;
  return data as Note;
}

/**
 * Soft delete a note by archiving it
 */
export async function deleteNote(noteId: string): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('notes')
    .update({ is_archived: true })
    .eq('id', noteId);

  if (error) throw error;
}

/**
 * Search notes by title/content (ilike)
 */
export async function searchNotes(
  userId: string,
  query: string
): Promise<Note[]> {
  const supabase = await createClient();

  // Sanitize query for ilike
  const sanitized = query.replace(/[%_]/g, '');

  const { data, error } = await supabase
    .from('notes')
    .select('id, user_id, title, content, metadata, is_archived, created_at, updated_at')
    .eq('user_id', userId)
    .eq('is_archived', false)
    .or(`title.ilike.%${sanitized}%,content.ilike.%${sanitized}%`)
    .order('updated_at', { ascending: false })
    .limit(20);

  if (error) throw error;
  return (data as Note[]) || [];
}

/**
 * Get all notes that link TO the given note (backlinks)
 */
export async function getBacklinks(noteId: string): Promise<Note[]> {
  const supabase = await createClient();

  // Find all links where this note is the target
  const { data: links, error: linksError } = await supabase
    .from('links')
    .select('source_note_id')
    .eq('target_note_id', noteId)
    .eq('dismissed', false);

  if (linksError) throw linksError;

  const sourceIds = (links || []).map((l) => l.source_note_id);
  if (sourceIds.length === 0) return [];

  const { data: notes, error: notesError } = await supabase
    .from('notes')
    .select('id, user_id, title, content, metadata, is_archived, created_at, updated_at')
    .in('id', sourceIds)
    .eq('is_archived', false);

  if (notesError) throw notesError;
  return (notes as Note[]) || [];
}
