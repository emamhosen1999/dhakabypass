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

describe('13-travel-rules.sql fills a page that three links already point at', () => {
  // app/[locale]/travel/rules/page.jsx looks for the slug `travel/rules`.
  // 02-seed.sql seeds eleven pages and none is it, so the page shipped its
  // empty state while TravelSubnav, the homepage CTA and the safety hero all
  // linked to it.
  const sql = read('db/sql/13-travel-rules.sql');

  it('seeds the slug the route actually looks for', () => {
    expect(sql).toMatch(/'travel\/rules'/);
  });

  it('gives it blocks in all three locales', () => {
    for (const locale of ['en', 'bn', 'zh']) {
      expect(sql, `no ${locale} translation`).toMatch(new RegExp(`,'${locale}','`));
    }
  });

  it('is re-importable, like every other numbered file', () => {
    expect(sql).toMatch(/INSERT IGNORE/);
    expect(sql).not.toMatch(/\bDROP\b|\bTRUNCATE\b/);
  });

  it('marks the unsourced rules as pending rather than inventing them', () => {
    // Speed limits, breakdown rules and lane discipline are not sourced. The
    // house convention is a visible db-pending callout naming what DBEDC owes,
    // used in 129 other places — not a plausible-looking number.
    expect(sql).toMatch(/db-pending/);
  });

  it('never publishes the design speed as a limit', () => {
    // The legacy site printed "design speed 80 km/h". A design speed is the
    // engineering basis for the geometry and is routinely higher than the
    // posted limit, so publishing it would tell drivers they may lawfully do
    // 80 where the gazette may say 60. It may appear only inside a callout
    // that says exactly that.
    //
    // Comments are stripped first: the file's own header explains the
    // design-speed trap and quotes the figure, and that documentation must not
    // be what trips the assertion.
    const published = sql.replace(/^\s*--.*$/gm, '');
    const claims = published.match(/[^<>"]{0,80}80\s*km\/h[^<>"]{0,80}/g) || [];
    for (const claim of claims) {
      expect(claim, `80 km/h stated without the design-speed caveat: ${claim}`)
        .toMatch(/design/i);
    }
  });
});
