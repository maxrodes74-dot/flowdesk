// =============================================================
// MTR-280/281: Unified Document types
// =============================================================

import type { DocumentType, DocumentStatus, FileType } from "./schemas";

export interface Document {
  id: string;
  freelancer_id: string;
  client_id: string | null;
  type: DocumentType;
  template_id: string | null;
  parent_id: string | null;
  lineage_chain: string[];
  title: string;
  content: Record<string, unknown>;
  metadata: Record<string, unknown>;
  status: DocumentStatus;
  version: number;
  file_url: string | null;
  file_type: FileType | null;
  ai_generated: boolean;
  agent_key_id: string | null;
  created_at: string;
  updated_at: string;
  sent_at: string | null;
  approved_at: string | null;
}

export interface DocumentVersion {
  id: string;
  document_id: string;
  version: number;
  content: Record<string, unknown>;
  metadata: Record<string, unknown>;
  file_url: string | null;
  created_by: string;
  created_at: string;
}

export interface CreateDocumentInput {
  client_id?: string;
  type: DocumentType;
  template_id?: string;
  parent_id?: string;
  title: string;
  content: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  status?: DocumentStatus;
  ai_generated?: boolean;
}

export interface UpdateDocumentInput {
  client_id?: string;
  title?: string;
  content?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  status?: DocumentStatus;
  file_url?: string;
  file_type?: FileType;
}

export interface DocumentListFilters {
  type?: DocumentType;
  status?: DocumentStatus;
  client_id?: string;
  limit?: number;
  offset?: number;
}

// Helper to convert from DB row (snake_case) to the Document interface
export function rowToDocument(row: Record<string, unknown>): Document {
  return {
    id: row.id as string,
    freelancer_id: row.freelancer_id as string,
    client_id: (row.client_id as string) || null,
    type: row.type as DocumentType,
    template_id: (row.template_id as string) || null,
    parent_id: (row.parent_id as string) || null,
    lineage_chain: (row.lineage_chain as string[]) || [],
    title: row.title as string,
    content: (row.content as Record<string, unknown>) || {},
    metadata: (row.metadata as Record<string, unknown>) || {},
    status: row.status as DocumentStatus,
    version: row.version as number,
    file_url: (row.file_url as string) || null,
    file_type: (row.file_type as FileType) || null,
    ai_generated: row.ai_generated as boolean,
    agent_key_id: (row.agent_key_id as string) || null,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
    sent_at: (row.sent_at as string) || null,
    approved_at: (row.approved_at as string) || null,
  };
}
