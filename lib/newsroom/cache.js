import { cache } from 'react';
import { unstable_cache } from 'next/cache';
import { listNews, getNewsBySlug, listNewsSlugs } from './repo.js';
import { NEWS_TAG } from '../revalidate.js';

/**
 * Cached newsroom readers for the public routes. The admin uses the uncached
 * ones, so an editor sees their own save immediately.
 *
 * The double wrap — React `cache()` outside `unstable_cache` — is the same
 * construction as lib/content/cache.js and lib/corridor/cache.js, and it is
 * there for the same reason: `unstable_cache` alone does not dedupe on a cold
 * entry, so `generateMetadata` and the page component would each miss and each
 * hit the database for the same article, on a pool of five connections.
 *
 * 300 seconds is copied from those modules rather than chosen fresh. The
 * newsroom sits on pages that also render the corridor strip and the advisory
 * bar; three different recovery floors would mean the parts of one page
 * recovering at different moments and briefly disagreeing about what day it is.
 *
 * The floor matters most for the deploy model. The site is built here and
 * shipped, so an entry warmed against a developer's database can be baked into
 * .next/cache and carried into production, where nothing would ever call
 * revalidateNews() for it. lib/corridor/cache.js records that exact accident
 * happening once already.
 */
const RECOVERY_FLOOR_SECONDS = 300;

export const listNewsCached = cache((locale, limit) =>
  unstable_cache(
    () => listNews({ locale, limit }),
    ['news-list', String(locale), String(limit)],
    { tags: [NEWS_TAG], revalidate: RECOVERY_FLOOR_SECONDS },
  )(),
);

export const getNewsBySlugCached = cache((slug, locale) =>
  unstable_cache(
    () => getNewsBySlug(slug, locale),
    ['news-by-slug', String(slug), String(locale)],
    { tags: [NEWS_TAG], revalidate: RECOVERY_FLOOR_SECONDS },
  )(),
);

export const listNewsSlugsCached = cache(() =>
  unstable_cache(() => listNewsSlugs(), ['news-slugs'], {
    tags: [NEWS_TAG],
    revalidate: RECOVERY_FLOOR_SECONDS,
  })(),
);
