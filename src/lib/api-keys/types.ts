export interface ApiKey {
  id: string;
  freelancer_id: string;
  name: string;
  key_hash: string;
  key_prefix: string;
  permissions: ApiKeyPermissions;
  last_used_at: string | null;
  request_count: number;
  expires_at: string | null;
  is_active: boolean;
  created_at: string;
}

export interface ApiKeyPermissions {
  read: 'auto' | 'approve' | 'block';
  create: 'auto' | 'approve' | 'block';
  edit: 'auto' | 'approve' | 'block';
  send: 'auto' | 'approve' | 'block';
  financial: 'auto' | 'approve' | 'block';
  delete: 'auto' | 'approve' | 'block';
}

export const DEFAULT_PERMISSIONS: ApiKeyPermissions = {
  read: 'auto',
  create: 'auto',
  edit: 'auto',
  send: 'approve',
  financial: 'approve',
  delete: 'block',
};

export interface CreateApiKeyInput {
  name: string;
  permissions?: Partial<ApiKeyPermissions>;
  expires_at?: string;
}

export interface ApiKeyPublic {
  id: string;
  name: string;
  key_prefix: string;
  permissions: ApiKeyPermissions;
  last_used_at: string | null;
  request_count: number;
  expires_at: string | null;
  is_active: boolean;
  created_at: string;
}
