import { LOCALES } from '../i18n/locales.js';
import { absoluteUrl } from './site.js';
import { STATIC_LOCALISED_PATHS, ESSENTIAL_CONTENT_PATHS, HOME_PATH, pathForSlug, localisedPath } from './routes.js';
import { localeAlternates } from './alternates.js';
import { matchesTemplate, normaliseRoute } from './route-meta.js';

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
 * @param {Array} args.news rows from `listNewsSlugs()` — `{ slug, published_at }`
 *   for published articles only, `[]` when the database is unreachable. Kept
 *   separate from `pages` because news lives in its own table with its own
 *   publish flag, and because an empty list here must not remove the rest of
 *   the sitemap.
 * @param {Array} args.noindex locale-less routes an operator has marked
 *   `noindex` in `route_meta`, from `listNoindexRoutesCached()`; `[]` when the
 *   database is unreachable.
 *
 *   A sitemap ASKS a crawler to index a URL and the meta tag on that page tells
 *   it not to. The two statements contradict each other, and Google reports the
 *   pair as "Submitted URL marked noindex" — a red error in Search Console
 *   against a page the operator deliberately hid, which is a confusing way to
 *   be told your own instruction worked. So a hidden URL leaves the sitemap.
 *
 *   Entries may be TEMPLATES (`/news/[slug]`). One such row hides an unbounded
 *   set of URLs; matching only exact paths would silently leave every article
 *   listed.
 */
export function buildSitemap({ pages = [], news = [], noindex = [] } = {}) {
  const entries = [];
  const seen = new Set();

  const hidden = [];
  for (const route of noindex || []) {
    try {
      hidden.push(normaliseRoute(route));
    } catch {
      // A locale-prefixed or otherwise unstorable route cannot match anything
      // here anyway. Dropping it beats failing the whole sitemap over one row.
    }
  }

  const isHidden = (path) => {
    // The front door always stays. A sitemap missing the site's own root is
    // worse than one carrying a contradiction, and marking the home page
    // noindex is far more likely to be a mistake than an instruction. The tag
    // on the page still applies — this only refuses to also delete `/` here.
    if (path === HOME_PATH) return false;
    for (const route of hidden) {
      if (route === path) return true;
      if (route.includes('[') && matchesTemplate(route, path)) return true;
    }
    return false;
  };

  const push = (path, lastModified, priority) => {
    if (isHidden(path)) return;
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

  // Essential content routes — the travel pages — get the same guarantee as
  // the front door, for the same reason. On the normal path the database
  // returned them above with a real lastModified and `seen` makes this a
  // no-op; on the outage path this is what keeps the toll page in the sitemap.
  for (const path of ESSENTIAL_CONTENT_PATHS) push(path, null, 0.8);

  // Code routes. No database row exists for these, so nothing can tell us when
  // they last changed and they carry no `lastModified` (see the comment above).
  for (const path of STATIC_LOCALISED_PATHS) push(path, null, 0.8);

  // News articles. Lower priority than the standing pages: an operational
  // notice from last year matters less to a searcher than the toll rates do,
  // and telling a crawler otherwise spends its budget in the wrong place.
  //
  // `published_at` is the publication DATE, which is the honest lastModified
  // for an article that has not been edited since — and unlike a code route,
  // a news item genuinely does have a date attached to it.
  for (const item of news) {
    if (!item || !item.slug) continue;
    push(`/news/${item.slug}`, asDate(item.published_at), 0.5);
  }

  return entries;
}
