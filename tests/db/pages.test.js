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
    await P.deletePage(pageId);
    expect(await P.getPageBySlug('p')).toBe(null);
    expect(await P.getPageBlocks(pageId)).toEqual([]);
  });
});
