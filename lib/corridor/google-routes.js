import { validationError } from '../errors.js';

/**
 * Live section conditions from Google's Routes API (INT.9).
 *
 * TomTom has no traffic coverage in Bangladesh (verified 13 September 2026:
 * Flow Segment Data answers "no segment near this point" for every road in
 * Dhaka). Google's Routes API does carry live traffic here. For each corridor
 * section it is asked for the drive between the section's two waypoints with
 * TRAFFIC_AWARE routing, and answers two durations: with current traffic, and
 * without it. Their ratio is the congestion; distance over duration is the
 * average speed.
 *
 * Enabled by GOOGLE_ROUTES_API_KEY. One request per section per refresh.
 */
export const ROUTES_URL = 'https://routes.googleapis.com/directions/v2:computeRoutes';

/** Congestion from the ratio of the live drive time to the free-flow one. */
export function routeCondition(durationS, staticDurationS) {
  if (!(durationS > 0) || !(staticDurationS > 0)) return 'unknown';
  const ratio = durationS / staticDurationS;
  return ratio <= 1.15 ? 'free' : ratio <= 1.4 ? 'moderate' : ratio <= 1.8 ? 'slow' : 'heavy';
}

const seconds = (v) => {
  const m = /^(\d+(?:\.\d+)?)s$/.exec(String(v || ''));
  return m ? Number(m[1]) : NaN;
};

/** One route response -> { condition, speed } or a validation error. */
export function parseRoute(payload) {
  const route = payload?.routes?.[0];
  const duration = seconds(route?.duration);
  const staticDuration = seconds(route?.staticDuration);
  const distance = Number(route?.distanceMeters);
  if (!(duration > 0) || !(staticDuration > 0) || !(distance > 0)) {
    throw validationError('Google did not return a usable drive time for every section.');
  }
  const speed = Math.round((distance / duration) * 3.6);
  if (speed > 250) throw validationError('Google returned an implausible speed for a section.');
  return { condition: routeCondition(duration, staticDuration), speed };
}

export function sectionEndpoints(sections, waypoints) {
  return sections.map((section) => {
    const from = waypoints.find((w) => w.code === section.from_code);
    const to = waypoints.find((w) => w.code === section.to_code);
    if (!from || !to) throw validationError('A section is missing a waypoint.');
    return { id: section.id, from: { lat: Number(from.lat), lng: Number(from.lng) }, to: { lat: Number(to.lat), lng: Number(to.lng) } };
  });
}

export async function fetchSectionRoutes(endpoints, { key, fetchImpl = fetch } = {}) {
  if (!key) throw validationError('GOOGLE_ROUTES_API_KEY is not configured on the server.');
  if (!endpoints.length) throw validationError('There are no sections to refresh.');
  const point = (p) => ({ location: { latLng: { latitude: p.lat, longitude: p.lng } } });
  return Promise.all(endpoints.map(async (e) => {
    let response;
    try {
      response = await fetchImpl(ROUTES_URL, {
        method: 'POST',
        cache: 'no-store',
        signal: AbortSignal.timeout(12000),
        headers: {
          'content-type': 'application/json',
          'X-Goog-Api-Key': key,
          'X-Goog-FieldMask': 'routes.duration,routes.staticDuration,routes.distanceMeters',
        },
        body: JSON.stringify({ origin: point(e.from), destination: point(e.to), travelMode: 'DRIVE', routingPreference: 'TRAFFIC_AWARE' }),
      });
    } catch {
      throw validationError('Google could not be reached. Existing measurements were kept.');
    }
    if (!response.ok) throw validationError(`Google returned HTTP ${response.status}. Existing measurements were kept.`);
    let payload;
    try { payload = await response.json(); } catch { throw validationError('Google returned an unreadable response.'); }
    return { id: e.id, ...parseRoute(payload) };
  }));
}
