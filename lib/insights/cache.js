import { unstable_cache } from 'next/cache';
import { readSnapshots } from './repo.js';
import { INSIGHTS_TAG } from '../revalidate.js';

/**
 * The admin screen's read.
 *
 * Six rows of a small table, cached for five minutes and invalidated by the
 * nightly cron. The screen is staff-only and rarely open, so the cache is
 * about not re-reading on every navigation rather than about load.
 */
export const readSnapshotsCached = () =>
  unstable_cache(() => readSnapshots(), ['insight-snapshots'], {
    tags: [INSIGHTS_TAG],
    revalidate: 300,
  })();
