import { cache } from 'react';
import { unstable_cache } from 'next/cache';
import { corridorSummary } from './segments.js';
import { listInterchanges } from './interchanges.js';
import { listTollRates } from './tolls.js';
import { activeAdvisories } from './advisories.js';
import { isDataIllustrative } from '../settings.js';
import { CORRIDOR_TAG, ADVISORY_TAG } from '../revalidate.js';

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

// Advisories carry a short revalidate window rather than no cache at all. The
// routes that read this are statically generated (see app/[locale]/layout.jsx
// -> AdvisoryBar), so "no cache" would not mean "always fresh" — it would mean
// the result gets baked into the HTML at `next build` and frozen there until
// the next build and deploy, which is the opposite of what an advisory needs.
// A 60s window bounds staleness to at most a minute even if nothing else
// happens, and an admin save calls revalidateCorridor(), which invalidates
// ADVISORY_TAG for an immediate refresh. React's cache() still dedupes within
// one request, same as the other readers below.
export const getActiveAdvisoriesCached = cache(() =>
  unstable_cache(() => activeAdvisories(), ['corridor-advisories'], {
    tags: [ADVISORY_TAG],
    revalidate: 60,
  })()
);

export const getIllustrativeCached = cache(() =>
  unstable_cache(() => isDataIllustrative(), ['corridor-illustrative'], { tags: [CORRIDOR_TAG] })()
);
