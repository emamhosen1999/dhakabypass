/**
 * The `redirects` table, which has existed since db-setup-v2.mjs and has never
 * had a reader.
 *
 * WHY IT MATTERS NOW. At cutover, legacy URLs — `/project`, `/gallery`,
 * `/stakeholders` — need to point at their localised replacements. Eight such
 * redirects live in `next.config.mjs`, which is correct for a set that changes
 * with the code but means every new redirect costs a full rebuild and release.
 * The readiness review (Q3) recommends keeping the fixed set there and wiring
 * this table only if the operator genuinely needs to add one without a deploy.
 * Cutover is exactly that case: the indexed-URL list comes from Search Console
 * after the site is live, and each 404 found in the logs needs a redirect the
 * same day, not at the next release.
 *
 * WHERE IT IS READ, and why not middleware. The obvious home for a redirect is
 * middleware, and the review's own warning explains why it is not: middleware
 * runs on every request including static assets, on a memory-limited host, and
 * a per-request database read there is the change most likely to take the site
 * down under load. `middleware.js` is also on the do-not-modify list, and the
 * edge runtime cannot load mysql2 at all.
 *
 * So the lookup happens in the root catch-all route, which Next reaches ONLY
 * when nothing else matched — i.e. on a request that was about to 404. A
 * redirect costs one cached read on a page nobody wanted anyway, and a normal
 * request never touches this table.
 */

import { query, dbEnabled } from '../db.js';

/** Only these are meaningful for a URL move, and only these are accepted. */
export const REDIRECT_STATUSES = [301, 302, 307, 308];

/**
 * Normalise a path for comparison.
 *
 * The old site was a static export, so its URLs are indexed both with and
 * without a trailing slash — the readiness review notes that four of the eight
 * redirects in next.config.mjs exist only to cover the second form. Rather than
 * make an operator remember to enter both, both forms normalise to the same key
 * here: one row covers `/project` and `/project/`.
 *
 * The query string is dropped for matching and re-attached by the caller, so a
 * campaign link like `/gallery?utm_source=x` still resolves.
 */
export function normalisePath(path) {
  let p = String(path || '').trim();
  if (!p) return '';
  p = p.split('?')[0].split('#')[0];
  if (!p.startsWith('/')) p = `/${p}`;
  // Collapse repeated slashes, then drop a single trailing one (but never turn
  // the root into an empty string).
  p = p.replace(/\/{2,}/g, '/');
  if (p.length > 1) p = p.replace(/\/+$/, '');
  return p.toLowerCase();
}

/**
 * Every redirect, keyed by normalised source.
 *
 * The whole table in one read rather than a lookup per request: it is a handful
 * of rows, it is read on 404s where latency does not matter, and one cached read
 * of everything beats a query per miss.
 */
export async function listRedirects() {
  if (!dbEnabled()) return [];
  let rows;
  try {
    rows = await query(
      'SELECT id, source, destination, status_code FROM redirects ORDER BY source',
    );
  } catch {
    // A dead database must not turn a 404 into a 500.
    return [];
  }
  return (rows || []).map((r) => ({
    id: r.id,
    source: r.source,
    destination: r.destination,
    statusCode: REDIRECT_STATUSES.includes(Number(r.status_code)) ? Number(r.status_code) : 301,
  }));
}

/**
 * Resolve one path against a list of redirects.
 *
 * Pure, so the matching rules are testable without a database.
 *
 * Returns null when nothing matches, so the caller can 404 normally.
 */
export function resolveRedirect(rows, path) {
  const wanted = normalisePath(path);
  if (!wanted) return null;
  for (const row of rows || []) {
    if (normalisePath(row.source) === wanted) {
      return { destination: row.destination, statusCode: row.statusCode };
    }
  }
  return null;
}
