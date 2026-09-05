/**
 * Which URLs belong in the sitemap, and — just as importantly — which do not.
 *
 * ---------------------------------------------------------------------------
 * The legacy routes, and what should happen to them
 * ---------------------------------------------------------------------------
 * `app/(site)/` still serves the old site at the unprefixed paths: `/`,
 * `/project`, `/project/overview`, `/gallery`, `/contact`, `/stakeholders`,
 * `/economic-impact`, `/latest-updates`, `/routes-facilities`,
 * `/chinese-contribution`. They are live today and they are on the plan's
 * "never modify" list, so they keep working.
 *
 * They are deliberately NOT in this sitemap. A sitemap is a statement about
 * which URLs an operator wants indexed and returning as search results, and
 * these are the pages being replaced. Listing them would ask Google to keep
 * them fresh in the index at exactly the moment we want the localised
 * `/[locale]/` tree to take over, and would leave the legacy English page
 * competing with `/en/...` for the same query.
 *
 * What should happen to them at cutover — recorded here rather than decided
 * silently, because it is a decision for the Boss, not for this file:
 *
 *   1. 301 each legacy path to its localised replacement, once a replacement
 *      exists. `next.config.mjs` already does exactly this for four dead paths
 *      from the site before this one (`/about-project` -> `/project/overview`
 *      and friends), and there is a `redirects` TABLE in the schema
 *      (`scripts/db-setup-v2.mjs`) that was built for this and is unused. A
 *      301 preserves the ranking these URLs have accumulated; deleting them
 *      throws it away. This is the recommended path.
 *   2. Only the pages that actually have a localised replacement can be
 *      redirected. `/gallery`, `/contact` and `/stakeholders` currently have
 *      none — `/[locale]/` has a home page and the `travel/*` tree and nothing
 *      else. Redirecting a page to something that does not answer the same
 *      question is worse than leaving it alone, so the legacy pages stay
 *      reachable and unlisted until their replacements ship.
 *   3. Until then they are neither in the sitemap nor blocked in robots.txt.
 *      That combination is intentional: robots.txt `Disallow` would stop
 *      Google RE-CRAWLING them, which means it would never see the eventual
 *      301 and the ranking would be stranded. Unlisted-but-crawlable is what
 *      lets a redirect be honoured later.
 *
 * Nothing here removes a legacy page. That is a separate decision with a
 * separate blast radius.
 *
 * ---------------------------------------------------------------------------
 * The list below
 * ---------------------------------------------------------------------------
 * These are the localised routes that exist as CODE under `app/[locale]/`,
 * expressed without their locale prefix. They are not rows in `pages`, so no
 * database read can discover them and no database outage can remove them —
 * which is why the sitemap can still answer with these when MySQL is down.
 *
 * `tests/unit/seo-routes.test.js` walks `app/[locale]/` and fails if this list
 * and the filesystem disagree, so adding a route without listing it here is
 * caught rather than silently unindexed.
 */
export const STATIC_LOCALISED_PATHS = [
  '/contact',
  '/gallery',
  '/news',
  '/travel/facilities',
  '/travel/map',
  '/travel/route',
  '/travel/rules',
  '/travel/status',
  '/travel/toll',
];

/**
 * The institutional pages — about, governance, project, safety, sustainability,
 * procurement, disclosures, land acquisition, tariff notifications and
 * grievances — are NOT listed here.
 *
 * They are rows in `pages`, rendered by `app/[locale]/[...slug]/page.jsx`, so
 * the database read already contributes them to the sitemap and listing them
 * here as well would emit each URL twice. The distinction this file draws is
 * between routes that exist as CODE (which no query can discover, and which a
 * database outage must not remove from the sitemap) and routes that exist as
 * CONTENT (which an editor can unpublish, and which should then leave the
 * sitemap). Content is the right side of that line for a page whose whole
 * purpose is to be filled in by DBEDC later.
 */

/**
 * Localised code routes that exist only to redirect.
 *
 * `app/[locale]/travel/page.jsx` is a bare `redirect()` to
 * `/[locale]/travel/status` — it has no content of its own. Listing a URL that
 * answers 3xx in a sitemap is a Search Console error ("Page with redirect"),
 * so these are tracked separately and never emitted. They are listed rather
 * than merely omitted so the drift guard in
 * `tests/unit/seo-routes.test.js` can still account for every page.jsx on disk
 * and fail on a genuinely new one.
 */
export const REDIRECT_LOCALISED_PATHS = ['/travel'];

/**
 * Localised code routes that render database rows one at a time, so the set of
 * URLs behind them is not knowable from the filesystem.
 *
 * `/news/[slug]` is one route on disk and as many URLs as there are published
 * articles. `buildSitemap` emits those from `listNewsSlugs()` rather than from
 * this file, so listing the pattern here would put the literal string
 * `/news/[slug]` in the sitemap. They are named so the drift guard in
 * tests/unit/seo-routes.test.js can still account for every page.jsx on disk
 * and fail on a genuinely new one.
 */
export const DYNAMIC_LOCALISED_PATHS = ['/news/[slug]'];

/**
 * The home page is a database row (`pages.slug = 'home'`) rendered by
 * `app/[locale]/page.jsx`, so it is normally contributed by the database read.
 * It is named here as well because it is the one URL that must appear even if
 * the database never answers — a sitemap that omits the front door is worse
 * than no sitemap.
 */
export const HOME_PATH = '/';

/**
 * `pages.slug` -> the path under `/[locale]`.
 *
 * The home row is special-cased: it renders at `/[locale]`, not
 * `/[locale]/home`, and `/[locale]/home` is not a route at all. Every other
 * slug is served by `app/[locale]/[...slug]/page.jsx` at its own name, and
 * slugs are already stored path-shaped (`about/partners`), so they pass
 * through with a leading slash added.
 */
export function pathForSlug(slug) {
  const s = String(slug || '').trim().replace(/^\/+|\/+$/g, '');
  if (!s || s === 'home') return HOME_PATH;
  return `/${s}`;
}

/**
 * A locale-less path plus a locale -> the real URL path.
 *
 * `localisedPath('/', 'bn')`            -> `/bn`
 * `localisedPath('/travel/toll', 'zh')` -> `/zh/travel/toll`
 *
 * There is no unprefixed form of a localised page. `/` is the LEGACY site's
 * home page, not this one's, so `/en` is the English URL and nothing collapses
 * to the bare root.
 */
export function localisedPath(path, locale) {
  const p = String(path || '/');
  return p === '/' ? `/${locale}` : `/${locale}${p.startsWith('/') ? '' : '/'}${p}`;
}
