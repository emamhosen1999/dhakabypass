import { cache } from 'react';
import { unstable_cache } from 'next/cache';
import { getPageBySlug, getPageBlocks } from './pages.js';
import { pageTag, LIST_TAG } from '../revalidate.js';

/**
 * Cached readers used by the public routes. The admin uses the uncached ones.
 *
 * Each is also wrapped in React's `cache()`. `unstable_cache` alone only
 * dedupes once its underlying entry is warm — on a cold entry (first hit,
 * or right after a revalidate), two concurrent calls with the same key
 * (e.g. `generateMetadata` and the page component both loading the same
 * slug in one request) each miss and each hit the database. `cache()`
 * memoizes on arguments within a single request/render, so the second
 * call reuses the first call's in-flight promise instead of racing it to
 * the database.
 *
 * TWO mechanisms bound staleness here, not one — the same pair, and for the
 * same reason, as every reader in lib/corridor/cache.js.
 *
 * Tag invalidation is the fast path: revalidatePage(slug) fires pageTag(slug)
 * and LIST_TAG, and every admin save calls it, so an editor's change shows
 * immediately.
 *
 * `revalidate: RECOVERY_FLOOR_SECONDS` is the recovery floor for everything
 * that is NOT an admin save. It matters here because of the deploy model: the
 * site is built LOCALLY and shipped to the server with `git pull`, so a
 * cache entry warmed against the developer's own database is baked into
 * .next/cache and carried to production inside the build. With tags alone
 * there is no time-based recovery from that at all — nothing in production
 * ever calls revalidatePage() for it, so the developer's row would be served
 * forever. This is not hypothetical: lib/corridor/cache.js records that it
 * already happened once during testing, which is why the corridor readers
 * carry the floor. The page readers had none, so the identical failure was
 * still open on every page body and title on the site.
 *
 * 300s is taken from those corridor readers rather than picked fresh: two
 * different floors on the two halves of the same page would mean a page's
 * blocks and its corridor figures recovering at different moments and briefly
 * disagreeing with each other. Five minutes is short enough that a bad entry
 * cannot survive a deploy unnoticed, and long enough that the ordinary reader
 * traffic these pages get does not turn the cache into a pass-through.
 */
const RECOVERY_FLOOR_SECONDS = 300;

export const getPageBySlugCached = cache((slug) =>
  unstable_cache(() => getPageBySlug(slug), ['page-by-slug', slug], {
    tags: [pageTag(slug), LIST_TAG],
    revalidate: RECOVERY_FLOOR_SECONDS,
  })()
);

export const getPageBlocksCached = cache((pageId, slug) =>
  unstable_cache(() => getPageBlocks(pageId), ['page-blocks', String(pageId)], {
    tags: [pageTag(slug)],
    revalidate: RECOVERY_FLOOR_SECONDS,
  })()
);
