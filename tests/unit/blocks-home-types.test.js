import { describe, it, expect, beforeAll } from 'vitest';
import { getBlock, validateBlockData, defaultBlockData } from '../../lib/blocks/registry.js';

beforeAll(async () => { await import('../../lib/blocks/index.js'); });

describe('hero block', () => {
  it('is registered', () => {
    expect(getBlock('hero')).toBeTruthy();
  });

  it('requires a headline', () => {
    const r = validateBlockData('hero', { headline: '' });
    expect(r.ok).toBe(false);
    expect(r.errors.join(' ')).toMatch(/headline/i);
  });

  it('accepts a full record', () => {
    const r = validateBlockData('hero', {
      image: '/bg-hero.webp', eyebrow: 'Dhaka Bypass Expressway',
      headline: 'Eighteen kilometres open', standfirst: 'Vogra to K21, tolled.',
      primaryLabel: 'Toll rates', primaryHref: '/en/travel/toll',
      secondaryLabel: "What's open", secondaryHref: '/en/travel/status',
    });
    expect(r).toEqual({ ok: true, errors: [] });
  });

  it('has a default record with every field present', () => {
    const d = defaultBlockData('hero');
    for (const k of ['image', 'eyebrow', 'headline', 'standfirst',
      'primaryLabel', 'primaryHref', 'secondaryLabel', 'secondaryHref']) {
      expect(d).toHaveProperty(k);
    }
  });
});
