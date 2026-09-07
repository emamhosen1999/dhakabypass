import { cache } from 'react';
import { unstable_cache } from 'next/cache';
import { listRouteMeta, resolveRouteMeta } from './route-meta.js';
import { getSeoSettings, SEO_DEFAULTS } from './settings.js';
import { ROUTE_META_TAG, SEO_TAG } from '../revalidate.js';

/**
 * Cached SEO readers for the public routes. The admin uses the uncached ones,
 * so an editor always sees what is actually stored.
 *
 * TWO mechanisms bound staleness, not one — the same pair, and for the same
 * reason, as lib/content/cache.js and lib/corridor/cache.js.
 *
 * Tag invalidation is the fast path: an admin save calls revalidateSeo() or
 * revalidateRouteMeta() and the change is live without a rebuild.
 *
 * `revalidate: RECOVERY_FLOOR_SECONDS` is the recovery floor for everything
 * that is NOT an admin save, and it exists because of the deploy model: this
 * site is built LOCALLY and shipped with `git pull`, so an entry warmed against
 * the developer's own database travels to production inside .next/cache. With
 * tags alone nothing in production would ever evict it — lib/corridor/cache.js
 * records that exact accident happening once already. 300s is taken from those
 * readers rather than picked fresh, so a page's title and its body recover at
 * the same moment instead of briefly disagreeing.
 *
 * Each is also wrapped in React's `cache()`, for the reason spelled out in
 * lib/content/cache.js: on a cold entry, `generateMetadata` and the page
 * component would otherwise each miss and each hit the database.
 *
 * ---------------------------------------------------------------------------
 * WHY THE SAFE WRAPPERS EXIST
 * ---------------------------------------------------------------------------
 * These readers feed the ROOT layout's <title> and /sitemap.xml. A throw in the
 * first is a 500 on every page on the hostname; a throw in the second can get
 * the sitemap dropped from Search Console entirely. So the three functions a
 * route actually calls — routeMetaFor, listNoindexRoutesCached, siteSeoCached —
 * each swallow a failure and return the "says nothing" answer. The raw cached
 * readers are exported too, because the tests pin their cache options and
 * because a caller that wants to know about a failure should be able to.
 */
const RECOVERY_FLOOR_SECONDS = 300;

/**
 * Every `route_meta` row, in one entry.
 *
 * One list rather than a keyed lookup per URL: the table is small, every render
 * needs at most one row out of it, and a single entry means one tag to evict
 * and one query per five minutes for the whole site.
 */
export const listRouteMetaCached = cache(() =>
  unstable_cache(() => listRouteMeta(), ['route-meta-all'], {
    tags: [ROUTE_META_TAG],
    revalidate: RECOVERY_FLOOR_SECONDS,
  })(),
);

export const getSeoSettingsCached = cache((locale) =>
  unstable_cache(() => getSeoSettings(locale), ['seo-settings', String(locale)], {
    tags: [SEO_TAG],
    revalidate: RECOVERY_FLOOR_SECONDS,
  })(),
);

/**
 * The resolved `route_meta` for one URL, or null.
 *
 * Null means "change nothing", which is also what a database outage produces —
 * so a route that folds this into its metadata with `applyRouteMeta` degrades
 * to exactly the metadata it had before this feature existed.
 */
export async function routeMetaFor(path, locale) {
  let rows;
  try {
    rows = await listRouteMetaCached();
  } catch {
    return null;
  }
  return resolveRouteMeta(rows || [], path, locale);
}

/**
 * The routes an operator has marked noindex, for the sitemap's filter.
 *
 * An empty list on failure is the right degradation: it lists a URL the
 * operator hid, which Search Console reports as a warning, where a throw is a
 * 500 on /sitemap.xml.
 */
export async function listNoindexRoutesCached() {
  let rows;
  try {
    rows = await listRouteMetaCached();
  } catch {
    return [];
  }
  const routes = new Set();
  for (const row of rows || []) {
    if (row && typeof row.robots === 'string' && row.robots.includes('noindex')) {
      routes.add(row.route);
    }
  }
  return [...routes];
}

/**
 * Site-level SEO that CANNOT fail.
 *
 * `getSeoSettings` already degrades internally, so reaching the catch here
 * means something outside it broke — the cache layer, a serialisation, an
 * import. The root layout still gets a title.
 */
export async function siteSeoCached(locale) {
  try {
    const seo = await getSeoSettingsCached(locale);
    return seo || SEO_DEFAULTS;
  } catch {
    return SEO_DEFAULTS;
  }
}
