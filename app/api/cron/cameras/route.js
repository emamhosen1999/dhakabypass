import { timingSafeEqual } from 'node:crypto';
import { listCameras, getCamera, recordCameraHealth } from '../../../../lib/cameras/repo.js';
import { fetchUpstream, SNAPSHOT_MAX_BYTES } from '../../../../lib/cameras/upstream.js';
import { log } from '../../../../lib/log.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Camera health check, called by cron (Authorization: Bearer $CRON_SECRET).
 * Fetches each active camera's snapshot, or its playlist when it has no
 * snapshot, and records when it last answered — the admin screen shows it,
 * and a camera silent for a while shows as offline to visitors.
 */
function authorised(request) {
  const secret = process.env.CRON_SECRET || '';
  if (secret.length < 24) return false;
  const header = request.headers.get('authorization') || '';
  const a = Buffer.from(header.startsWith('Bearer ') ? header.slice(7) : '');
  const b = Buffer.from(secret);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function GET(request) {
  if (!authorised(request)) return new Response(null, { status: 404 });
  const cameras = await listCameras({ activeOnly: true });
  const results = [];
  for (const summary of cameras) {
    const camera = await getCamera(summary.id, { withSecrets: true });
    const url = camera.snapshot_url && !camera.snapshot_url.startsWith('/') ? camera.snapshot_url : camera.stream_url;
    if (!url || url.startsWith('/')) { results.push({ id: camera.id, ok: null }); continue; }
    try {
      await fetchUpstream(url, camera, { maxBytes: SNAPSHOT_MAX_BYTES });
      await recordCameraHealth(camera.id, true);
      results.push({ id: camera.id, ok: true });
    } catch (err) {
      await recordCameraHealth(camera.id, false, err?.message);
      results.push({ id: camera.id, ok: false });
    }
  }
  log('info', 'cameras.checked', { total: results.length, ok: results.filter((r) => r.ok).length });
  return Response.json({ ok: true, results }, { headers: { 'cache-control': 'no-store' } });
}
