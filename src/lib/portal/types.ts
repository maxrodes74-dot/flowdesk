// =============================================================
// MTR-295: Client Portal v2 - Type Definitions
// =============================================================

export interface DocumentComment {
  id: string;
  document_id: string;
  section_key: string | null; // null = general comment
  author_type: 'freelancer' | 'client';
  author_name: string;
  body: string;
  parent_comment_id: string | null; // for threading
  created_at: string;
}

export interface ChangeRequest {
  id: string;
  document_id: string;
  client_name: string;
  description: string;
  sections_affected: string[];
  status: 'pending' | 'accepted' | 'rejected';
  change_order_id: string | null; // links to generated change_order document
  created_at: string;
  resolved_at: string | null;
}

export interface CreateCommentInput {
  section_key?: string | null;
  body: string;
  author_name: string;
  author_type: 'client' | 'freelancer';
}

export interface CreateChangeRequestInput {
  description: string;
  sections_affected: string[];
  client_name: string;
}
