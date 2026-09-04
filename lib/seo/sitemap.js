import { LOCALES } from '../i18n/locales.js';
import { absoluteUrl } from './site.js';
import { STATIC_LOCALISED_PATHS, HOME_PATH, pathForSlug, localisedPath } from './routes.js';
import { localeAlternates } from './alternates.js';

/**
 * Builds the sitemap entry list. Pure: it takes rows and returns entries, so
 * the draft-exclusion and locale-fan-out rules can be tested without a
 * database and without a running server.
 *
 * Shape returned is Next's `MetadataRoute.Sitemap` — `app/sitemap.js` returns
 * it verbatim and Next serialises the XML.
 */

/** Coerce whatever MySQL handed back into a Date, or null. */
function asDate(value) {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** The later of two possibly-null dates. */
function latest(a, b) {
  if (!a) return b;
  if (!b) return a;
  return a.getTime() >= b.getTime() ? a : b;
}

/**
 * `lastModified` for one locale of one page.
 *
 * `pages.updated_at` moves when the page itself changes; each locale's
 * `page_translations.updated_at` moves when that locale's title/description
 * change. The honest answer for `/bn` is the later of the two.
 *
 * A locale with no PUBLISHED translation row still gets an entry — the page
 * renders there via the English fallback — but its timestamp comes from the
 * page alone. Using an unpublished row's `updated_at` would advertise a
 * freshness that nothing visible on that URL reflects.
 */
export function lastModifiedFor(page, locale) {
  const pageAt = asDate(page.updatedAt);
  const tr = (page.translations || []).find(
    (t) => t.locale === locale && t.status === 'published',
  );
  return latest(pageAt, tr ? asDate(tr.updatedAt) : null);
}

/**
 * @param {object} args
 * @param {Array} args.pages rows from `listPublishedPagesForSitemap()`; `[]`
 *   when the database is unreachable. NEVER contains a draft — the query
 *   filters, and `buildSitemap` filters again below, because a sitemap that
 *   leaks an unpublished URL hands the public a page the operator has not
 *   agreed to show, and one defensive `filter` is cheaper than that.
 */
export function buildSitemap({ pages = [] } = {}) {
  const entries = [];
  const seen = new Set();

  const push = (path, lastModified, priority) => {
    for (const locale of LOCALES) {
      const url = absoluteUrl(localisedPath(path, locale));
      if (seen.has(url)) continue;
      seen.add(url);
      const entry = {
        url,
        changeFrequency: path === HOME_PATH ? 'daily' : 'weekly',
        priority,
        // Sitemap-level hreflang, mirroring the page-level tags from
        // `alternatesFor`. Google accepts either; emitting both is the
        // belt-and-braces the documentation actually recommends, and costs
        // nothing here because the URLs are already computed.
        alternates: { languages: localeAlternates(path) },
      };
      const at = typeof lastModified === 'function' ? lastModified(locale) : lastModified;
      // Only set the key when a real timestamp exists. An entry with no
      // lastModified says "I don't know"; one with `new Date()` says "changed
      // just now", which for a code route that has not changed in weeks is a
      // lie that trains crawlers to ignore the field.
      if (at) entry.lastModified = at;
      entries.push(entry);
    }
  };

  const published = pages.filter((p) => p && p.status === 'published');
  for (const page of published) {
    const path = pathForSlug(page.slug);
    push(path, (locale) => lastModifiedFor(page, locale), path === HOME_PATH ? 1 : 0.7);
  }

  // The home page always appears, even with an empty `pages` array — a dead
  // database must not produce a sitemap missing the front door. `seen` makes
  // this a no-op on the normal path where the database returned the home row.
  push(HOME_PATH, null, 1);

  // Code routes. No database row exists for these, so nothing can tell us when
  // they last changed and they carry no `lastModified` (see the comment above).
  for (const path of STATIC_LOCALISED_PATHS) push(path, null, 0.8);

  return entries;
}
