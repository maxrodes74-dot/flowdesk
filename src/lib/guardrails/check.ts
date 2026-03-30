// =============================================================
// MTR-294: Agent Guardrails - Check & Audit Logic
// =============================================================

import { createServiceClient } from "@/lib/supabase/service";
import type { ActionCategory } from "./types";
import type { ApiKeyPermissions } from "@/lib/api-keys/types";

/**
 * Check if an API key action is allowed, blocked, or needs approval.
 * Returns 'allowed' (proceed), 'blocked' (deny), or creates a pending approval and returns 'pending_approval'.
 */
export async function checkGuardrail(params: {
  api_key_id: string;
  freelancer_id: string;
  action_category: ActionCategory;
  action: string;
  resource_type: string;
  resource_id: string;
  action_payload?: Record<string, unknown>;
}): Promise<{ result: 'allowed' | 'blocked' | 'pending_approval'; approval_id?: string }> {
  const supabase = createServiceClient();

  // Fetch API key with permissions
  const { data: apiKey, error: keyError } = await supabase
    .from("api_keys")
    .select("permissions, name")
    .eq("id", params.api_key_id)
    .eq("freelancer_id", params.freelancer_id)
    .single();

  if (keyError || !apiKey) {
    await logAgentAction({
      freelancer_id: params.freelancer_id,
      api_key_id: params.api_key_id,
      action_category: params.action_category,
      action: params.action,
      resource_type: params.resource_type,
      resource_id: params.resource_id,
      result: "blocked",
    });
    return { result: "blocked" };
  }

  const permissions = apiKey.permissions as ApiKeyPermissions;
  const policy = permissions[params.action_category] || "block";

  if (policy === "block") {
    await logAgentAction({
      freelancer_id: params.freelancer_id,
      api_key_id: params.api_key_id,
      action_category: params.action_category,
      action: params.action,
      resource_type: params.resource_type,
      resource_id: params.resource_id,
      result: "blocked",
    });
    return { result: "blocked" };
  }

  if (policy === "auto") {
    await logAgentAction({
      freelancer_id: params.freelancer_id,
      api_key_id: params.api_key_id,
      action_category: params.action_category,
      action: params.action,
      resource_type: params.resource_type,
      resource_id: params.resource_id,
      result: "allowed",
    });
    return { result: "allowed" };
  }

  // policy === "approve"
  const { data: approval, error: approvalError } = await supabase
    .from("pending_approvals")
    .insert({
      freelancer_id: params.freelancer_id,
      api_key_id: params.api_key_id,
      api_key_name: apiKey.name,
      action_category: params.action_category,
      action_description: params.action,
      action_payload: params.action_payload || {},
      status: "pending",
      created_at: new Date().toISOString(),
      resolved_at: null,
    })
    .select("id")
    .single();

  if (approvalError || !approval) {
    await logAgentAction({
      freelancer_id: params.freelancer_id,
      api_key_id: params.api_key_id,
      action_category: params.action_category,
      action: params.action,
      resource_type: params.resource_type,
      resource_id: params.resource_id,
      result: "blocked",
    });
    return { result: "blocked" };
  }

  await logAgentAction({
    freelancer_id: params.freelancer_id,
    api_key_id: params.api_key_id,
    action_category: params.action_category,
    action: params.action,
    resource_type: params.resource_type,
    resource_id: params.resource_id,
    result: "pending_approval",
  });

  return { result: "pending_approval", approval_id: approval.id };
}

/**
 * Log an agent action to the audit log.
 */
export async function logAgentAction(params: {
  freelancer_id: string;
  api_key_id: string;
  action_category: ActionCategory;
  action: string;
  resource_type: string;
  resource_id: string;
  result: string;
}): Promise<void> {
  const supabase = createServiceClient();

  await supabase.from("audit_logs").insert({
    freelancer_id: params.freelancer_id,
    api_key_id: params.api_key_id,
    action_category: params.action_category,
    action: params.action,
    resource_type: params.resource_type,
    resource_id: params.resource_id,
    result: params.result,
    created_at: new Date().toISOString(),
  });
}
