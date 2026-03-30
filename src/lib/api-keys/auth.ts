import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import { hashApiKey } from './utils';
import type { ApiKeyPermissions } from './types';
import type { SubscriptionTier } from '@/lib/types';

export interface AuthenticatedRequest {
  freelancer_id: string;
  api_key_id: string;
  permissions: ApiKeyPermissions;
  tier: SubscriptionTier;
}

// In-memory rate limit tracking: Map<key_hash, { count: number; windowStart: number }>
const rateLimitMap = new Map<string, { count: number; windowStart: number }>();
const RATE_LIMIT_PER_MINUTE = 100;
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute

/**
 * Clean up old rate limit entries every 5 minutes
 */
const cleanupInterval = setInterval(() => {
  const now = Date.now();
  for (const [key, value] of rateLimitMap.entries()) {
    if (now - value.windowStart > RATE_LIMIT_WINDOW_MS * 5) {
      rateLimitMap.delete(key);
    }
  }
}, 5 * 60 * 1000);

// Ensure cleanup stops when the process exits
if (cleanupInterval.unref) {
  cleanupInterval.unref();
}

/**
 * Check and update rate limit for an API key
 * Returns true if within limit, false if exceeded
 */
function checkRateLimit(keyHash: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(keyHash);

  if (!record || now - record.windowStart > RATE_LIMIT_WINDOW_MS) {
    // New window or first request
    rateLimitMap.set(keyHash, { count: 1, windowStart: now });
    return true;
  }

  if (record.count >= RATE_LIMIT_PER_MINUTE) {
    return false;
  }

  record.count++;
  return true;
}

/**
 * Authenticate an API request using Bearer token
 * Validates the key, checks expiration, verifies tier, and updates usage metrics
 * Returns AuthenticatedRequest on success, or NextResponse error on failure
 */
export async function authenticateApiKey(
  request: Request
): Promise<AuthenticatedRequest | Response> {
  try {
    // Extract Bearer token from Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid Authorization header' },
        { status: 401 }
      );
    }

    const apiKey = authHeader.substring(7); // Remove "Bearer " prefix

    // Hash the key
    const keyHash = hashApiKey(apiKey);

    // Check rate limit
    if (!checkRateLimit(keyHash)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded (100 requests per minute)' },
        { status: 429 }
      );
    }

    // Create service client for database lookup
    const supabase = createServiceClient();

    // Look up the API key by hash
    const { data: apiKeyRecord, error: lookupError } = await supabase
      .from('api_keys')
      .select('*')
      .eq('key_hash', keyHash)
      .single();

    if (lookupError || !apiKeyRecord) {
      return NextResponse.json(
        { error: 'Invalid API key' },
        { status: 401 }
      );
    }

    // Check if key is active
    if (!apiKeyRecord.is_active) {
      return NextResponse.json(
        { error: 'API key is inactive' },
        { status: 401 }
      );
    }

    // Check if key has expired
    if (apiKeyRecord.expires_at) {
      const expiresAt = new Date(apiKeyRecord.expires_at);
      if (expiresAt < new Date()) {
        return NextResponse.json(
          { error: 'API key has expired' },
          { status: 401 }
        );
      }
    }

    // Get freelancer subscription tier
    const { data: freelancerRecord, error: freelancerError } = await supabase
      .from('freelancers')
      .select('subscription_tier')
      .eq('id', apiKeyRecord.freelancer_id)
      .single();

    if (freelancerError || !freelancerRecord) {
      return NextResponse.json(
        { error: 'Freelancer not found' },
        { status: 404 }
      );
    }

    const tier = freelancerRecord.subscription_tier as SubscriptionTier;

    // Check if freelancer has pro tier or above
    if (tier === 'free') {
      return NextResponse.json(
        { error: 'API keys require Pro tier or above' },
        { status: 403 }
      );
    }

    // Update last_used_at and increment request_count
    const now = new Date().toISOString();
    await supabase
      .from('api_keys')
      .update({
        last_used_at: now,
        request_count: (apiKeyRecord.request_count || 0) + 1,
      })
      .eq('id', apiKeyRecord.id);

    return {
      freelancer_id: apiKeyRecord.freelancer_id,
      api_key_id: apiKeyRecord.id,
      permissions: apiKeyRecord.permissions as ApiKeyPermissions,
      tier,
    };
  } catch (error) {
    console.error('API key authentication error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
