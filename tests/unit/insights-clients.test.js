/**
 * The two API clients.
 *
 * Both are thin, and the parts worth testing are the decisions rather than
 * the HTTP: which dimension a figure comes from, what happens to an event
 * nobody fired, and what the window is when Search Console's data is three
 * days behind.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import crypto from 'node:crypto';
import { forgetTokens } from '../../lib/insights/google-auth.js';
import {
  propertyId, ga4Configured, shapeRows, localeFromPath, dailyTotals, topPages, eventCounts,
} from '../../lib/insights/ga4.js';
import { siteUrl, lastCompleteWindow, topQueries, sitemapStatus } from '../../lib/insights/search-console.js';

const { privateKey } = crypto.generateKeyPairSync('rsa', {
  modulusLength: 2048,
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  publicKeyEncoding: { type: 'spki', format: 'pem' },
});

const KEY = Buffer.from(JSON.stringify({
  type: 'service_account',
  client_email: 'reporting@dhaka-bypass-expressway.iam.gserviceaccount.com',
  private_key: privateKey,
})).toString('base64');

const ENV = { GOOGLE_SA_KEY_B64: KEY, GA4_PROPERTY_ID: '555036009', SITE_URL: 'https://dhakabypass.com' };

/** A fetch that answers the token call, then the API call with `payload`. */
const fetchWith = (payload) => vi.fn(async (url) => {
  if (String(url).includes('oauth2.googleapis.com')) {
    return { ok: true, json: async () => ({ access_token: 'ya29.test', expires_in: 3600 }) };
  }
  return { ok: true, json: async () => payload };
});

beforeEach(() => forgetTokens());

describe('propertyId', () => {
  it('accepts the numeric property ID', () => {
    expect(propertyId({ GA4_PROPERTY_ID: '555036009' })).toBe('555036009');
    expect(ga4Configured({ GA4_PROPERTY_ID: '555036009' })).toBe(true);
  });

  it('refuses the measurement ID, which the API rejects', () => {
    // The commonest mistake: G-L6DWRP79H5 is the tag, not the property.
    expect(propertyId({ GA4_PROPERTY_ID: 'G-L6DWRP79H5' })).toBe('');
    expect(ga4Configured({ GA4_PROPERTY_ID: 'G-L6DWRP79H5' })).toBe(false);
    expect(ga4Configured({})).toBe(false);
  });
});

describe('shapeRows', () => {
  it('names each value after the dimension or metric that produced it', () => {
    const rows = shapeRows({
      dimensionHeaders: [{ name: 'date' }],
      metricHeaders: [{ name: 'screenPageViews' }, { name: 'activeUsers' }],
      rows: [{ dimensionValues: [{ value: '20260918' }], metricValues: [{ value: '412' }, { value: '260' }] }],
    });
    expect(rows).toEqual([{ date: '20260918', screenPageViews: 412, activeUsers: 260 }]);
  });

  it('survives a report with no rows at all', () => {
    expect(shapeRows({ dimensionHeaders: [], metricHeaders: [] })).toEqual([]);
    expect(shapeRows(null)).toEqual([]);
  });
});

describe('localeFromPath', () => {
  it('reads the language from the path, not from the browser', () => {
    expect(localeFromPath('/bn/travel/toll')).toBe('bn');
    expect(localeFromPath('/zh')).toBe('zh');
    expect(localeFromPath('/en/about')).toBe('en');
  });

  it('marks a path with no locale rather than guessing one', () => {
    expect(localeFromPath('/api/public/corridor-status')).toBe('—');
    expect(localeFromPath('')).toBe('—');
  });
});

describe('GA4 queries', () => {
  it('asks for the days the screen draws', async () => {
    const fetchImpl = fetchWith({ dimensionHeaders: [{ name: 'date' }], metricHeaders: [], rows: [] });
    await dailyTotals(28, { env: ENV, fetchImpl });
    const body = JSON.parse(fetchImpl.mock.calls.at(-1)[1].body);
    expect(body.dateRanges[0]).toEqual({ startDate: '28daysAgo', endDate: 'yesterday' });
    expect(body.metrics.map((m) => m.name)).toContain('screenPageViews');
  });

  it('tags each page with the language of its path', async () => {
    const fetchImpl = fetchWith({
      dimensionHeaders: [{ name: 'pagePath' }],
      metricHeaders: [{ name: 'screenPageViews' }, { name: 'activeUsers' }],
      rows: [{ dimensionValues: [{ value: '/bn/travel/toll' }], metricValues: [{ value: '90' }, { value: '70' }] }],
    });
    const rows = await topPages(25, { env: ENV, fetchImpl });
    expect(rows[0]).toMatchObject({ pagePath: '/bn/travel/toll', screenPageViews: 90, locale: 'bn' });
  });

  it('returns every declared event, including the ones nobody fired', async () => {
    // "Nobody tapped the emergency number this month" is a finding. A missing
    // row reads as a broken panel.
    const fetchImpl = fetchWith({
      dimensionHeaders: [{ name: 'eventName' }],
      metricHeaders: [{ name: 'eventCount' }],
      rows: [{ dimensionValues: [{ value: 'toll_quote' }], metricValues: [{ value: '31' }] }],
    });
    const rows = await eventCounts(['toll_quote', 'emergency_tel_tap'], { env: ENV, fetchImpl });
    expect(rows).toEqual([
      { eventName: 'toll_quote', eventCount: 31 },
      { eventName: 'emergency_tel_tap', eventCount: 0 },
    ]);
  });

  it('asks for nothing when the property is not configured', async () => {
    const fetchImpl = fetchWith({});
    expect(await dailyTotals(28, { env: { GOOGLE_SA_KEY_B64: KEY }, fetchImpl })).toBeNull();
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('reports a refusal with its status rather than an empty chart', async () => {
    const fetchImpl = vi.fn(async (url) => (String(url).includes('oauth2')
      ? { ok: true, json: async () => ({ access_token: 't', expires_in: 3600 }) }
      : { ok: false, status: 429, text: async () => 'quota exhausted' }));
    await expect(dailyTotals(28, { env: ENV, fetchImpl })).rejects.toThrow(/429/);
  });
});

describe('Search Console', () => {
  it('keeps the trailing slash the property is registered with', () => {
    expect(siteUrl({ SITE_URL: 'https://dhakabypass.com' })).toBe('https://dhakabypass.com/');
    expect(siteUrl({ GSC_SITE_URL: 'sc-domain:dhakabypass.com' })).toBe('sc-domain:dhakabypass.com');
  });

  it('ends its window three days back, because the data is that far behind', () => {
    // Asking for yesterday returns nothing and reads like a fault.
    const { startDate, endDate } = lastCompleteWindow(new Date('2026-09-19T00:00:00Z'));
    expect(endDate).toBe('2026-09-16');
    expect(startDate).toBe('2026-08-20');
  });

  it('asks for queries over that window', async () => {
    const fetchImpl = fetchWith({ rows: [{ keys: ['dhaka bypass toll'], clicks: 12, impressions: 300, ctr: 0.04, position: 8.2 }] });
    const rows = await topQueries(100, { env: ENV, fetchImpl, today: new Date('2026-09-19T00:00:00Z') });
    expect(rows[0]).toEqual({ query: 'dhaka bypass toll', clicks: 12, impressions: 300, ctr: 0.04, position: 8.2 });
    const body = JSON.parse(fetchImpl.mock.calls.at(-1)[1].body);
    expect(body.dimensions).toEqual(['query']);
    expect(body.endDate).toBe('2026-09-16');
  });

  it('reads the sitemap figures, which are the only indexing numbers with an API', async () => {
    const fetchImpl = fetchWith({ sitemap: [{ path: 'https://dhakabypass.com/sitemap.xml', errors: '0', warnings: '2', isPending: false }] });
    const rows = await sitemapStatus({ env: ENV, fetchImpl });
    expect(rows[0]).toMatchObject({ errors: 0, warnings: 2, isPending: false });
  });

  it('asks for nothing when no site is configured', async () => {
    const fetchImpl = fetchWith({});
    expect(await sitemapStatus({ env: { GOOGLE_SA_KEY_B64: KEY }, fetchImpl })).toBeNull();
    expect(fetchImpl).not.toHaveBeenCalled();
  });
});
