import { rateLimit, clientIp } from '../rate-limit.js';
import { logError } from '../log.js';

/**
 * The shape every open-data route shares: a per-address limit, a short
 * public cache, CORS for a browser on any site, and a 503 rather than a
 * stack trace when a reader fails. Sixty a minute is generous for a person
 * and a dispatcher's dashboard alike, and still stops a loop.
 */
export const OPEN_DATA_LIMIT = 60;
export const OPEN_DATA_WINDOW_MS = 60_000;
export const OPEN_DATA_MAX_AGE = 60;

const CORS = { 'access-control-allow-origin': '*', 'access-control-allow-methods': 'GET, OPTIONS' };

export function openDataHeaders(contentType, extra = {}) {
  return {
    'content-type': contentType,
    'cache-control': `public, max-age=${OPEN_DATA_MAX_AGE}, s-maxage=${OPEN_DATA_MAX_AGE}`,
    ...CORS,
    ...extra,
  };
}

export async function respondOpenData(request, produce, { name = 'open-data' } = {}) {
  const ip = clientIp(request.headers);
  const gate = rateLimit('open-data', ip, { limit: OPEN_DATA_LIMIT, windowMs: OPEN_DATA_WINDOW_MS });
  if (!gate.ok) {
    return new Response(null, {
      status: 429,
      headers: { 'retry-after': String(Math.ceil(gate.retryAfterMs / 1000)), 'cache-control': 'no-store', ...CORS },
    });
  }
  try {
    const { body, contentType, extra } = await produce();
    return new Response(body, { status: 200, headers: openDataHeaders(contentType, extra) });
  } catch (err) {
    logError(`${name}.failed`, err);
    return new Response(null, { status: 503, headers: { 'cache-control': 'no-store', ...CORS } });
  }
}

export function preflight() {
  return new Response(null, { status: 204, headers: CORS });
}
