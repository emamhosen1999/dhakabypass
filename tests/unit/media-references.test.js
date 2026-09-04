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

/**
 * media-prose.body and rich-text.body are richtext: a raw-HTML textarea in the
 * admin, rendered with dangerouslySetInnerHTML. An operator can paste an <img>
 * into one, and that string is never EQUAL to the bare path, so whole-string
 * matching never touched it. The old file is still in public/, so nothing 404s
 * — the picture just never changes, and nobody finds out.
 */
describe('swapMediaPath inside richtext markup', () => {
  it('repoints an image pasted into a prose body', () => {
    const r = swapMediaPath(
      { body: '<p>Before</p><img src="/photo/18.webp" alt="Paver"><p>After</p>' },
      '/photo/18.webp', '/uploads/new.webp',
    );
    expect(r.changed).toBe(1);
    expect(r.data.body).toBe('<p>Before</p><img src="/uploads/new.webp" alt="Paver"><p>After</p>');
  });

  it('handles single quotes, spacing around the equals sign and a self-closing tag', () => {
    const r = swapMediaPath(
      { body: "<img src = '/a.webp' /><img SRC=\"/a.webp\">" },
      '/a.webp', '/b.webp',
    );
    expect(r.changed).toBe(2);
    expect(r.data.body).toBe("<img src = '/b.webp' /><img SRC=\"/b.webp\">");
  });

  it('repoints an unquoted src, which is still valid HTML', () => {
    const r = swapMediaPath({ body: '<img src=/a.webp>' }, '/a.webp', '/b.webp');
    expect(r.changed).toBe(1);
    expect(r.data.body).toBe('<img src=/b.webp>');
  });

  it('counts every occurrence in one body', () => {
    const r = swapMediaPath(
      { body: '<img src="/a.webp"><p>x</p><img src="/a.webp">' },
      '/a.webp', '/b.webp',
    );
    expect(r.changed).toBe(2);
    expect(r.data.body).not.toContain('/a.webp');
  });

  it('NEVER matches a shorter path inside a longer one', () => {
    // The corruption a plain replaceAll would cause: '/photo/2.webp' is a
    // prefix of '/photo/20.webp' through '/photo/23.webp', four aerials that
    // carry the middle of the home page.
    const body = '<img src="/photo/20.webp"><img src="/photo/23.webp">';
    const r = swapMediaPath({ body }, '/photo/2.webp', '/uploads/x.webp');
    expect(r.changed).toBe(0);
    expect(r.data.body).toBe(body);
  });

  it('leaves the path alone in prose, in an href and in an unknown attribute', () => {
    // This repoints pictures. It does not edit copy, and it does not guess at
    // attributes whose meaning it does not know.
    const body =
      '<p>The old /a.webp is going.</p><a href="/a.webp">link</a><div data-x="/a.webp"></div>';
    const r = swapMediaPath({ body }, '/a.webp', '/b.webp');
    expect(r.changed).toBe(0);
    expect(r.data.body).toBe(body);
  });

  it('rewrites the markup and the plain image field of the same block together', () => {
    const r = swapMediaPath(
      { image: '/a.webp', body: '<p>Text</p><img src="/a.webp">' },
      '/a.webp', '/b.webp',
    );
    expect(r.changed).toBe(2);
    expect(r.data.image).toBe('/b.webp');
    expect(r.data.body).toBe('<p>Text</p><img src="/b.webp">');
  });

  it('treats a path with regex metacharacters literally', () => {
    const r = swapMediaPath({ body: '<img src="/a.webp">' }, '/a+webp', '/b.webp');
    expect(r.changed).toBe(0);
    expect(r.data.body).toBe('<img src="/a.webp">');
  });

  it('does not mutate a record whose markup it rewrites', () => {
    const input = { body: '<img src="/a.webp">', items: [{ body: '<img src="/a.webp">' }] };
    swapMediaPath(input, '/a.webp', '/b.webp');
    expect(input.body).toBe('<img src="/a.webp">');
    expect(input.items[0].body).toBe('<img src="/a.webp">');
  });
});
