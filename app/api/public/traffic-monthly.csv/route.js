import { listMonthlyTrafficAll, getMonthlyTrafficSource } from '../../../../lib/corridor/traffic.js';
import { monthlyCsv } from '../../../../lib/open-data/format.js';
import { respondOpenData, preflight } from '../../../../lib/open-data/respond.js';

/**
 * Open data: the monthly vehicle counts entered at /admin/corridor/monthly,
 * every plaza row, as CSV. The `source` column says whether the rows are
 * DBEDC's own counts or the sample set the site shipped with.
 */
export const dynamic = 'force-dynamic';

export async function GET(request) {
  return respondOpenData(request, async () => {
    const [rows, source] = await Promise.all([listMonthlyTrafficAll(), getMonthlyTrafficSource()]);
    return {
      body: monthlyCsv(rows, source),
      contentType: 'text/csv; charset=utf-8',
      extra: { 'content-disposition': 'inline; filename="dhaka-bypass-traffic-monthly.csv"' },
    };
  }, { name: 'open-data.monthly' });
}

export const OPTIONS = preflight;
