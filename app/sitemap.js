import { listPublishedPagesForSitemap } from '../lib/seo/pages.js';
import { buildSitemap } from '../lib/seo/sitemap.js';
import { listNewsSlugsCached } from '../lib/newsroom/cache.js';
import { listNoindexRoutesCached } from '../lib/seo/cache.js';

/**
 * `/sitemap.xml`, generated from the database.
 *
 * Revalidated hourly rather than rendered per request. This runs on a
 * memory-limited shared cPanel box; a crawler hitting the sitemap should not
 * be able to put one MySQL query per hit through the pool, and page content
 * does not change often enough for an hour of staleness to matter.
 *
 * The hour is a CEILING that this route no longer actually reaches, and both
 * halves of that are deliberate.
 *
 * It used to be the only path to freshness. That became a real problem the
 * moment route_meta gave an operator a noindex switch: they would hide a page,
 * the page would stop being indexed, and this file would keep advertising it
 * for up to another hour - producing exactly the "Submitted URL marked
 * noindex" error in Search Console that hiding it was meant to avoid. So the
 * save actions at /admin/seo and /admin/settings call
 * `revalidatePath('/sitemap.xml')`, which discards this route's rendered
 * output as well as the cached data behind it. That is the fast path.
 *
 * The effective revalidation is now 5 minutes rather than 60, and `next build`
 * reports it as such: Next takes the MINIMUM of this export and the revalidate
 * on every `unstable_cache` entry read while rendering, and
 * `listNoindexRoutesCached` carries the project's 300-second recovery floor.
 * That is the right trade and not an accident - it costs at most twelve small
 * queries an hour instead of one, and it means the recovery floor covers a
 * production entry baked into .next/cache by the local build (see
 * lib/seo/cache.js) rather than being papered over by the longer window here.
 * The hour stays declared because it is the honest ceiling for the page and
 * news reads, which have no such floor of their own.
 */
export const revalidate = 3600;

export default async function sitemap() {
  let pages = [];
  let news = [];
  // Returns [] on failure rather than throwing, on purpose: an empty list
  // leaves a hidden URL listed, which is a Search Console warning, where a
  // throw is a 500 - and a 500 here can get the sitemap dropped from Search
  // Console altogether.
  const noindex = await listNoindexRoutesCached();
  // Settled independently: a failure reading the newsroom must not cost the
  // sitemap its pages, and vice versa. Promise.all would let either one empty
  // the whole file.
  try {
    news = await listNewsSlugsCached();
  } catch {
    news = [];
  }
  try {
    pages = await listPublishedPagesForSitemap();
  } catch {
    // A dead or unreachable database must NOT 500 this route. The static
    // localised routes in lib/seo/routes.js are compiled in and remain
    // completely correct without any database at all, so a degraded sitemap
    // is strictly better than an error page: a 500 here can get the whole
    // sitemap dropped from Search Console, while a short sitemap just gets
    // fewer URLs crawled until the database comes back.
    pages = [];
  }
  return buildSitemap({ pages, news, noindex });
}
