import { timingSafeEqual } from 'node:crypto';
import { refreshTraffic } from '../../../../lib/corridor/traffic-refresh.js';
import { revalidateCorridor } from '../../../../lib/revalidate.js';
import { log, logError } from '../../../../lib/log.js';

/**
 * Scheduled TomTom refresh (INT.9).
 *
 * A cPanel cron job calls this every ten minutes with
 * `Authorization: Bearer $CRON_SECRET`. It runs the same refreshTraffic() as
 * the "Refresh from TomTom" button at /admin/corridor/sections — one Flow
 * Segment Data request per corridor section — then revalidates the corridor
 * so the map and status tables show the new measurements at once.
 *
 * Measurements older than fifteen minutes are published as "not measured"
 * (lib/corridor/tomtom.js), so a cron that stops shows honestly rather than
 * leaving stale conditions up.
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
  if (!authorised(request)) return new Response(null, { status: 404 });
  try {
    const sections = await refreshTraffic();
    revalidateCorridor();
    log('info', 'traffic.refreshed', { sections });
    return Response.json({ ok: true, sections }, { headers: { 'cache-control': 'no-store' } });
  } catch (err) {
    logError('traffic.refresh_failed', err);
    return Response.json({ ok: false, error: err?.code === 'VALIDATION' ? err.message : 'refresh failed' },
      { status: 502, headers: { 'cache-control': 'no-store' } });
  }
}

export const GET = run;
export const POST = run;
