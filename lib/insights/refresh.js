import { dailyTotals, topPages, eventCounts, ga4Configured } from './ga4.js';
import { topQueries, topSearchPages, sitemapStatus, siteUrl } from './search-console.js';
import { writeSnapshot, noteFailure } from './repo.js';
import { EVENTS } from '../analytics/events.js';
import { log, logError } from '../log.js';

/**
 * One pass over every panel, for the nightly cron.
 *
 * EACH PANEL SUCCEEDS OR FAILS ALONE. Search Console being slow is not a
 * reason to lose the GA4 figures, so one panel's failure is recorded against
 * that panel and the others still refresh.
 *
 * NOTHING RETRIES. Ten server errors in an hour block every request to a GA4
 * property; a retry loop is how a transient error becomes a day without data.
 * A panel that failed keeps its last good payload and says when it failed.
 */

const PLAN = [
  { panel: 'daily-totals', run: (o) => dailyTotals(28, o), needs: 'ga4' },
  { panel: 'top-pages', run: (o) => topPages(25, o), needs: 'ga4' },
  { panel: 'events', run: (o) => eventCounts(Object.keys(EVENTS), o), needs: 'ga4' },
  { panel: 'queries', run: (o) => topQueries(100, o), needs: 'search-console' },
  { panel: 'search-pages', run: (o) => topSearchPages(25, o), needs: 'search-console' },
  { panel: 'sitemaps', run: (o) => sitemapStatus(o), needs: 'search-console' },
];

/**
 * @returns {Promise<{refreshed: string[], failed: string[], skipped: string[]}>}
 */
export async function refreshInsights(options = {}) {
  const env = options.env || process.env;
  const hasGa4 = ga4Configured(env);
  const hasGsc = Boolean(siteUrl(env));

  const refreshed = [];
  const failed = [];
  const skipped = [];

  for (const { panel, run, needs } of PLAN) {
    if ((needs === 'ga4' && !hasGa4) || (needs === 'search-console' && !hasGsc)) {
      skipped.push(panel);
      continue;
    }
    try {
      const payload = await run({ ...options, env });
      // null means "not configured" rather than "no data"; nothing is written
      // for it, so the screen keeps saying it was never collected.
      if (payload === null) { skipped.push(panel); continue; }
      await writeSnapshot(panel, payload);
      refreshed.push(panel);
    } catch (err) {
      logError('insights.panel_failed', err, { panel });
      failed.push(panel);
      try {
        await noteFailure(panel, err?.message || 'refresh failed');
      } catch (noteErr) {
        // The database is the thing that is broken; there is nowhere to
        // record that but the log.
        logError('insights.note_failed', noteErr, { panel });
      }
    }
  }

  log('info', 'insights.refreshed', { refreshed: refreshed.length, failed: failed.length, skipped: skipped.length });
  return { refreshed, failed, skipped };
}
