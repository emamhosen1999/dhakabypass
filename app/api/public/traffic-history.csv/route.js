import { listTrafficHistory } from '../../../../lib/corridor/history.js';
import { listCorridorSections } from '../../../../lib/corridor/traffic.js';
import { historyCsv } from '../../../../lib/open-data/format.js';
import { respondOpenData, preflight } from '../../../../lib/open-data/respond.js';

/**
 * Open data: every kept traffic measurement (54-traffic-history.sql) as
 * CSV, one row per section per refresh, up to the 400 days the refresh
 * keeps. `?days=30` narrows the window.
 */
export const dynamic = 'force-dynamic';

export async function GET(request) {
  return respondOpenData(request, async () => {
    const days = Number(new URL(request.url).searchParams.get('days')) || 400;
    const [rows, sections] = await Promise.all([listTrafficHistory({ days }), listCorridorSections()]);
    return {
      body: historyCsv(rows, sections),
      contentType: 'text/csv; charset=utf-8',
      extra: { 'content-disposition': 'inline; filename="dhaka-bypass-traffic-history.csv"' },
    };
  }, { name: 'open-data.history' });
}

export const OPTIONS = preflight;
