import { listPublishedPagesForSitemap } from '../lib/seo/pages.js';
import { buildSitemap } from '../lib/seo/sitemap.js';
import { listNewsSlugsCached } from '../lib/newsroom/cache.js';

/**
 * `/sitemap.xml`, generated from the database.
 *
 * Revalidated hourly rather than rendered per request. This runs on a
 * memory-limited shared cPanel box; a crawler hitting the sitemap should not
 * be able to put one MySQL query per hit through the pool, and page content
 * does not change often enough for an hour of staleness to matter.
 */
export const revalidate = 3600;

export default async function sitemap() {
  let pages = [];
  let news = [];
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
  return buildSitemap({ pages, news });
}
