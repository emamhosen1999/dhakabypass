// tests/unit/slug.test.js
import { describe, it, expect } from 'vitest';
import { normalizeSlug, isValidSlug } from '../../lib/content/slug.js';

describe('normalizeSlug', () => {
  it('lowercases and hyphenates', () => {
    expect(normalizeSlug('Travel Info')).toBe('travel-info');
  });

  it('keeps nesting separators', () => {
    expect(normalizeSlug('Travel/Toll Rates')).toBe('travel/toll-rates');
  });

  it('strips leading and trailing separators', () => {
    expect(normalizeSlug('/travel/')).toBe('travel');
  });

  it('rejects an empty or unsafe slug', () => {
    expect(isValidSlug('')).toBe(false);
    expect(isValidSlug('../etc')).toBe(false);
    expect(isValidSlug('travel/toll')).toBe(true);
  });

  it('caps a very long title to a slug that still passes isValidSlug', () => {
    // pages.slug is VARCHAR(191); 150 is the cap normalizeSlug enforces.
    const longTitle = Array.from({ length: 30 }, (_, i) => `Section Word ${i}`).join(' ');
    expect(longTitle.length).toBeGreaterThan(300);
    const slug = normalizeSlug(longTitle);
    expect(slug.length).toBeLessThanOrEqual(150);
    expect(isValidSlug(slug)).toBe(true);
  });
});
