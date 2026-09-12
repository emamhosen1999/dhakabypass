import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { execFileSync } from 'node:child_process';

const DB = process.env.DB_NAME_TEST;
process.env.DB_NAME = DB; // lib/db.js reads this

let P;
beforeAll(async () => {
  execFileSync('node', ['scripts/db-setup-v2.mjs', `--database=${DB}`], { stdio: 'inherit' });
  P = await import('../../lib/content/pages.js');
});

beforeEach(async () => {
  const { query } = await import('../../lib/db.js');
  await query('DELETE FROM pages');
});

afterAll(async () => {
  const { getPool } = await import('../../lib/db.js');
  const pool = getPool();
  if (pool) await pool.end();
});

describe('pages', () => {
  it('creates a page with an English title and finds it by slug', async () => {
    const id = await P.createPage({ slug: 'travel', title: 'Travel Info' });
    const page = await P.getPageBySlug('travel');
    expect(page.id).toBe(id);
    expect(page.translations.find((t) => t.locale === 'en').title).toBe('Travel Info');
  });

  it('returns null for an unknown slug', async () => {
    expect(await P.getPageBySlug('nope')).toBe(null);
  });

  it('adds blocks and returns them in sort order', async () => {
    const pageId = await P.createPage({ slug: 'p', title: 'P' });
    const a = await P.addBlock({ pageId, type: 'rich-text', data: { heading: 'A', body: '<p>a</p>' } });
    const b = await P.addBlock({ pageId, type: 'rich-text', data: { heading: 'B', body: '<p>b</p>' } });
    const blocks = await P.getPageBlocks(pageId);
    expect(blocks.map((x) => x.id)).toEqual([a, b]);
    expect(blocks[0].translations[0]).toMatchObject({ locale: 'en', status: 'published' });
  });

  it('reorders blocks', async () => {
    const pageId = await P.createPage({ slug: 'p', title: 'P' });
    const a = await P.addBlock({ pageId, type: 'rich-text', data: { body: '<p>a</p>' } });
    const b = await P.addBlock({ pageId, type: 'rich-text', data: { body: '<p>b</p>' } });
    await P.reorderBlocks(pageId, [b, a]);
    expect((await P.getPageBlocks(pageId)).map((x) => x.id)).toEqual([b, a]);
  });

  it('duplicates a block with all of its translations', async () => {
    const pageId = await P.createPage({ slug: 'p', title: 'P' });
    const a = await P.addBlock({ pageId, type: 'rich-text', data: { body: '<p>a</p>' } });
    await P.saveBlockTranslation({ blockId: a, locale: 'bn', data: { body: '<p>ক</p>' }, status: 'published' });
    const copy = await P.duplicateBlock(a);
    const blocks = await P.getPageBlocks(pageId);
    const dup = blocks.find((x) => x.id === copy);
    expect(dup.translations.map((t) => t.locale).sort()).toEqual(['bn', 'en']);
  });

  it('duplicates a whole page as a draft, with every block and translation (W1.23)', async () => {
    const src = await P.createPage({ slug: 'about', title: 'About' });
    const a = await P.addBlock({ pageId: src, type: 'hero', data: { headline: 'H' } });
    const b = await P.addBlock({ pageId: src, type: 'rich-text', data: { body: '<p>a</p>' } });
    await P.saveBlockTranslation({ blockId: b, locale: 'bn', data: { body: '<p>ক</p>' }, status: 'published' });
    await P.reorderBlocks(src, [b, a]);

    const copyId = await P.duplicatePage({ sourceId: src, slug: 'about-2', titleSuffix: (l) => (l === 'bn' ? ' (কপি)' : ' (copy)') });
    const copy = await P.getPageBySlug('about-2');
    expect(copy.id).toBe(copyId);
    // Never live by accident: the page and its translations are drafts.
    expect(copy.status).toBe('draft');
    expect(copy.translations.find((t) => t.locale === 'en').status).toBe('draft');
    expect(copy.translations.find((t) => t.locale === 'en').title).toBe('About (copy)');

    const blocks = await P.getPageBlocks(copyId);
    expect(blocks.map((x) => x.type)).toEqual(['rich-text', 'hero']); // the reordered order survives
    expect(blocks[0].translations.map((t) => t.locale).sort()).toEqual(['bn', 'en']);
    expect(blocks.every((x) => x.id !== a && x.id !== b)).toBe(true); // new rows, not shared ones

    // The source is untouched.
    const original = await P.getPageBlocks(src);
    expect(original).toHaveLength(2);
  });

  it('refuses to duplicate onto an existing address and leaves nothing behind', async () => {
    const src = await P.createPage({ slug: 'a', title: 'A' });
    await P.createPage({ slug: 'b', title: 'B' });
    await expect(P.duplicatePage({ sourceId: src, slug: 'b' })).rejects.toMatchObject({ code: 'DUPLICATE_SLUG' });
    await expect(P.duplicatePage({ sourceId: 999999, slug: 'c' })).rejects.toMatchObject({ code: 'NOT_FOUND' });
    expect(await P.getPageBySlug('c')).toBe(null);
  });

  it('keeps the version being overwritten as a revision, and a first save keeps nothing (W1.13)', async () => {
    const R = await import('../../lib/content/revisions.js');
    const pageId = await P.createPage({ slug: 'p', title: 'P' });
    const a = await P.addBlock({ pageId, type: 'rich-text', data: { body: '<p>first</p>' } });
    // addBlock wrote the first English row; the first explicit save keeps THAT.
    await P.saveBlockTranslation({ blockId: a, locale: 'en', data: { body: '<p>second</p>' }, status: 'published' });
    await P.saveBlockTranslation({ blockId: a, locale: 'en', data: { body: '<p>third</p>' }, status: 'published' });
    const revs = await R.listRevisions(a, 'en');
    expect(revs.map((r) => r.data.body)).toEqual(['<p>second</p>', '<p>first</p>']);
    // Another locale's first save has nothing to keep.
    await P.saveBlockTranslation({ blockId: a, locale: 'bn', data: { body: '<p>ক</p>' }, status: 'draft' });
    expect(await R.listRevisions(a, 'bn')).toEqual([]);
    // A revision resolves back to its block and locale.
    const one = await R.getRevision(revs[0].id);
    expect(one).toMatchObject({ blockId: a, locale: 'en', status: 'published', data: { body: '<p>second</p>' } });
  });

  it('trims history to the newest KEEP versions per block and locale', async () => {
    const R = await import('../../lib/content/revisions.js');
    const pageId = await P.createPage({ slug: 'p', title: 'P' });
    const a = await P.addBlock({ pageId, type: 'rich-text', data: { body: '<p>0</p>' } });
    for (let i = 1; i <= R.KEEP + 5; i += 1) {
      await P.saveBlockTranslation({ blockId: a, locale: 'en', data: { body: `<p>${i}</p>` }, status: 'draft' });
    }
    const revs = await R.listRevisions(a, 'en', 100);
    expect(revs).toHaveLength(R.KEEP);
    expect(revs[0].data.body).toBe(`<p>${R.KEEP + 4}</p>`);
  });

  it('saves a translation and reports its status', async () => {
    const pageId = await P.createPage({ slug: 'p', title: 'P' });
    const a = await P.addBlock({ pageId, type: 'rich-text', data: { body: '<p>a</p>' } });
    await P.saveBlockTranslation({ blockId: a, locale: 'zh', data: { body: '<p>中</p>' }, status: 'draft' });
    const [block] = await P.getPageBlocks(pageId);
    expect(block.translations.find((t) => t.locale === 'zh').status).toBe('draft');
  });

  it('removes blocks when the page is deleted', async () => {
    const pageId = await P.createPage({ slug: 'p', title: 'P' });
    await P.addBlock({ pageId, type: 'rich-text', data: { body: '<p>a</p>' } });
    await P.deletePageUnchecked(pageId);
    expect(await P.getPageBySlug('p')).toBe(null);
    expect(await P.getPageBlocks(pageId)).toEqual([]);
  });

  it('deletePageIfChildless refuses to delete a page with children, and the page still exists afterwards', async () => {
    const parentId = await P.createPage({ slug: 'travel', title: 'Travel' });
    await P.createPage({ slug: 'travel/toll', title: 'Toll', parentId });

    await expect(P.deletePageIfChildless(parentId)).rejects.toMatchObject({
      code: 'HAS_CHILDREN',
      childCount: 1,
    });

    expect(await P.getPageBySlug('travel')).not.toBe(null);
  });

  it('deletePageIfChildless deletes a page that has no children', async () => {
    const pageId = await P.createPage({ slug: 'lonely', title: 'Lonely' });
    await P.deletePageIfChildless(pageId);
    expect(await P.getPageBySlug('lonely')).toBe(null);
  });

  it('reorderBlocks throws when given a partial list, and the stored order is unchanged afterwards', async () => {
    const pageId = await P.createPage({ slug: 'p', title: 'P' });
    const a = await P.addBlock({ pageId, type: 'rich-text', data: { body: '<p>a</p>' } });
    const b = await P.addBlock({ pageId, type: 'rich-text', data: { body: '<p>b</p>' } });
    const c = await P.addBlock({ pageId, type: 'rich-text', data: { body: '<p>c</p>' } });

    // Try to reorder with only 2 of 3 blocks
    await expect(P.reorderBlocks(pageId, [b, a])).rejects.toThrow('reorderBlocks needs every block id for the page');

    // Verify order is unchanged
    expect((await P.getPageBlocks(pageId)).map((x) => x.id)).toEqual([a, b, c]);
  });

  it('reorderBlocks throws when given an id from a different page', async () => {
    const page1 = await P.createPage({ slug: 'p1', title: 'P1' });
    const page2 = await P.createPage({ slug: 'p2', title: 'P2' });
    const b1 = await P.addBlock({ pageId: page1, type: 'rich-text', data: { body: '<p>a</p>' } });
    const b2 = await P.addBlock({ pageId: page2, type: 'rich-text', data: { body: '<p>b</p>' } });

    // Try to reorder page1 with block from page2
    await expect(P.reorderBlocks(page1, [b2])).rejects.toThrow('reorderBlocks needs every block id for the page');

    // Verify original order is unchanged
    expect((await P.getPageBlocks(page1)).map((x) => x.id)).toEqual([b1]);
  });

  it('reorderBlocks throws when given a duplicate-padded array, and order is unchanged', async () => {
    const pageId = await P.createPage({ slug: 'p', title: 'P' });
    const a = await P.addBlock({ pageId, type: 'rich-text', data: { body: '<p>a</p>' } });
    const b = await P.addBlock({ pageId, type: 'rich-text', data: { body: '<p>b</p>' } });

    // Try to reorder with duplicate in the list: [a, a, b] has 3 elements but only 2 unique ids
    await expect(P.reorderBlocks(pageId, [a, a, b])).rejects.toThrow('reorderBlocks needs every block id for the page');

    // Verify order is unchanged (still [a, b])
    expect((await P.getPageBlocks(pageId)).map((x) => x.id)).toEqual([a, b]);
  });

  it('duplicateBlock on a nonexistent id rejects, and creates no new block row', async () => {
    const pageId = await P.createPage({ slug: 'p', title: 'P' });
    const a = await P.addBlock({ pageId, type: 'rich-text', data: { body: '<p>a</p>' } });
    const blockCountBefore = (await P.getPageBlocks(pageId)).length;

    await expect(P.duplicateBlock(999999)).rejects.toThrow('Block 999999 not found');

    const blockCountAfter = (await P.getPageBlocks(pageId)).length;
    expect(blockCountAfter).toBe(blockCountBefore);
  });

  it('createPage with a duplicate slug rejects, and leaves no orphan pages row', async () => {
    await P.createPage({ slug: 'unique', title: 'First' });

    // Try to create with duplicate slug
    await expect(P.createPage({ slug: 'unique', title: 'Second' })).rejects.toThrow();

    // Count pages with slug 'unique' — should still be 1 (no orphan)
    const { query } = await import('../../lib/db.js');
    const rows = await query('SELECT id FROM pages WHERE slug = ?', ['unique']);
    expect(rows.length).toBe(1);
  });
});
