// Two Phase 0 defects that were invisible to the rest of the suite because
// nothing asserted over the config or the seed as data.
//
// 0.8  The gallery shipped blank. Every `media` row in 02-seed.sql carried
//      in_gallery=0, and only 03-content-recovery.sql flipped four on — a
//      SEPARATE manual phpMyAdmin import. Import the main seed alone, as any
//      fresh install does, and /en/gallery rendered empty.
//
// 0.12 Three legacy URLs 404'd, and four redirects pointed at ANOTHER legacy
//      path that then 308'd again. A browser follows a chain, so nobody
//      noticed; but each hop dilutes the link equity the old inbound links
//      carry, and a chain is one broken link from a dead end.
import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import nextConfig from '../../next.config.mjs';

const root = path.resolve(import.meta.dirname, '../..');
const read = (p) => readFileSync(path.join(root, p), 'utf8');

describe('02-seed.sql populates the gallery on its own', () => {
  const seed = read('db/sql/02-seed.sql');

  const mediaRows = seed
    .split('\n')
    .filter((l) => l.startsWith('INSERT IGNORE INTO `media`'));

  it('ships media rows', () => {
    expect(mediaRows.length).toBeGreaterThan(0);
  });

  it('flags at least one of them for the gallery', () => {
    // `in_gallery` is the last column in the INSERT, so the row ends `,1);`.
    const shown = mediaRows.filter((l) => /,1\);\s*$/.test(l));
    expect(shown.length).toBeGreaterThan(0);
  });

  it('keeps the recovery import idempotent rather than duplicating the flags', () => {
    // 03 may still set the same rows; it must stay guarded so a re-import is
    // safe. The point of 0.8 is that the MAIN seed no longer depends on it.
    const recovery = read('db/sql/03-content-recovery.sql');
    expect(recovery).toMatch(/NOT EXISTS|IGNORE|IF NOT EXISTS/);
  });
});

describe('legacy redirects resolve in a single hop', () => {
  let redirects;
  beforeAll(async () => {
    redirects = await nextConfig.redirects();
  });

  it('exposes the legacy map', () => {
    expect(Array.isArray(redirects)).toBe(true);
    expect(redirects.length).toBeGreaterThan(0);
  });

  it('never points one redirect at the source of another', () => {
    const sources = new Set(redirects.map((r) => r.source));
    const chained = redirects.filter((r) => sources.has(r.destination));
    expect(
      chained.map((r) => `${r.source} -> ${r.destination}`),
    ).toEqual([]);
  });

  it('sends the three orphaned /project/* paths somewhere real', () => {
    for (const orphan of ['/project/route', '/project/impact', '/project/timeline']) {
      const hit = redirects.find((r) => r.source === orphan);
      expect(hit, `${orphan} has no redirect and returns 404`).toBeTruthy();
      expect(hit.destination).toMatch(/^\/en\//);
    }
  });

  it('keeps every legacy redirect permanent', () => {
    expect(redirects.every((r) => r.permanent === true)).toBe(true);
  });
});
