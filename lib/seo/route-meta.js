import { query } from '../db.js';
import { LOCALES, DEFAULT_LOCALE, isLocale } from '../i18n/locales.js';
import { absoluteUrl } from './site.js';

/**
 * `route_meta` — per-route SEO, and the boundary it must not cross.
 *
 * ---------------------------------------------------------------------------
 * WHERE THE LINE IS
 * ---------------------------------------------------------------------------
 * An ordinary public page is a row in `pages` rendered by
 * `app/[locale]/[[...slug]]/page.jsx`, and its title and description already live
 * on `page_translations.seo_title` / `seo_description`. Those columns are the
 * one source of truth for the text of a page that HAS a document.
 *
 *   TEXT — `seo_title`, `seo_description`, `og_image`. A FILL, never an
 *          override. `applyRouteMeta` writes them only where the document left
 *          a gap. Two places holding a title for the same URL, either of which
 *          might be the one in use, is a screen an operator cannot reason
 *          about; one that fills a blank is one they can.
 *
 *          What makes these columns worth having at all is the TEMPLATE route.
 *          `/news/[slug]` is one file on disk and as many URLs as there are
 *          articles; it has no `pages` row and never will, and before this its
 *          fallback metadata was a hardcoded string only a developer could
 *          change.
 *
 *   DIRECTIVES — `robots` and `canonical`. An OVERRIDE, on every route.
 *          `page_translations` has no column that can express either, so there
 *          is nothing to defer to, and an operator who cannot mark a URL
 *          noindex has to ask a developer for a deploy.
 *
 * ---------------------------------------------------------------------------
 * WHAT IS NOT HERE
 * ---------------------------------------------------------------------------
 * Nothing site-level. The `<title>` template, the site description, the
 * favicon, the default share image, the organisation name and the robots.txt
 * mode are one value each for the whole hostname, they belong with the rest of
 * `site_settings`, and they live in `lib/seo/settings.js` behind
 * `/admin/settings`. A per-route table is the wrong shape for a value that has
 * exactly one row.
 */

/* -------------------------------------------------------------------------
 * Pure helpers. No database, no Next, no cache — these are what the tests
 * pin the boundary with.
 * ---------------------------------------------------------------------- */

/**
 * The routes that render database rows one at a time and so have no `pages`
 * row of their own. These are the ones a text row here genuinely helps.
 *
 * Kept in step with `DYNAMIC_LOCALISED_PATHS` in `lib/seo/routes.js` — that
 * list is what the drift guard walks the filesystem against; this one is what
 * `/admin/seo` offers as suggestions.
 */
export const TEMPLATE_ROUTES = ['/news/[slug]'];

/**
 * The only values ever emitted into a robots meta tag.
 *
 * The leading empty string is the "no directive" choice in the admin select —
 * the state an operator returns a route to. Every other entry RESTRICTS.
 * `index,follow` is deliberately absent: it is the default, so emitting it as
 * an explicit tag changes nothing and invites an operator to believe they have
 * made a page rank.
 */
export const ROBOTS_DIRECTIVES = ['', 'noindex', 'nofollow', 'noindex,nofollow'];

const LOCALE_PREFIX = new RegExp(`^/(${LOCALES.join('|')})(/|$)`);

/**
 * A route as it must be stored: locale-less, leading slash, no trailing slash.
 *
 * Throws on a locale-prefixed route rather than silently repairing it. A row
 * keyed `/en/news` would never match — every lookup here is done with the
 * locale-less path and the locale is a separate column — so it would be a row
 * that is silently never read, on a screen that told the operator it saved.
 */
export function normaliseRoute(route) {
  const raw = String(route == null ? '' : route).trim();
  if (!raw || raw === '/') return '/';
  const withSlash = raw.startsWith('/') ? raw : `/${raw}`;
  if (LOCALE_PREFIX.test(withSlash)) {
    throw new Error(
      `Route "${raw}" carries a locale prefix. Store the locale-less path (the locale is a separate field).`,
    );
  }
  const trimmed = withSlash.replace(/\/+$/, '');
  return trimmed || '/';
}

/**
 * Does `route` — which may contain `[segment]` placeholders — address `path`?
 *
 * Segment-wise, never greedy. `/news/[slug]` addresses `/news/vogra-reopens`
 * and does NOT address `/news/a/b` or `/news`: a match across a slash would
 * apply the newsroom's robots directive to routes nobody meant it for.
 */
export function matchesTemplate(route, path) {
  const want = String(route || '').split('/');
  const got = String(path || '').split('/');
  if (want.length !== got.length) return false;
  for (let i = 0; i < want.length; i += 1) {
    const w = want[i];
    if (w.startsWith('[') && w.endsWith(']')) {
      // A placeholder matches exactly one non-empty segment.
      if (!got[i]) return false;
      continue;
    }
    if (w !== got[i]) return false;
  }
  return true;
}

/**
 * Which stored route addresses `path`, or null.
 *
 * An EXACT row always beats a template that would also match, so `/news` is
 * never swallowed by `/news/[slug]`, and a future `/[slug]` template could not
 * capture an `/about` row that names itself.
 */
export function routeForPath(rows, path) {
  let target;
  try {
    target = normaliseRoute(path);
  } catch {
    return null;
  }
  const routes = new Set((rows || []).map((r) => r && r.route).filter(Boolean));
  if (routes.has(target)) return target;
  for (const route of routes) {
    if (route.includes('[') && matchesTemplate(route, target)) return route;
  }
  return null;
}

const text = (v) => (typeof v === 'string' ? v.trim() : '');

/**
 * The resolved metadata for one URL in one locale, or null when this table has
 * nothing to say about it.
 *
 * Null is the important return. It means "change nothing", which is what lets
 * `applyRouteMeta` be called unconditionally from a `generateMetadata` without
 * any risk of an empty row blanking a real title — the case where an operator
 * opened the screen and saved without typing.
 *
 * TEXT falls back PER FIELD, not per row. A Bangla row with a title and no
 * description gives the reader the Bangla title AND the English description;
 * falling back row-wise would throw the Bangla title away along with the
 * missing description.
 *
 * DIRECTIVES are read from the English row, because a robots directive is a
 * fact about the URL and not a translation. If no English row carries one, the
 * first row that does is used rather than dropping the operator's only
 * instruction on the floor.
 */
export function resolveRouteMeta(rows, path, locale) {
  const route = routeForPath(rows, path);
  if (!route) return null;

  const forRoute = (rows || []).filter((r) => r && r.route === route);
  const byLocale = new Map(forRoute.map((r) => [r.locale, r]));
  const mine = byLocale.get(locale);
  const base = byLocale.get(DEFAULT_LOCALE);

  const field = (name) => text(mine && mine[name]) || text(base && base[name]);

  // English first, then whichever row actually declares one.
  const directive = (name) => {
    const preferred = text(base && base[name]);
    if (preferred) return preferred;
    for (const r of forRoute) {
      const v = text(r[name]);
      if (v) return v;
    }
    return '';
  };

  const title = field('seoTitle');
  const description = field('seoDescription');
  const image = field('ogImage');
  const rawRobots = directive('robots').toLowerCase().replace(/\s+/g, '');
  // Allowlist. The column is free text at the database level, so a hand-edited
  // row saying `index, follow, please` must not reach a meta tag verbatim.
  const robots = ROBOTS_DIRECTIVES.includes(rawRobots) ? rawRobots : '';
  const canonical = directive('canonical');

  if (!title && !description && !image && !robots && !canonical) return null;
  return { route, locale, title, description, image, robots, canonical };
}

/** `'noindex,nofollow'` -> the object Next's `metadata.robots` expects. */
function robotsObject(directive) {
  const parts = directive.split(',');
  return { index: !parts.includes('noindex'), follow: !parts.includes('nofollow') };
}

/**
 * Fold a resolved row into a metadata object, honouring the boundary.
 *
 * Returns a NEW object. `generateMetadata` results are handed around and
 * cached; a mutating helper would let one route's directive leak into
 * another's stored metadata.
 */
export function applyRouteMeta(base, meta) {
  if (!meta) return base;
  const out = { ...base };

  // FILL. The document wins wherever it said something.
  if (!text(out.title) && meta.title) out.title = meta.title;
  if (!text(out.description) && meta.description) out.description = meta.description;
  if (meta.image) {
    const og = { ...(out.openGraph || {}) };
    if (!og.images || (Array.isArray(og.images) && og.images.length === 0)) {
      og.images = [{ url: absoluteUrl(meta.image) }];
      out.openGraph = og;
    }
  }

  // OVERRIDE. Nothing else can express these.
  if (meta.robots) out.robots = robotsObject(meta.robots);
  if (meta.canonical) {
    const alternates = { ...(out.alternates || {}) };
    // The hreflang map is a different statement — about which URLs exist — and
    // must survive a canonical override untouched.
    if (alternates.languages) alternates.languages = { ...alternates.languages };
    alternates.canonical = absoluteUrl(meta.canonical);
    out.alternates = alternates;
  }

  return out;
}

/* -------------------------------------------------------------------------
 * Repository. Everything below touches MySQL.
 * ---------------------------------------------------------------------- */

const COLS = 'route, locale, seo_title, seo_description, og_image, robots, canonical, updated_at';

function shape(row) {
  return {
    route: row.route,
    locale: row.locale,
    seoTitle: row.seo_title || '',
    seoDescription: row.seo_description || '',
    ogImage: row.og_image || '',
    robots: row.robots || '',
    canonical: row.canonical || '',
    updatedAt: row.updated_at || null,
  };
}

/**
 * Every stored row, for every route and locale.
 *
 * All of them in one query rather than one query per URL: the table is a
 * handful of rows on a five-connection pool, and the caller
 * (`lib/seo/cache.js`) holds the whole list in one cache entry so a page render
 * costs no query at all. It is also what lets the sitemap answer "which routes
 * are noindex" without a second read.
 *
 * `query()` returns null when no database is configured at all, which is not an
 * error — the site is designed to run without one. An empty list is the correct
 * answer there, and it means "this table says nothing", which every caller
 * already handles.
 */
export async function listRouteMeta() {
  const rows = await query(`SELECT ${COLS} FROM route_meta ORDER BY route, locale`);
  return (rows || []).map(shape);
}

/**
 * Insert or update one route/locale row.
 *
 * Values are normalised here rather than in the action so that a future second
 * caller cannot store a shape the reader will not read. An unrecognised robots
 * directive is stored as empty rather than rejected: the reader would ignore it
 * anyway, and silently keeping an unreadable value is how a screen ends up
 * showing something the site does not do.
 */
export async function saveRouteMeta(entry) {
  const route = normaliseRoute(entry.route);
  const locale = isLocale(entry.locale) ? entry.locale : DEFAULT_LOCALE;
  const robots = String(entry.robots || '').toLowerCase().replace(/\s+/g, '');
  await query(
    `INSERT INTO route_meta (route, locale, seo_title, seo_description, og_image, robots, canonical)
     VALUES (?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       seo_title = VALUES(seo_title), seo_description = VALUES(seo_description),
       og_image = VALUES(og_image), robots = VALUES(robots), canonical = VALUES(canonical)`,
    [
      route,
      locale,
      text(entry.seoTitle).slice(0, 255),
      text(entry.seoDescription),
      text(entry.ogImage).slice(0, 255),
      ROBOTS_DIRECTIVES.includes(robots) ? robots : '',
      text(entry.canonical).slice(0, 255),
    ],
  );
}

/**
 * Remove every locale's row for one route.
 *
 * Deleting is how an operator says "this route has no overrides again" — the
 * same meaning a deleted row has in `ui_strings`. Clearing the fields would
 * leave a row behind that reads as "an operator set this to nothing".
 */
export async function deleteRouteMeta(route) {
  await query('DELETE FROM route_meta WHERE route = ?', [normaliseRoute(route)]);
}
