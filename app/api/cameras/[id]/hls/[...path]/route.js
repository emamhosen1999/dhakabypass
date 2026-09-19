import { getCamera, recordCameraHealth } from '../../../../../../lib/cameras/repo.js';
import { fetchUpstream, rewritePlaylist, upstreamFor, SEGMENT_MAX_BYTES } from '../../../../../../lib/cameras/upstream.js';
import { logError } from '../../../../../../lib/log.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const TYPES = { m3u8: 'application/vnd.apple.mpegurl', ts: 'video/mp2t', m4s: 'video/iso.segment', mp4: 'video/mp4', aac: 'audio/aac' };

/**
 * A camera's live HLS stream, relayed through this server: the playlist with
 * its segment addresses rewritten to this route, and the segments themselves.
 * Only paths inside the stream's own directory on the camera's own host can
 * be requested, so the relay cannot be pointed anywhere else.
 */
export async function GET(request, { params }) {
  const { id, path: parts = [] } = await params;
  let camera;
  try { camera = await getCamera(id, { withSecrets: true }); } catch { camera = null; }
  if (!camera || !camera.is_active || !camera.stream_url || camera.delivery !== 'proxy') {
    return new Response(null, { status: 404 });
  }
  const target = upstreamFor(camera.stream_url, parts, new URL(request.url).search);
  if (!target) return new Response(null, { status: 400 });
  const ext = (parts.at(-1) || '').split('.').pop().toLowerCase();
  try {
    const { body, type } = await fetchUpstream(target, camera, { maxBytes: SEGMENT_MAX_BYTES, timeoutMs: 15000 });
    if (ext === 'm3u8' || /mpegurl/i.test(type)) {
      if (parts.length === 1 && parts[0] === 'index.m3u8') recordCameraHealth(camera.id, true).catch((e) => logError('cameras.health_write_failed', e, { camera: camera.id }));
      return new Response(rewritePlaylist(body.toString('utf8'), target, camera.id, camera.stream_url), {
        headers: { 'content-type': TYPES.m3u8, 'cache-control': 'no-store' },
      });
    }
    return new Response(body, { headers: { 'content-type': TYPES[ext] || type || 'application/octet-stream', 'cache-control': 'public, max-age=30' } });
  } catch (err) {
    if (parts.length === 1 && parts[0] === 'index.m3u8') recordCameraHealth(camera.id, false, err?.message).catch((e) => logError('cameras.health_write_failed', e, { camera: camera.id }));
    logError('camera.stream_failed', err, { camera: camera.id });
    return new Response(null, { status: 503, headers: { 'cache-control': 'no-store' } });
  }
}
