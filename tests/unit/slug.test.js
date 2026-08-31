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
});
