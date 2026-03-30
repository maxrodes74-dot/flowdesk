import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { generateApiKey } from '@/lib/api-keys/utils';
import { DEFAULT_PERMISSIONS } from '@/lib/api-keys/types';
import type { CreateApiKeyInput, ApiKeyPublic } from '@/lib/api-keys/types';

/**
 * GET /api/api-keys
 * List all API keys for the authenticated user (session auth, not API key auth)
 * Returns ApiKeyPublic[] (never returns hash)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get freelancer ID for this user
    const { data: freelancerRow, error: freelancerError } = await supabase
      .from('freelancers')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (freelancerError || !freelancerRow) {
      return NextResponse.json(
        { error: 'Freelancer profile not found' },
        { status: 404 }
      );
    }

    // Fetch all API keys for this freelancer
    const { data: apiKeys, error: keysError } = await supabase
      .from('api_keys')
      .select('*')
      .eq('freelancer_id', freelancerRow.id)
      .order('created_at', { ascending: false });

    if (keysError) {
      return NextResponse.json(
        { error: 'Failed to fetch API keys' },
        { status: 500 }
      );
    }

    // Convert to public format (no hash)
    const publicKeys: ApiKeyPublic[] = (apiKeys || []).map((key) => ({
      id: key.id,
      name: key.name,
      key_prefix: key.key_prefix,
      permissions: key.permissions as any,
      last_used_at: key.last_used_at,
      request_count: key.request_count,
      expires_at: key.expires_at,
      is_active: key.is_active,
      created_at: key.created_at,
    }));

    return NextResponse.json(publicKeys);
  } catch (error) {
    console.error('Get API keys error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/api-keys
 * Create a new API key for the authenticated user
 * Check tier >= pro. Return the full key ONCE in the response (only time it's shown).
 * Body: { name, permissions?, expires_at? }
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get freelancer with subscription tier
    const { data: freelancerRow, error: freelancerError } = await supabase
      .from('freelancers')
      .select('id, subscription_tier')
      .eq('user_id', user.id)
      .single();

    if (freelancerError || !freelancerRow) {
      return NextResponse.json(
        { error: 'Freelancer profile not found' },
        { status: 404 }
      );
    }

    // Check subscription tier (must be pro or pro+)
    const tier = freelancerRow.subscription_tier as string;
    if (tier === 'free') {
      return NextResponse.json(
        {
          error: 'API keys require Pro tier or above',
        },
        { status: 403 }
      );
    }

    // Parse request body
    let body: CreateApiKeyInput;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    // Validate required fields
    if (!body.name || typeof body.name !== 'string' || body.name.trim() === '') {
      return NextResponse.json(
        { error: 'name is required and must be a non-empty string' },
        { status: 400 }
      );
    }

    // Validate optional expires_at if provided
    if (body.expires_at && typeof body.expires_at !== 'string') {
      return NextResponse.json(
        { error: 'expires_at must be an ISO 8601 timestamp' },
        { status: 400 }
      );
    }

    // Generate new API key
    const { key, hash, prefix } = generateApiKey();

    // Merge permissions with defaults
    const permissions = {
      ...DEFAULT_PERMISSIONS,
      ...(body.permissions || {}),
    };

    // Create service client for database insert
    const serviceSupabase = createServiceClient();

    // Insert the API key into database
    const { data: createdKey, error: insertError } = await serviceSupabase
      .from('api_keys')
      .insert({
        freelancer_id: freelancerRow.id,
        name: body.name.trim(),
        key_hash: hash,
        key_prefix: prefix,
        permissions,
        last_used_at: null,
        request_count: 0,
        expires_at: body.expires_at || null,
        is_active: true,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError || !createdKey) {
      console.error('Failed to create API key:', insertError);
      return NextResponse.json(
        { error: 'Failed to create API key' },
        { status: 500 }
      );
    }

    // Return the key ONLY on creation (never again)
    return NextResponse.json(
      {
        id: createdKey.id,
        name: createdKey.name,
        key_prefix: createdKey.key_prefix,
        key, // ONLY returned here - this is the only time the full key is shown
        permissions: createdKey.permissions,
        last_used_at: createdKey.last_used_at,
        request_count: createdKey.request_count,
        expires_at: createdKey.expires_at,
        is_active: createdKey.is_active,
        created_at: createdKey.created_at,
        message: 'Save your API key securely. You will not be shown it again.',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create API key error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
