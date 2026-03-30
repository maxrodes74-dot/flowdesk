import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { ApiKeyPermissions } from '@/lib/api-keys/types';

interface UpdateApiKeyInput {
  name?: string;
  permissions?: Partial<ApiKeyPermissions>;
  is_active?: boolean;
}

/**
 * PUT /api/api-keys/[id]
 * Update API key properties (name, permissions, is_active)
 * Session auth required
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

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

    // Verify the API key belongs to this freelancer
    const { data: apiKeyRecord, error: keyError } = await supabase
      .from('api_keys')
      .select('*')
      .eq('id', id)
      .eq('freelancer_id', freelancerRow.id)
      .single();

    if (keyError || !apiKeyRecord) {
      return NextResponse.json(
        { error: 'API key not found' },
        { status: 404 }
      );
    }

    // Parse request body
    let body: UpdateApiKeyInput;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    // Validate input
    if (body.name !== undefined) {
      if (typeof body.name !== 'string' || body.name.trim() === '') {
        return NextResponse.json(
          { error: 'name must be a non-empty string' },
          { status: 400 }
        );
      }
    }

    if (body.is_active !== undefined && typeof body.is_active !== 'boolean') {
      return NextResponse.json(
        { error: 'is_active must be a boolean' },
        { status: 400 }
      );
    }

    // Build update object
    const updateData: Record<string, unknown> = {};

    if (body.name !== undefined) {
      updateData.name = body.name.trim();
    }

    if (body.permissions !== undefined) {
      // Merge with existing permissions
      updateData.permissions = {
        ...(apiKeyRecord.permissions as Record<string, unknown>),
        ...body.permissions,
      };
    }

    if (body.is_active !== undefined) {
      updateData.is_active = body.is_active;
    }

    // If nothing to update, return current key
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({
        id: apiKeyRecord.id,
        name: apiKeyRecord.name,
        key_prefix: apiKeyRecord.key_prefix,
        permissions: apiKeyRecord.permissions,
        last_used_at: apiKeyRecord.last_used_at,
        request_count: apiKeyRecord.request_count,
        expires_at: apiKeyRecord.expires_at,
        is_active: apiKeyRecord.is_active,
        created_at: apiKeyRecord.created_at,
      });
    }

    // Update the API key
    const { data: updatedKey, error: updateError } = await supabase
      .from('api_keys')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (updateError || !updatedKey) {
      console.error('Failed to update API key:', updateError);
      return NextResponse.json(
        { error: 'Failed to update API key' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      id: updatedKey.id,
      name: updatedKey.name,
      key_prefix: updatedKey.key_prefix,
      permissions: updatedKey.permissions,
      last_used_at: updatedKey.last_used_at,
      request_count: updatedKey.request_count,
      expires_at: updatedKey.expires_at,
      is_active: updatedKey.is_active,
      created_at: updatedKey.created_at,
    });
  } catch (error) {
    console.error('Update API key error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/api-keys/[id]
 * Hard delete the API key
 * Session auth required
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

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

    // Verify the API key belongs to this freelancer
    const { data: apiKeyRecord, error: keyError } = await supabase
      .from('api_keys')
      .select('id')
      .eq('id', id)
      .eq('freelancer_id', freelancerRow.id)
      .single();

    if (keyError || !apiKeyRecord) {
      return NextResponse.json(
        { error: 'API key not found' },
        { status: 404 }
      );
    }

    // Delete the API key
    const { error: deleteError } = await supabase
      .from('api_keys')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Failed to delete API key:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete API key' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: 'API key deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Delete API key error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
