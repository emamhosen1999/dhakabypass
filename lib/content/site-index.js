import { cache } from 'react';
import { unstable_cache } from 'next/cache';
import { query, dbEnabled } from '../db.js';
import { LIST_TAG } from '../revalidate.js';
import { DEFAULT_LOCALE } from '../i18n/locales.js';
import { pathForSlug, localisedPath } from '../seo/routes.js';

/**
 * Every published page with a title, for the `sitemap-list` block.
 *
 * Reads the same rows the XML sitemap reads (lib/seo/pages.js), joined to the
 * titles, and returns them in `nav_order` so the HTML sitemap follows the
 * order the operator gave the pages rather than insertion order. The home
 * row is included and resolves to `/[locale]` through pathForSlug.
 */
export async function listSiteIndex(locale = DEFAULT_LOCALE) {
  if (!dbEnabled()) return [];
  let rows;
  try {
    rows = await query(
      `SELECT p.id, p.slug, p.parent_id, p.nav_order,
              COALESCE(NULLIF(tl.title, ''), te.title, '') AS title
         FROM pages p
         LEFT JOIN page_translations tl ON tl.page_id = p.id AND tl.locale = ? AND tl.status = 'published'
         LEFT JOIN page_translations te ON te.page_id = p.id AND te.locale = ? AND te.status = 'published'
        WHERE p.status = 'published'
        ORDER BY p.nav_order, p.id`,
      [locale, DEFAULT_LOCALE],
    );
  } catch {
    return [];
  }
  return (rows || [])
    .filter((r) => String(r.title || '').trim() !== '')
    .map((r) => ({
      id: r.id,
      slug: r.slug,
      parentId: r.parent_id == null ? null : Number(r.parent_id),
      title: String(r.title).trim(),
      href: localisedPath(pathForSlug(r.slug), locale),
    }));
}

const RECOVERY_FLOOR_SECONDS = 300;

export const listSiteIndexCached = cache((locale) =>
  unstable_cache(() => listSiteIndex(locale), ['site-index', String(locale)], {
    tags: [LIST_TAG],
    revalidate: RECOVERY_FLOOR_SECONDS,
  })(),
);
