import { query, dbEnabled } from '../db.js';
import { DEFAULT_LOCALE } from '../i18n/locales.js';

/**
 * Title and one-line description for a set of pages, in one language, with
 * English standing in where a translation is blank.
 *
 * Read by the section index (the `cards` layout of `section-subnav`), so a hub
 * page can say what each of its pages is FOR rather than list their names. The
 * description is the page's own search description from its settings panel —
 * the same sentence a search engine shows under the title — so there is no
 * second field for an editor to keep in step, and a page with none simply
 * shows its title.
 */
export async function pageSummaries(slugs, locale = DEFAULT_LOCALE) {
  const wanted = [...new Set((slugs || []).map((s) => String(s || '').replace(/^\/+|\/+$/g, '')).filter(Boolean))];
  if (!wanted.length || !dbEnabled()) return {};
  let rows;
  try {
    rows = await query(
      `SELECT p.slug,
              COALESCE(NULLIF(tl.title, ''), te.title, '') AS title,
              COALESCE(NULLIF(tl.seo_description, ''), te.seo_description, '') AS description
         FROM pages p
         LEFT JOIN page_translations tl ON tl.page_id = p.id AND tl.locale = ? AND tl.status = 'published'
         LEFT JOIN page_translations te ON te.page_id = p.id AND te.locale = ? AND te.status = 'published'
        WHERE p.status = 'published' AND p.slug IN (${wanted.map(() => '?').join(',')})`,
      [locale, DEFAULT_LOCALE, ...wanted],
    );
  } catch {
    return {};
  }
  return Object.fromEntries((rows || []).map((r) => [r.slug, {
    title: String(r.title || '').trim(),
    description: String(r.description || '').trim(),
  }]));
}
