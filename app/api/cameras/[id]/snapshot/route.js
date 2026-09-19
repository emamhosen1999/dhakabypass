import { getCamera, recordCameraHealth } from '../../../../../lib/cameras/repo.js';
import { fetchUpstream, SNAPSHOT_MAX_BYTES } from '../../../../../lib/cameras/upstream.js';
import { logError } from '../../../../../lib/log.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * A camera's current still image, fetched from the camera or NVR by this
 * server (credentials never reach the browser). Short-cached so a busy page
 * cannot hammer the camera. 404 for an unknown or switched-off camera, 503
 * when the camera does not answer — the tile then shows "offline".
 */
export async function GET(_request, { params }) {
  const { id } = await params;
  let camera;
  try { camera = await getCamera(id, { withSecrets: true }); } catch { camera = null; }
  if (!camera || !camera.is_active || !camera.snapshot_url || camera.snapshot_url.startsWith('/')) {
    return new Response(null, { status: 404 });
  }
  try {
    const { body, type } = await fetchUpstream(camera.snapshot_url, camera, { maxBytes: SNAPSHOT_MAX_BYTES });
    if (!/^image\//i.test(type)) throw new Error(`not an image (${type || 'no content-type'})`);
    recordCameraHealth(camera.id, true).catch((e) => logError('cameras.health_write_failed', e, { camera: camera.id }));
    return new Response(body, {
      status: 200,
      headers: { 'content-type': type, 'cache-control': 'public, max-age=5', 'x-content-type-options': 'nosniff' },
    });
  } catch (err) {
    recordCameraHealth(camera.id, false, err?.message).catch((e) => logError('cameras.health_write_failed', e, { camera: camera.id }));
    logError('camera.snapshot_failed', err, { camera: camera.id });
    return new Response(null, { status: 503, headers: { 'cache-control': 'no-store' } });
  }
}
