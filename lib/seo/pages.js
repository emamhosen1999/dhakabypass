import { query } from '../db.js';

/**
 * The sitemap's own read of the `pages` tree.
 *
 * Separate from `lib/content/pages.js` on purpose: `listPages()` there returns
 * every page regardless of status and no timestamps, because it exists to fill
 * an admin table. A sitemap needs the opposite — published rows only, with the
 * real `updated_at` from both the page and each locale's translation, in ONE
 * query. Filtering the admin list in JavaScript would ship draft slugs to a
 * public route handler and rely on a filter never being edited away.
 *
 * `p.status = 'published'` is in the WHERE clause, not in application code, so
 * a draft page cannot reach the caller at all.
 */
export async function listPublishedPagesForSitemap() {
  const rows = await query(`
    SELECT p.id, p.slug, p.status, p.updated_at AS page_updated_at,
           t.locale, t.status AS translation_status, t.updated_at AS translation_updated_at
    FROM pages p
    LEFT JOIN page_translations t ON t.page_id = p.id
    WHERE p.status = 'published'
    ORDER BY p.id, t.locale
  `);

  // `query()` returns null when the database is not configured at all
  // (lib/db.js `dbEnabled()`), which is not an error — the site is designed to
  // run without one. An empty list is the correct answer there.
  if (!rows) return [];

  const byId = new Map();
  for (const row of rows) {
    let page = byId.get(row.id);
    if (!page) {
      page = {
        id: row.id,
        slug: row.slug,
        status: row.status,
        updatedAt: row.page_updated_at,
        translations: [],
      };
      byId.set(row.id, page);
    }
    // LEFT JOIN: a page with no translation rows at all yields one row with a
    // null locale. It is still a real published page and still gets its
    // entries; it just has nothing per-locale to date them by.
    if (row.locale) {
      page.translations.push({
        locale: row.locale,
        status: row.translation_status,
        updatedAt: row.translation_updated_at,
      });
    }
  }
  return [...byId.values()];
}
