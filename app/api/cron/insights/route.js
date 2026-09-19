import { timingSafeEqual } from 'node:crypto';
import { refreshInsights } from '../../../../lib/insights/refresh.js';
import { revalidateInsights } from '../../../../lib/revalidate.js';
import { log, logError } from '../../../../lib/log.js';

/**
 * The nightly analytics refresh.
 *
 * A cPanel cron job calls this once a day with
 * `Authorization: Bearer $CRON_SECRET`. It reads GA4 and Search Console, and
 * writes one snapshot per panel; /admin/insights renders those rows and never
 * calls Google itself.
 *
 * ONCE A DAY IS DELIBERATE. Search Console's data is two to three days
 * behind, GA4's daily figures settle overnight, and a GA4 property is blocked
 * entirely after ten server errors in an hour. There is nothing to gain from
 * asking more often and a working dashboard to lose.
 *
 * Refuses without a configured CRON_SECRET, and compares in constant time.
 */
export const dynamic = 'force-dynamic';

function authorised(request) {
  const secret = process.env.CRON_SECRET || '';
  if (secret.length < 24) return false;
  const header = request.headers.get('authorization') || '';
  const given = header.startsWith('Bearer ') ? header.slice(7) : '';
  const a = Buffer.from(given);
  const b = Buffer.from(secret);
  return a.length === b.length && timingSafeEqual(a, b);
}

async function run(request) {
  // 404, not 401: an unauthenticated caller learns nothing about whether this
  // endpoint exists.
  if (!authorised(request)) return new Response(null, { status: 404 });
  try {
    const result = await refreshInsights();
    revalidateInsights();
    log('info', 'insights.cron_ran', result);
    return Response.json({ ok: true, ...result }, { headers: { 'cache-control': 'no-store' } });
  } catch (err) {
    // refreshInsights records each panel's own failure; reaching here means
    // something outside the panels broke.
    logError('insights.cron_failed', err);
    return Response.json({ ok: false }, { status: 500, headers: { 'cache-control': 'no-store' } });
  }
}

export const GET = run;
export const POST = run;
