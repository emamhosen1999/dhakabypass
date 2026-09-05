import { notFound, redirect, permanentRedirect } from 'next/navigation';
import { listRedirectsCached } from './cache.js';
import { resolveRedirect } from './repo.js';

/**
 * Follow an operator-configured redirect for `path`, or 404.
 *
 * WHY THIS IS A HELPER AND NOT A ROUTE. The obvious design is a root catch-all
 * that runs when nothing else matched. It does not work here, and the route
 * manifest says why: `app/[locale]/` is a DYNAMIC segment, so `/([^/]+?)$`
 * matches any single-segment URL — `/old-economic-impact` included — and
 * `/[locale]/[...slug]` matches everything deeper. Next prefers a dynamic
 * segment to a catch-all, so both of those win and the catch-all is reached
 * almost never. The 404 for a legacy-shaped URL is therefore decided inside the
 * localised tree, by `isLocale()` failing, not by Next running out of routes.
 *
 * So the lookup lives where the 404 is actually decided, and every one of those
 * places calls this instead of `notFound()` directly.
 *
 * This function never returns: it either redirects or throws Next's not-found
 * signal, which is why callers can use it in tail position exactly as they used
 * `notFound()`.
 */
export async function redirectOrNotFound(path) {
  let rows = [];
  try {
    rows = await listRedirectsCached();
  } catch {
    // A dead database must turn a 404 into a 404, never a 500.
    rows = [];
  }

  const hit = resolveRedirect(rows, path);
  if (!hit) notFound();

  // Next issues 308 for permanentRedirect and 307 for redirect — the
  // method-preserving equivalents of 301 and 302. Google treats each pair
  // identically; the table stores the numbers operators recognise and this maps
  // them. The readiness review records the same behaviour for the build-time
  // redirects in next.config.mjs.
  if (hit.statusCode === 301 || hit.statusCode === 308) permanentRedirect(hit.destination);
  redirect(hit.destination);
}
