import { describe, it, expect } from 'vitest';
import { generatePortalSlug } from '@/lib/utils/slug';

describe('generatePortalSlug', () => {
  it('returns a 12-character string', () => {
    const slug = generatePortalSlug();
    expect(slug).toHaveLength(12);
  });

  it('only contains lowercase alphanumeric characters', () => {
    const slug = generatePortalSlug();
    expect(slug).toMatch(/^[a-z0-9]+$/);
  });

  it('generates unique slugs', () => {
    const slugs = new Set(Array.from({ length: 100 }, () => generatePortalSlug()));
    expect(slugs.size).toBe(100);
  });
});
