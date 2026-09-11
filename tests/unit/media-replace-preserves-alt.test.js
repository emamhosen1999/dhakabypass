/**
 * Replacing the FILE behind a media row must not throw away the row's
 * description or its focal point.
 *
 * The original design reset both, on the reasoning that a sentence written
 * about the old frame is false once the bytes change — and that reasoning was
 * sound while there was nowhere in the admin to write a replacement sentence.
 * There is now (`updateMediaAltAction`), and the trade has inverted: resetting
 * silently deletes work an operator did in three languages, with no undo and
 * no record of what it said, every single time a photograph is swapped.
 * Clearing a description is now its own explicit act — empty the three boxes
 * and save.
 *
 * These tests run `applyMediaReplacement` against a recording `q` rather than a
 * database, so they assert the exact thing that matters: the UPDATE does not
 * name `alt`, `focal_x` or `focal_y` at all, and therefore cannot overwrite
 * them with anything.
 */
import { describe, it, expect } from 'vitest';
import { applyMediaReplacement, pageSlugsUsingMedia } from '../../lib/media/replace.js';

function recorder() {
  const calls = [];
  const q = async (sql, params) => {
    calls.push({ sql, params });
    if (/^\s*UPDATE\s+media/i.test(sql)) return { affectedRows: 1 };
    return [];
  };
  q.calls = calls;
  return q;
}

const notFound = () => new Error('gone');

const run = (q, extra = {}) =>
  applyMediaReplacement(q, {
    id: 4,
    oldPath: '/photo/16.webp',
    newPath: '/uploads/new.webp',
    width: 2400,
    height: 1350,
    bytes: 900000,
    mime: 'image/webp',
    notFound,
    ...extra,
  });

function mediaUpdate(q) {
  return q.calls.find((c) => /^\s*UPDATE\s+media/i.test(c.sql));
}

describe('applyMediaReplacement — the description survives the file', () => {
  it('never writes the alt column', async () => {
    const q = recorder();
    await run(q);
    const update = mediaUpdate(q);
    expect(update).toBeTruthy();
    expect(update.sql).not.toMatch(/\balt\s*=/i);
  });

  it('never writes the focal point', async () => {
    const q = recorder();
    await run(q);
    const update = mediaUpdate(q);
    expect(update.sql).not.toMatch(/\bfocal_x\s*=/i);
    expect(update.sql).not.toMatch(/\bfocal_y\s*=/i);
  });

  it('still rewrites the path, the dimensions, the weight and the origin', async () => {
    const q = recorder();
    await run(q);
    const update = mediaUpdate(q);
    expect(update.sql).toMatch(/\bpath\s*=/i);
    expect(update.sql).toMatch(/\bwidth\s*=/i);
    expect(update.sql).toMatch(/\bheight\s*=/i);
    expect(update.sql).toMatch(/\bbytes\s*=/i);
    expect(update.sql).toMatch(/origin\s*=\s*'upload'/i);
    expect(update.params).toEqual([
      '/uploads/new.webp', 2400, 1350, 900000, 'image/webp', '/photo/16.webp', 4,
    ]);
  });

  it('still throws when the row it was told to replace is gone', async () => {
    const q = async (sql) => (/^\s*UPDATE\s+media/i.test(sql) ? { affectedRows: 0 } : []);
    q.calls = [];
    await expect(run(q)).rejects.toThrow('gone');
  });
});

/**
 * `pageSlugsUsingMedia` — which pages have to be revalidated when a picture's
 * description changes.
 *
 * Blocks reference an image by PATH, and a block's rendered tree carries the
 * alt sentence with it, so editing alt without revalidating those pages leaves
 * the old sentence being read aloud on the live site while the admin screen
 * shows the new one. It reuses the same LIKE prefilter and the same
 * whole-string matching as the replacement itself.
 */
describe('pageSlugsUsingMedia', () => {
  function db(blocks, og = []) {
    const calls = [];
    const q = async (sql, params) => {
      calls.push({ sql, params });
      if (/block_translations/i.test(sql)) return blocks;
      return og;
    };
    q.calls = calls;
    return q;
  }

  it('names the page whose block holds the path as a whole value', async () => {
    const q = db([{ slug: 'home', data: JSON.stringify({ image: '/bg-hero.webp' }) }]);
    await expect(pageSlugsUsingMedia(q, '/bg-hero.webp')).resolves.toEqual(['home']);
  });

  it('names a page whose richtext body embeds the path', async () => {
    const q = db([{ slug: 'project', data: JSON.stringify({ body: '<img src="/a.webp">' }) }]);
    await expect(pageSlugsUsingMedia(q, '/a.webp')).resolves.toEqual(['project']);
  });

  it('ignores a row the LIKE prefilter caught but the path does not really match', async () => {
    const q = db([{ slug: 'home', data: JSON.stringify({ image: '/photo/20.webp' }) }]);
    await expect(pageSlugsUsingMedia(q, '/photo/2.webp')).resolves.toEqual([]);
  });

  it('does not repeat a slug that uses the picture in several blocks', async () => {
    const q = db([
      { slug: 'home', data: JSON.stringify({ image: '/a.webp' }) },
      { slug: 'home', data: JSON.stringify({ items: [{ image: '/a.webp' }] }) },
    ]);
    await expect(pageSlugsUsingMedia(q, '/a.webp')).resolves.toEqual(['home']);
  });

  it('includes a page that uses the picture only as its social preview', async () => {
    const q = db([], [{ slug: 'news' }]);
    await expect(pageSlugsUsingMedia(q, '/a.webp')).resolves.toEqual(['news']);
  });

  it('skips a hand-edited row whose JSON no longer parses rather than throwing', async () => {
    const q = db([{ slug: 'home', data: '{not json' }]);
    await expect(pageSlugsUsingMedia(q, '/a.webp')).resolves.toEqual([]);
  });

  it('returns nothing for an empty path instead of scanning', async () => {
    const q = db([{ slug: 'home', data: JSON.stringify({ image: '/a.webp' }) }]);
    await expect(pageSlugsUsingMedia(q, '')).resolves.toEqual([]);
    expect(q.calls).toHaveLength(0);
  });
});
