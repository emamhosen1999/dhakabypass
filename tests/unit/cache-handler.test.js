import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';

/**
 * W6.18: a revalidation in one process must reach every other. Two copies of
 * the handler module stand in for two Passenger processes sharing the disk.
 */
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dbx-cache-'));
process.env.CACHE_TAGS_FILE = path.join(dir, 'tags.json');
const require = createRequire(import.meta.url);
const load = () => {
  delete require.cache[require.resolve('../../cache-handler.cjs')];
  return require('../../cache-handler.cjs');
};

afterAll(() => fs.rmSync(dir, { recursive: true, force: true }));

describe('cache-handler.cjs', () => {
  let A; let B;
  beforeEach(() => {
    try { fs.unlinkSync(process.env.CACHE_TAGS_FILE); } catch { /* none yet */ }
    A = new (load())();
    B = new (load())();
  });

  it('serves what was set, with its tags', async () => {
    await A.set('k', { kind: 'FETCH', data: 1, tags: ['page:home'] }, { tags: ['page:home'] });
    expect((await A.get('k', { tags: ['page:home'] })).value.data).toBe(1);
  });

  it('a revalidation in another process invalidates this process\'s entry', async () => {
    await A.set('k', { kind: 'FETCH', data: 1, tags: ['corridor'] }, { tags: ['corridor'] });
    await new Promise((r) => setTimeout(r, 5));
    await B.revalidateTag('corridor');
    // Give the filesystem a distinct mtime on coarse clocks.
    await new Promise((r) => setTimeout(r, 20));
    expect(await A.get('k', { tags: ['corridor'] })).toBeNull();
  });

  it('keeps entries whose tags were not revalidated, and entries set after the revalidation', async () => {
    await B.revalidateTag('menus');
    await new Promise((r) => setTimeout(r, 5));
    await A.set('m', { kind: 'FETCH', data: 2, tags: ['menus'] }, { tags: ['menus'] });
    await A.set('c', { kind: 'FETCH', data: 3, tags: ['corridor'] }, { tags: ['corridor'] });
    expect((await A.get('m', { tags: ['menus'] })).value.data).toBe(2);
    expect((await A.get('c', { tags: ['corridor'] })).value.data).toBe(3);
  });

  it('reads page tags from the cache-tags header', async () => {
    await A.set('p', { kind: 'APP_PAGE', headers: { 'x-next-cache-tags': 'a,page:about' } }, {});
    await new Promise((r) => setTimeout(r, 5));
    await B.revalidateTag(['page:about']);
    await new Promise((r) => setTimeout(r, 20));
    expect(await A.get('p', {})).toBeNull();
  });
});
