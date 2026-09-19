import { accessToken, SCOPES } from './google-auth.js';

/**
 * The Search Console API.
 *
 * WHAT IT CANNOT GIVE US. There is no API behind the Page indexing report, so
 * "coverage errors" as a number does not exist. What exists is the sitemap's
 * own error and warning counts, and URL Inspection one URL at a time against a
 * daily quota. The screen shows those and links to the real report rather than
 * inventing a figure.
 *
 * The property is the site as Search Console knows it, including the trailing
 * slash: `https://dhakabypass.com/`.
 */

const BASE = 'https://searchconsole.googleapis.com/webmasters/v3';

export function siteUrl(env = process.env) {
  const raw = typeof env.GSC_SITE_URL === 'string' ? env.GSC_SITE_URL.trim() : '';
  if (raw) return raw;
  const origin = typeof env.SITE_URL === 'string' ? env.SITE_URL.trim() : '';
  // Search Console stores a URL-prefix property with its trailing slash, and
  // rejects the same address without one.
  return origin ? `${origin.replace(/\/+$/, '')}/` : '';
}

async function call(path, { env = process.env, fetchImpl = fetch, method = 'GET', body } = {}) {
  const site = siteUrl(env);
  if (!site) return null;
  const token = await accessToken(SCOPES.searchConsole, { env, fetchImpl });
  if (!token) return null;

  const res = await fetchImpl(`${BASE}/sites/${encodeURIComponent(site)}${path}`, {
    method,
    headers: {
      authorization: `Bearer ${token}`,
      ...(body ? { 'content-type': 'application/json' } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`search console ${res.status}: ${detail.slice(0, 200)}`);
  }
  return res.json();
}

/**
 * What people searched for to reach the site.
 *
 * Search Console's own data is delayed by two to three days, so the window
 * ends three days back: asking for yesterday returns an empty row set that
 * reads like a fault.
 */
export async function topQueries(limit = 100, options = {}) {
  const { startDate, endDate } = lastCompleteWindow(options.today);
  const body = await call('/searchAnalytics/query', {
    ...options,
    method: 'POST',
    body: { startDate, endDate, dimensions: ['query'], rowLimit: limit },
  });
  if (!body) return null;
  return (body.rows || []).map((row) => ({
    query: row.keys?.[0] || '',
    clicks: Number(row.clicks || 0),
    impressions: Number(row.impressions || 0),
    ctr: Number(row.ctr || 0),
    position: Number(row.position || 0),
  }));
}

/** The same figures per page, so an editor can see which page earns them. */
export async function topSearchPages(limit = 25, options = {}) {
  const { startDate, endDate } = lastCompleteWindow(options.today);
  const body = await call('/searchAnalytics/query', {
    ...options,
    method: 'POST',
    body: { startDate, endDate, dimensions: ['page'], rowLimit: limit },
  });
  if (!body) return null;
  return (body.rows || []).map((row) => ({
    page: row.keys?.[0] || '',
    clicks: Number(row.clicks || 0),
    impressions: Number(row.impressions || 0),
    position: Number(row.position || 0),
  }));
}

/** Sitemap health: the only indexing figure with an API behind it. */
export async function sitemapStatus(options = {}) {
  const body = await call('/sitemaps', options);
  if (!body) return null;
  return (body.sitemap || []).map((s) => ({
    path: s.path || '',
    lastSubmitted: s.lastSubmitted || '',
    lastDownloaded: s.lastDownloaded || '',
    isPending: Boolean(s.isPending),
    warnings: Number(s.warnings || 0),
    errors: Number(s.errors || 0),
  }));
}

/**
 * The 28 days ending three days ago.
 * Exported so the test can pin a date rather than follow the clock.
 */
export function lastCompleteWindow(today = new Date()) {
  const end = new Date(today);
  end.setUTCDate(end.getUTCDate() - 3);
  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - 27);
  const iso = (d) => d.toISOString().slice(0, 10);
  return { startDate: iso(start), endDate: iso(end) };
}
