/**
 * Fetching from a camera or NVR on the visitor's behalf.
 *
 * Only addresses an operator entered on a camera record are ever fetched —
 * never a URL from the request — so these routes cannot be used to reach
 * arbitrary hosts. Credentials go as HTTP Basic (the scheme NVR snapshot and
 * HLS endpoints accept); responses are size-limited and time-limited so one
 * slow camera cannot tie up the app.
 */
export const SNAPSHOT_MAX_BYTES = 5 * 1024 * 1024;
export const SEGMENT_MAX_BYTES = 12 * 1024 * 1024;

export function authHeaders(camera) {
  const ua = { 'user-agent': 'DhakaBypass-CameraRelay/1.0 (+https://dhakabypass.com)' };
  if (!camera.username) return ua;
  const token = Buffer.from(`${camera.username}:${camera.password || ''}`).toString('base64');
  return { ...ua, authorization: `Basic ${token}` };
}

export async function fetchUpstream(url, camera, { maxBytes, timeoutMs = 10000, fetchImpl = fetch } = {}) {
  const res = await fetchImpl(url, { headers: authHeaders(camera), cache: 'no-store', redirect: 'follow', signal: AbortSignal.timeout(timeoutMs) });
  if (!res.ok) throw new Error(`upstream HTTP ${res.status}`);
  const length = Number(res.headers.get('content-length'));
  if (Number.isFinite(length) && length > maxBytes) throw new Error('upstream response too large');
  const body = Buffer.from(await res.arrayBuffer());
  if (body.length > maxBytes) throw new Error('upstream response too large');
  return { body, type: res.headers.get('content-type') || '' };
}

/**
 * An HLS playlist with every media and child-playlist address rewritten to
 * this camera's proxy path. References resolve against the playlist's own
 * address (a child playlist's segments are relative to the child) and are
 * expressed relative to the camera's stream directory, which is what the relay
 * maps paths back against. Anything outside that directory is dropped.
 */
export function rewritePlaylist(text, playlistUrl, cameraId, streamUrl = playlistUrl) {
  const base = new URL(playlistUrl);
  const root = new URL(streamUrl);
  const baseDir = new URL('.', root);
  const toProxy = (ref) => {
    let abs;
    try { abs = new URL(ref, base); } catch { return null; }
    if (abs.origin !== root.origin || !abs.pathname.startsWith(baseDir.pathname)) return null;
    const rel = abs.pathname.slice(baseDir.pathname.length).split('/').map((p) => encodeURIComponent(decodeURIComponent(p))).join('/');
    return `/api/cameras/${cameraId}/hls/${rel}${abs.search}`;
  };
  return String(text).split(/\r?\n/).map((line) => {
    if (!line || line.startsWith('#')) {
      return line.replace(/URI="([^"]+)"/g, (m, uri) => { const p = toProxy(uri); return p ? `URI="${p}"` : m; });
    }
    return toProxy(line.trim()) ?? '';
  }).join('\n');
}

/** The upstream address for a proxied HLS path, kept inside the stream's directory. */
export function upstreamFor(streamUrl, parts, search = '') {
  const base = new URL(streamUrl);
  if (parts.length === 1 && parts[0] === 'index.m3u8') return base.toString();
  if (parts.some((p) => p === '..' || p === '.' || p.includes('\\') || p.includes('/'))) return null;
  const target = new URL(parts.map(encodeURIComponent).join('/') + (search || ''), new URL('.', base));
  return target.origin === base.origin ? target.toString() : null;
}
