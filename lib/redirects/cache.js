import { cache } from 'react';
import { unstable_cache } from 'next/cache';
import { listRedirects } from './repo.js';
import { REDIRECTS_TAG } from '../revalidate.js';

/**
 * The redirect table, cached.
 *
 * This is read on requests that were about to 404, so the cost of a miss is
 * already low — but a crawler working through a list of dead legacy URLs would
 * otherwise issue one query per URL, and that is exactly the traffic pattern
 * this table exists to serve. One cached read of the whole table covers all of
 * them.
 *
 * Same double wrap and same 300-second recovery floor as every other reader
 * here; the reasoning is in lib/content/cache.js.
 */
const RECOVERY_FLOOR_SECONDS = 300;

export const listRedirectsCached = cache(() =>
  unstable_cache(() => listRedirects(), ['redirects'], {
    tags: [REDIRECTS_TAG],
    revalidate: RECOVERY_FLOOR_SECONDS,
  })(),
);
