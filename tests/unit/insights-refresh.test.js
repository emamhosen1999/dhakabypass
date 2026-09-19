/**
 * The nightly refresh.
 *
 * The behaviour that matters is what happens when one service is having a bad
 * day: the other one's figures must still land, the failed panel must keep its
 * last good payload, and nothing must retry.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../lib/insights/ga4.js', () => ({
  ga4Configured: vi.fn(() => true),
  dailyTotals: vi.fn(),
  topPages: vi.fn(),
  eventCounts: vi.fn(),
}));
vi.mock('../../lib/insights/search-console.js', () => ({
  siteUrl: vi.fn(() => 'https://dhakabypass.com/'),
  topQueries: vi.fn(),
  topSearchPages: vi.fn(),
  sitemapStatus: vi.fn(),
}));
vi.mock('../../lib/insights/repo.js', () => ({
  writeSnapshot: vi.fn(async () => {}),
  noteFailure: vi.fn(async () => {}),
  PANELS: {},
}));
vi.mock('../../lib/log.js', () => ({ log: vi.fn(), logError: vi.fn(), orLog: (_e, f) => () => f }));

import { ga4Configured, dailyTotals, topPages, eventCounts } from '../../lib/insights/ga4.js';
import { siteUrl, topQueries, topSearchPages, sitemapStatus } from '../../lib/insights/search-console.js';
import { writeSnapshot, noteFailure } from '../../lib/insights/repo.js';
import { refreshInsights } from '../../lib/insights/refresh.js';

beforeEach(() => {
  vi.clearAllMocks();
  ga4Configured.mockReturnValue(true);
  siteUrl.mockReturnValue('https://dhakabypass.com/');
  dailyTotals.mockResolvedValue([{ date: '20260918', screenPageViews: 412 }]);
  topPages.mockResolvedValue([{ pagePath: '/en', screenPageViews: 300 }]);
  eventCounts.mockResolvedValue([{ eventName: 'toll_quote', eventCount: 4 }]);
  topQueries.mockResolvedValue([{ query: 'dhaka bypass toll', clicks: 12 }]);
  topSearchPages.mockResolvedValue([{ page: 'https://dhakabypass.com/en/travel/toll', clicks: 9 }]);
  sitemapStatus.mockResolvedValue([{ path: 'sitemap.xml', errors: 0 }]);
});

describe('refreshInsights', () => {
  it('writes every panel when both services answer', async () => {
    const out = await refreshInsights();
    expect(out.refreshed).toHaveLength(6);
    expect(out.failed).toEqual([]);
    expect(writeSnapshot).toHaveBeenCalledTimes(6);
  });

  it('keeps the other service when one fails', async () => {
    topQueries.mockRejectedValue(new Error('search console 429: quota'));
    const out = await refreshInsights();
    expect(out.failed).toEqual(['queries']);
    expect(out.refreshed).toContain('daily-totals');
    expect(out.refreshed).toContain('events');
    expect(writeSnapshot).toHaveBeenCalledTimes(5);
  });

  it('records why a panel failed without replacing its payload', async () => {
    dailyTotals.mockRejectedValue(new Error('ga4 429: quota exhausted'));
    await refreshInsights();
    expect(noteFailure).toHaveBeenCalledWith('daily-totals', 'ga4 429: quota exhausted');
    // writeSnapshot is what would overwrite the payload; it must not be called
    // for the failed panel.
    const written = writeSnapshot.mock.calls.map(([panel]) => panel);
    expect(written).not.toContain('daily-totals');
  });

  it('never retries a failed call', async () => {
    dailyTotals.mockRejectedValue(new Error('ga4 500'));
    await refreshInsights();
    expect(dailyTotals).toHaveBeenCalledTimes(1);
  });

  it('skips GA4 entirely when the property is not configured', async () => {
    ga4Configured.mockReturnValue(false);
    const out = await refreshInsights();
    expect(out.skipped).toEqual(expect.arrayContaining(['daily-totals', 'top-pages', 'events']));
    expect(dailyTotals).not.toHaveBeenCalled();
    expect(out.refreshed).toHaveLength(3);
  });

  it('skips Search Console when no site is configured', async () => {
    siteUrl.mockReturnValue('');
    const out = await refreshInsights();
    expect(out.skipped).toEqual(expect.arrayContaining(['queries', 'search-pages', 'sitemaps']));
    expect(topQueries).not.toHaveBeenCalled();
  });

  it('treats a null answer as not-configured, not as an empty panel', async () => {
    eventCounts.mockResolvedValue(null);
    const out = await refreshInsights();
    expect(out.skipped).toContain('events');
    const written = writeSnapshot.mock.calls.map(([panel]) => panel);
    expect(written).not.toContain('events');
  });

  it('survives the database being down while recording a failure', async () => {
    dailyTotals.mockRejectedValue(new Error('ga4 500'));
    noteFailure.mockRejectedValue(new Error('ECONNREFUSED'));
    await expect(refreshInsights()).resolves.toMatchObject({ failed: ['daily-totals'] });
  });
});
