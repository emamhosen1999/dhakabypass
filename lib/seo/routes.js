/**
 * Which URLs belong in the sitemap, and — just as importantly — which do not.
 *
 * ---------------------------------------------------------------------------
 * The legacy routes: REDIRECTED, not live
 * ---------------------------------------------------------------------------
 * This comment used to say the unprefixed legacy paths — `/project`,
 * `/project/overview`, `/gallery`, `/contact`, `/stakeholders`,
 * `/economic-impact`, `/latest-updates`, `/routes-facilities`,
 * `/chinese-contribution` — "are live today", and described the cutover as a
 * decision still to be taken. That stopped being true at commit 75eccfd, which
 * took it. Every one of those paths is now a permanent redirect into the
 * localised tree, declared in `next.config.mjs`'s `redirects()`:
 *
 *   /project, /project/overview, /economic-impact  ->  /en/project
 *   /stakeholders                                  ->  /en/about/governance
 *   /chinese-contribution                          ->  /en/about
 *   /routes-facilities                             ->  /en/travel/map
 *   /latest-updates                                ->  /en/news
 *   /gallery                                       ->  /en/gallery
 *   /contact                                       ->  /en/contact
 *
 * and `/` is rewritten to `/en`. The files under `app/(site)/` still exist on
 * disk, but a redirect declared in `next.config.mjs` is matched BEFORE the
 * filesystem, so none of them answers a request any more.
 *
 * The consequence for this file is unchanged, and now for a stronger reason:
 * these paths are still absent from the sitemap. Before, listing them would
 * have set the old English page competing with `/en/...` for the same query.
 * Now they answer 3xx, and a URL that redirects is a "Page with redirect"
 * error in Search Console — the sitemap would be asking Google to index
 * something that no longer exists.
 *
 * They are also still NOT disallowed in robots.txt (see
 * `BUILT_IN_DISALLOW` in lib/seo/settings.js). That remains deliberate and is
 * the part most likely to be "tidied up" by mistake: a `Disallow` stops Google
 * RE-CRAWLING a path, which means it would never see the 301, and the ranking
 * these URLs accumulated would be stranded on a page nobody can reach.
 * Crawlable-but-unlisted is exactly what lets a redirect be honoured.
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
  // Empty, and that is the point. Every localised route that carries content
  // is now a `pages` row rendered by [[...slug]]. /contact, /gallery and /news
  // were the last three code routes (17-news-gallery-contact.sql); the six
  // /travel/* pages went before them (16-travel-pages.sql); the home page's
  // own file went last (18-home-corridor.sql). The list stays so
  // the drift guard in tests/unit/seo-routes.test.js keeps asserting that no
  // new content page.jsx appears under app/[locale] - that is what makes the
  // "no hardcoding" rule enforceable rather than aspirational.
  //
  // The six /travel/* pages used to be listed here. They are now `pages`
  // rows — travel/status, travel/toll, travel/route, travel/map,
  // travel/facilities, travel/rules — rendered by [...slug] and reported by
  // the database read, exactly like the institutional pages. Their page
  // files are gone (16-travel-pages.sql, W1.8). Listing them here as well
  // would emit each URL twice.
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
 * Content routes that must survive a dead database in the sitemap.
 *
 * The travel pages became `pages` rows in W1.8 (16-travel-pages.sql). That
 * moved them to the CONTENT side of the line drawn above — reported by the
 * database read, absent when it fails. For the institutional pages that is the
 * right trade: a page whose purpose is to be filled in later should leave the
 * sitemap when unpublished.
 *
 * It is the wrong trade for the toll page. It is the most-searched page on the
 * site, and a sitemap that drops it during a five-minute outage tells a crawler
 * something false about the site's structure. So these get the same guarantee
 * the front door has: `buildSitemap` pushes them unconditionally, deduplicated
 * against whatever the database did return, and `tests/unit/seo-sitemap.test.js`
 * asserts each one is actually seeded as a `pages` row — so a slug listed here
 * without a row behind it fails the suite rather than emitting a URL that 404s.
 */
export const ESSENTIAL_CONTENT_PATHS = [
  '/contact',
  '/gallery',
  '/news',
  '/travel/status',
  '/travel/toll',
  '/travel/route',
  '/travel/map',
  '/travel/facilities',
  '/travel/rules',
];

/**
 * Localised code routes that exist only to redirect.
 *
 * Empty since W1.31. `app/[locale]/travel/page.jsx` was a bare `redirect()`
 * to `/[locale]/travel/status`; it is now three rows in the `redirects`
 * table (21-travel-redirect.sql), resolved by the catch-all on the 404 path
 * like any operator-configured redirect, so the target can change at
 * /admin/redirects without a deploy. The list stays so the drift guard in
 * `tests/unit/seo-routes.test.js` can still account for every page.jsx on
 * disk: a URL that answers 3xx is a "Page with redirect" error in Search
 * Console, so anything listed here is never emitted.
 */
export const REDIRECT_LOCALISED_PATHS = [];

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
 * Localised code routes that exist for signed-in staff and must NEVER be
 * indexed, listed, or reachable by a visitor.
 *
 * `/[locale]/preview/[id]` is the block editor's draft preview (W1.25). It
 * lives under `app/[locale]/` deliberately: that is the only way it can
 * inherit the real layout and render a draft exactly as the published page
 * will look, instead of through a second copy of the site chrome that would
 * drift from the first. It is session-gated in
 * `app/[locale]/preview/[id]/page.jsx` — an anonymous request is redirected to
 * the admin sign-in — and carries `robots: { index: false, follow: false }`.
 *
 * It is listed here rather than merely omitted so the drift guard in
 * `tests/unit/seo-routes.test.js` can still account for every page.jsx on disk
 * and fail on a genuinely new one. Nothing in this list is ever emitted by
 * `buildSitemap`, which reads STATIC_LOCALISED_PATHS only.
 */
export const PRIVATE_LOCALISED_PATHS = ['/preview/[id]'];

/**
 * The home page is a database row (`pages.slug = 'home'`) rendered by
 * `app/[locale]/[[...slug]]/page.jsx` with an empty slug, so it is normally
 * contributed by the database read. It is named here as well because it is
 * the one URL that must appear even if the database never answers — a sitemap
 * that omits the front door is worse than no sitemap.
 */
export const HOME_PATH = '/';

/**
 * `pages.slug` -> the path under `/[locale]`.
 *
 * The home row is special-cased: it renders at `/[locale]`, not
 * `/[locale]/home`, and `/[locale]/home` permanently redirects to `/[locale]`
 * so the front page is never published at two URLs. Every other
 * slug is served by `app/[locale]/[[...slug]]/page.jsx` at its own name, and
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
