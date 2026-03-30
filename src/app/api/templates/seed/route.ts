// =============================================================
// MTR-293: Template Seeding — Initialize System Templates
// POST /api/templates/seed  — seeds system templates into database
// Idempotent: checks if already seeded, avoids duplicates
// =============================================================

import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import { SYSTEM_TEMPLATES } from '@/lib/templates/seed-data';

/**
 * Seed system templates into the database.
 * Idempotent: checks if templates already exist before inserting.
 * Uses service client to bypass RLS.
 */
export async function POST(request: NextRequest) {
  // Optional: Verify API key or auth header for safety
  const authHeader = request.headers.get('Authorization');
  const apiKey = process.env.SEED_API_KEY;

  if (apiKey && authHeader !== `Bearer ${apiKey}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const service = createServiceClient();

  try {
    // Check if system templates already exist
    const { data: existingTemplates, error: checkError } = await service
      .from('templates')
      .select('id')
      .eq('is_system', true)
      .limit(1);

    if (checkError) {
      return NextResponse.json(
        { error: `Check error: ${checkError.message}` },
        { status: 500 }
      );
    }

    // If templates already exist, return early
    if (existingTemplates && existingTemplates.length > 0) {
      return NextResponse.json({
        message: 'System templates already seeded',
        skipped: true,
        count: 0,
      });
    }

    // Prepare templates for insertion
    const now = new Date().toISOString();
    const templatesWithMetadata = SYSTEM_TEMPLATES.map((template) => ({
      ...template,
      is_system: true,
      freelancer_id: null,
      created_at: now,
      updated_at: now,
    }));

    // Insert all templates
    const { data: insertedTemplates, error: insertError, count } = await service
      .from('templates')
      .insert(templatesWithMetadata)
      .select('id, type, name, tier_required');

    if (insertError) {
      return NextResponse.json(
        { error: `Insert error: ${insertError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        message: 'System templates seeded successfully',
        count: insertedTemplates?.length || SYSTEM_TEMPLATES.length,
        templates: insertedTemplates || [],
      },
      { status: 201 }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

/**
 * GET endpoint for checking seed status
 */
export async function GET(_request: NextRequest) {
  const service = createServiceClient();

  try {
    const { data: templates, error } = await service
      .from('templates')
      .select('id, type, name, tier_required, is_system')
      .eq('is_system', true)
      .order('type', { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      seeded: (templates?.length || 0) > 0,
      count: templates?.length || 0,
      templates: templates || [],
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
