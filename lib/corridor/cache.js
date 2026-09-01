import { cache } from 'react';
import { unstable_cache } from 'next/cache';
import { corridorSummary } from './segments.js';
import { listInterchanges } from './interchanges.js';
import { listTollRates } from './tolls.js';
import { activeAdvisories } from './advisories.js';
import { isDataIllustrative } from '../settings.js';
import { CORRIDOR_TAG } from '../revalidate.js';

/**
 * Cached readers for the public routes. The admin uses the uncached modules so
 * an editor always sees current data.
 *
 * Each is wrapped in React's cache() as well as unstable_cache: on a COLD entry
 * unstable_cache alone does not dedupe two calls in the same request (proven in
 * P0+P1), so generateMetadata and the page component would each hit the DB.
 */
export const getCorridorSummaryCached = cache(() =>
  unstable_cache(() => corridorSummary(), ['corridor-summary'], { tags: [CORRIDOR_TAG] })()
);

export const getInterchangesCached = cache(() =>
  unstable_cache(() => listInterchanges(), ['corridor-interchanges'], { tags: [CORRIDOR_TAG] })()
);

export const getTollRatesCached = cache(() =>
  unstable_cache(() => listTollRates(), ['corridor-tolls'], { tags: [CORRIDOR_TAG] })()
);

// Advisories are deliberately NOT cached across requests: an advisory exists to
// be current, and a stale closure notice is worse than an extra query. React's
// cache() still dedupes within one request.
export const getActiveAdvisoriesCached = cache(() => activeAdvisories());

export const getIllustrativeCached = cache(() =>
  unstable_cache(() => isDataIllustrative(), ['corridor-illustrative'], { tags: [CORRIDOR_TAG] })()
);
