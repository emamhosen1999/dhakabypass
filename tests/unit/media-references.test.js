import { describe, it, expect } from 'vitest';
import { swapMediaPath } from '../../lib/media/references.js';

describe('swapMediaPath', () => {
  it('swaps a top-level image field', () => {
    const r = swapMediaPath({ image: '/bg-hero.webp', headline: 'Open' }, '/bg-hero.webp', '/uploads/new.webp');
    expect(r.changed).toBe(1);
    expect(r.data).toEqual({ image: '/uploads/new.webp', headline: 'Open' });
  });

  it('swaps images nested inside a list', () => {
    const r = swapMediaPath(
      { items: [{ image: '/photo/20.webp', caption: 'a' }, { image: '/photo/21.webp', caption: 'b' }] },
      '/photo/21.webp', '/uploads/x.webp',
    );
    expect(r.changed).toBe(1);
    expect(r.data.items[1].image).toBe('/uploads/x.webp');
    expect(r.data.items[0].image).toBe('/photo/20.webp');
  });

  it('matches whole strings only, never substrings', () => {
    // The bug this guards: '/photo/2.webp' is a prefix of '/photo/20.webp'.
    // A substring replace would corrupt four aerials while replacing one file.
    const r = swapMediaPath({ items: [{ image: '/photo/20.webp' }] }, '/photo/2.webp', '/uploads/x.webp');
    expect(r.changed).toBe(0);
    expect(r.data.items[0].image).toBe('/photo/20.webp');
  });

  it('leaves richtext prose that merely mentions the filename alone', () => {
    const body = '<p>The old file was called /bg-hero.webp and is being replaced.</p>';
    const r = swapMediaPath({ body }, '/bg-hero.webp', '/uploads/x.webp');
    expect(r.changed).toBe(0);
    expect(r.data.body).toBe(body);
  });

  it('counts every occurrence across the record', () => {
    const r = swapMediaPath(
      { image: '/a.webp', items: [{ image: '/a.webp' }, { image: '/b.webp' }] },
      '/a.webp', '/c.webp',
    );
    expect(r.changed).toBe(2);
  });

  it('preserves non-string values untouched', () => {
    const input = { image: '/a.webp', n: 3, flag: true, empty: null, list: [] };
    const r = swapMediaPath(input, '/a.webp', '/b.webp');
    expect(r.data).toEqual({ image: '/b.webp', n: 3, flag: true, empty: null, list: [] });
  });

  it('is a no-op when from and to are the same, missing or not strings', () => {
    const input = { image: '/a.webp' };
    expect(swapMediaPath(input, '/a.webp', '/a.webp')).toEqual({ data: input, changed: 0 });
    expect(swapMediaPath(input, '', '/b.webp').changed).toBe(0);
    expect(swapMediaPath(input, '/a.webp', null).changed).toBe(0);
    expect(swapMediaPath(input, undefined, undefined).changed).toBe(0);
  });

  it('does not mutate the record it was given', () => {
    const input = { image: '/a.webp', items: [{ image: '/a.webp' }] };
    swapMediaPath(input, '/a.webp', '/b.webp');
    expect(input.image).toBe('/a.webp');
    expect(input.items[0].image).toBe('/a.webp');
  });
});
