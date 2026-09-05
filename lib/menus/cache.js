import { cache } from 'react';
import { unstable_cache } from 'next/cache';
import { getMenu } from './repo.js';
import { MENUS_TAG } from '../revalidate.js';

/**
 * Cached menus.
 *
 * The header and footer render on EVERY page, so this is the one reader whose
 * cost is paid site-wide. Both the double wrap and the 300-second floor matter
 * more here than anywhere else: without `cache()` the header and footer would
 * each miss separately on a cold entry, doubling the queries on the busiest
 * code path on the site.
 */
const RECOVERY_FLOOR_SECONDS = 300;

export const getMenuCached = cache((slug, locale) =>
  unstable_cache(() => getMenu(slug, locale), ['menu', String(slug), String(locale)], {
    tags: [MENUS_TAG],
    revalidate: RECOVERY_FLOOR_SECONDS,
  })(),
);
