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
 */
export const getPageBySlugCached = cache((slug) =>
  unstable_cache(() => getPageBySlug(slug), ['page-by-slug', slug], {
    tags: [pageTag(slug), LIST_TAG],
  })()
);

export const getPageBlocksCached = cache((pageId, slug) =>
  unstable_cache(() => getPageBlocks(pageId), ['page-blocks', String(pageId)], {
    tags: [pageTag(slug)],
  })()
);
