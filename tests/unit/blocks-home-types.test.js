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

describe('media-prose block', () => {
  it('is registered and requires a heading', () => {
    expect(getBlock('media-prose')).toBeTruthy();
    expect(validateBlockData('media-prose', { heading: '' }).ok).toBe(false);
  });

  it('accepts a full record', () => {
    const r = validateBlockData('media-prose', {
      image: '/bypass-ex.webp', side: 'right', heading: 'What this road does',
      body: '<p>Real prose.</p>', linkLabel: 'The route', linkHref: '/en/travel/route',
      caption: 'The open carriageway near Mirer Bazar.',
    });
    expect(r.ok).toBe(true);
  });
});

describe('figure-grid block', () => {
  it('is registered and takes a list of items', () => {
    expect(getBlock('figure-grid')).toBeTruthy();
    expect(validateBlockData('figure-grid', {
      heading: 'The corridor', intro: '', linkLabel: '', linkHref: '',
      items: [{ image: '/photo/1.webp', caption: 'Open carriageway' }],
    }).ok).toBe(true);
  });

  it('rejects a non-array items value', () => {
    expect(validateBlockData('figure-grid', { heading: 'x', items: 'nope' }).ok).toBe(false);
  });
});

describe('card-grid block', () => {
  it('is registered and takes a list of cards', () => {
    expect(getBlock('card-grid')).toBeTruthy();
    expect(validateBlockData('card-grid', {
      heading: 'Connections', intro: '',
      items: [{ title: 'N1', body: 'Dhaka-Chattogram', meta: 'South' }],
    }).ok).toBe(true);
  });
});
