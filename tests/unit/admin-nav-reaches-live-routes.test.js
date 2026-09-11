// The admin advertised three screens that edit a website nobody can reach.
//
// `next.config.mjs` 308s every legacy path to /en/*, so the whole app/(site)/
// tree is unreachable — but /admin/pages, /admin/section/[key] and
// /admin/gallery still edited the `content` and `gallery_images` tables that
// feed it. `gallery_images` is worse than stale: no public page reads it at
// all. The dashboard sat on top of that claiming "Every heading, paragraph,
// statistic, news article, and image on the site is editable here."
//
// This guards the nav against pointing at a dead tree again. It reads the
// source rather than rendering, because the layout is an async server
// component behind an auth redirect.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '../..');
const read = (p) => readFileSync(path.join(root, p), 'utf8');

/**
 * Strip comments before asserting over source. Both files explain the retired
 * screens in prose — including quoting the false claim this test exists to
 * keep out — and that documentation must not be what trips the assertion.
 */
const stripComments = (src) =>
  src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

const layout = read('app/admin/(dash)/layout.jsx');
const dashboard = stripComments(read('app/admin/(dash)/page.jsx'));

/** Every `href:` inside the NAV array literal. */
function navHrefs(src) {
  const block = src.slice(src.indexOf('const NAV = ['), src.indexOf('];', src.indexOf('const NAV = [')));
  return [...block.matchAll(/href:\s*'([^']+)'/g)].map((m) => m[1]);
}

// Routes whose edits cannot reach a live URL. They still resolve — deleting
// them is W6.1 — but nothing may advertise them.
const RETIRED = ['/admin/pages', '/admin/section', '/admin/gallery'];

describe('admin navigation only offers screens that reach the live site', () => {
  const hrefs = navHrefs(layout);

  it('finds the nav', () => {
    expect(hrefs.length).toBeGreaterThan(5);
  });

  it('offers no retired screen', () => {
    const dead = hrefs.filter((h) => RETIRED.some((r) => h === r || h.startsWith(`${r}/`)));
    expect(dead).toEqual([]);
  });

  it('offers the block editor, which is what actually edits every page', () => {
    expect(hrefs).toContain('/admin/pages-v2');
  });
});

describe('the dashboard describes what it can actually change', () => {
  it('drops the claim that everything on the site is editable from it', () => {
    expect(dashboard).not.toMatch(/Every heading, paragraph, statistic/);
  });

  it('links nowhere retired', () => {
    const hrefs = [...dashboard.matchAll(/href="([^"]+)"|href:\s*'([^']+)'/g)]
      .map((m) => m[1] ?? m[2])
      .filter((h) => h.startsWith('/admin/'));
    const dead = hrefs.filter((h) => RETIRED.some((r) => h === r || h.startsWith(`${r}/`)));
    expect(dead).toEqual([]);
  });

  it('counts live tables, not the retired content store', () => {
    // `getAllContent`/`getGalleryImages` read the dead `content` and
    // `gallery_images` tables. Counting them told the operator a number that
    // meant nothing about the public site.
    expect(dashboard).not.toMatch(/getAllContent|getGalleryImages/);
    expect(dashboard).toMatch(/listPages/);
  });
});
