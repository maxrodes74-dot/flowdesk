// =============================================================
// MTR-294: Agent Guardrails - Type Definitions
// =============================================================

export type ActionCategory = 'read' | 'create' | 'edit' | 'send' | 'financial' | 'delete';
export type GuardrailPolicy = 'auto' | 'approve' | 'block';

export interface GuardrailConfig {
  [category: string]: GuardrailPolicy; // ActionCategory -> policy
}

export interface PendingApproval {
  id: string;
  freelancer_id: string;
  api_key_id: string;
  api_key_name: string;
  action_category: ActionCategory;
  action_description: string;
  action_payload: Record<string, unknown>;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  resolved_at: string | null;
}

export interface AuditLogEntry {
  id: string;
  freelancer_id: string;
  api_key_id: string;
  action_category: ActionCategory;
  action: string;
  resource_type: string;
  resource_id: string;
  result: 'allowed' | 'blocked' | 'pending_approval' | 'approved' | 'rejected';
  created_at: string;
}
