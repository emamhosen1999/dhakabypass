import fs from 'node:fs';
import path from 'node:path';

/**
 * The editable surface of the site, grouped for the admin UI.
 *
 * Page bodies were auto-extracted from the original markup, so their fields are
 * described by content/schema/<slug>.json (label/type/section per key). The
 * hand-authored site sections (header/footer/home) are edited as structured
 * objects instead.
 */

export const SITE_SECTIONS = [
  { key: 'site.header', title: 'Header & Navigation', group: 'Global' },
  { key: 'site.footer', title: 'Footer', group: 'Global' },
  { key: 'home.hero', title: 'Home — Hero', group: 'Home' },
  { key: 'home.overview', title: 'Home — Project Overview', group: 'Home' },
  { key: 'home.economicImpact', title: 'Home — Economic Impact', group: 'Home' },
  { key: 'home.route', title: 'Home — Expressway Route', group: 'Home' },
  { key: 'home.callout', title: 'Home — Callout', group: 'Home' },
  { key: 'home.meta', title: 'Home — SEO', group: 'Home' },
  { key: 'page.gallery', title: 'Gallery — Intro', group: 'Pages' },
  { key: 'page.notFound', title: '404 Page', group: 'Pages' },
];

export const PAGE_SECTIONS = [
  { key: 'page.project', title: 'Project', slug: 'project' },
  { key: 'page.project/overview', title: 'Project — Overview', slug: 'project__overview' },
  { key: 'page.economic-impact', title: 'Economic Impact', slug: 'economic-impact' },
  { key: 'page.routes-facilities', title: 'Routes & Facilities', slug: 'routes-facilities' },
  { key: 'page.stakeholders', title: 'Stakeholders', slug: 'stakeholders' },
  { key: 'page.chinese-contribution', title: 'Chinese Contribution', slug: 'chinese-contribution' },
  { key: 'page.latest-updates', title: 'Latest Updates', slug: 'latest-updates' },
  { key: 'page.contact', title: 'Contact', slug: 'contact' },
];

/** Field descriptors for an auto-extracted page (label/type/section per key). */
export function getPageSchema(slug) {
  try {
    const p = path.join(process.cwd(), 'content', 'schema', `${slug}.json`);
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch {
    return [];
  }
}

export function findPage(key) {
  return PAGE_SECTIONS.find((p) => p.key === key);
}
