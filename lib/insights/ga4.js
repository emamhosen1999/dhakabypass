import { accessToken, SCOPES } from './google-auth.js';

/**
 * The GA4 Data API, for the admin's own screens.
 *
 * WHAT THESE FIGURES ARE, AND ARE NOT. Consent Mode denies every storage type
 * until a visitor agrees (components/chrome/Analytics.jsx), so GA4 counts the
 * people who accepted and nobody else. Every number here is a FLOOR, not the
 * truth, and the screen says so rather than presenting it as attendance.
 *
 * ONE ATTEMPT PER CALL. Ten server errors in an hour block every request to a
 * property, so nothing here retries. A failed refresh leaves yesterday's
 * snapshot in place and says when it was taken.
 */

const BASE = 'https://analyticsdata.googleapis.com/v1beta';

/** The numeric property ID — not the G- measurement ID, which the API rejects. */
export function propertyId(env = process.env) {
  const raw = typeof env.GA4_PROPERTY_ID === 'string' ? env.GA4_PROPERTY_ID.trim() : '';
  return /^\d{6,15}$/.test(raw) ? raw : '';
}

/** Whether the GA4 half of the dashboard can run at all. */
export function ga4Configured(env = process.env) {
  return Boolean(propertyId(env));
}

async function runReport(body, { env = process.env, fetchImpl = fetch } = {}) {
  const property = propertyId(env);
  if (!property) return null;
  const token = await accessToken(SCOPES.analytics, { env, fetchImpl });
  if (!token) return null;

  const res = await fetchImpl(`${BASE}/properties/${property}:runReport`, {
    method: 'POST',
    headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`ga4 ${res.status}: ${detail.slice(0, 200)}`);
  }
  return res.json();
}

/** A report's rows as plain objects, with the metric names the query asked for. */
export function shapeRows(report) {
  const dims = (report?.dimensionHeaders || []).map((h) => h.name);
  const mets = (report?.metricHeaders || []).map((h) => h.name);
  return (report?.rows || []).map((row) => {
    const out = {};
    dims.forEach((name, i) => { out[name] = row.dimensionValues?.[i]?.value ?? ''; });
    mets.forEach((name, i) => { out[name] = Number(row.metricValues?.[i]?.value ?? 0); });
    return out;
  });
}

/** Page views and users per day, for the line the screen opens with. */
export async function dailyTotals(days = 28, options = {}) {
  const report = await runReport({
    dateRanges: [{ startDate: `${days}daysAgo`, endDate: 'yesterday' }],
    dimensions: [{ name: 'date' }],
    metrics: [{ name: 'screenPageViews' }, { name: 'activeUsers' }, { name: 'sessions' }],
    orderBys: [{ dimension: { dimensionName: 'date' } }],
  }, options);
  return report ? shapeRows(report) : null;
}

/**
 * The most-read pages, with the language taken from the path.
 *
 * NOT GA4's `language` dimension, which reports the browser's setting: a
 * reader whose phone is in English reading the Bangla page is Bangla traffic
 * for our purposes, and the path is the only honest source for that.
 */
export async function topPages(limit = 25, options = {}) {
  const report = await runReport({
    dateRanges: [{ startDate: '28daysAgo', endDate: 'yesterday' }],
    dimensions: [{ name: 'pagePath' }],
    metrics: [{ name: 'screenPageViews' }, { name: 'activeUsers' }],
    orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
    limit,
  }, options);
  if (!report) return null;
  return shapeRows(report).map((row) => ({ ...row, locale: localeFromPath(row.pagePath) }));
}

/** `/bn/travel/toll` -> `bn`; anything else is unprefixed. */
export function localeFromPath(path) {
  const match = /^\/(en|bn|zh)(\/|$)/.exec(String(path || ''));
  return match ? match[1] : '—';
}

/**
 * The twelve events the site records — the only panel about the road rather
 * than about the website.
 */
export async function eventCounts(names, options = {}) {
  const list = (names || []).filter(Boolean);
  if (!list.length) return [];
  const report = await runReport({
    dateRanges: [{ startDate: '28daysAgo', endDate: 'yesterday' }],
    dimensions: [{ name: 'eventName' }],
    metrics: [{ name: 'eventCount' }],
    dimensionFilter: { filter: { fieldName: 'eventName', inListFilter: { values: list } } },
    orderBys: [{ metric: { metricName: 'eventCount' }, desc: true }],
  }, options);
  if (!report) return null;
  const counted = new Map(shapeRows(report).map((r) => [r.eventName, r.eventCount]));
  // Every declared event appears, including the ones at zero: "nobody tapped
  // the emergency number this month" is a finding, and a missing row reads as
  // a broken panel instead.
  return list.map((name) => ({ eventName: name, eventCount: counted.get(name) || 0 }));
}
