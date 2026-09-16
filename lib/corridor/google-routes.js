import { validationError } from '../errors.js';
import { clipToTerminals, chainages, clipChainage } from './geometry-import.js';

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
 * THE TOLL CARRIAGEWAY, NOT THE SERVICE ROAD. The corridor has a tolled,
 * access-controlled carriageway and parallel service roads, and the two behave
 * differently: the toll road runs free while the service road jams. A plain
 * "drive from A to B" lets Google pick whichever it thinks is quicker at that
 * moment — a service-road route would then be published as the expressway's
 * condition. Two guards:
 *
 *   1. Every request carries `via` waypoints taken from the surveyed
 *      centreline between the section's ends (a quarter, half and three
 *      quarters of the way along), so the computed route must pass through
 *      the toll carriageway itself.
 *   2. Google's distance is compared with the surveyed section length. A
 *      route that is more than 12% longer or shorter left the corridor; that
 *      section is published as "not measured" rather than as a reading of the
 *      wrong road.
 *
 * Enabled by GOOGLE_ROUTES_API_KEY. One request per section per refresh.
 */
export const MAX_DISTANCE_DEVIATION = 0.12;
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
export function parseRoute(payload, { expectedMeters = null } = {}) {
  const route = payload?.routes?.[0];
  const duration = seconds(route?.duration);
  const staticDuration = seconds(route?.staticDuration);
  const distance = Number(route?.distanceMeters);
  if (!(duration > 0) || !(staticDuration > 0) || !(distance > 0)) {
    throw validationError('Google did not return a usable drive time for every section.');
  }
  // Off the corridor: Google drove a different road (the service road, a
  // detour, a closed ramp). Not a measurement of this section.
  if (expectedMeters > 0 && Math.abs(distance - expectedMeters) / expectedMeters > MAX_DISTANCE_DEVIATION) {
    return { condition: 'unknown', speed: null, offCorridor: true };
  }
  const speed = Math.round((distance / duration) * 3.6);
  if (speed > 250) throw validationError('Google returned an implausible speed for a section.');
  return { condition: routeCondition(duration, staticDuration), speed };
}

/**
 * A section's two ends, plus — when the surveyed alignment is available — the
 * `via` points along the toll carriageway and the surveyed length the answer
 * is checked against. Without geometry the request is the bare A-to-B it
 * always was, so an installation that has not imported the alignment still
 * measures something.
 */
export function sectionEndpoints(sections, waypoints, geometry = []) {
  const line = Array.isArray(geometry) && geometry.length >= 2
    ? geometry.map((p) => ({ lat: Number(p.lat), lng: Number(p.lng) }))
    : null;
  return sections.map((section) => {
    const from = waypoints.find((w) => w.code === section.from_code);
    const to = waypoints.find((w) => w.code === section.to_code);
    if (!from || !to) throw validationError('A section is missing a waypoint.');
    const a = { lat: Number(from.lat), lng: Number(from.lng) };
    const b = { lat: Number(to.lat), lng: Number(to.lng) };
    const out = { id: section.id, from: a, to: b, via: [], expectedMeters: null };
    if (line) {
      try {
        const clipped = clipToTerminals(line, a, b).line;
        const length = chainages(clipped).at(-1)?.chainage_m || 0;
        if (length > 0) {
          out.expectedMeters = length;
          out.via = [0.25, 0.5, 0.75]
            .map((f) => clipChainage(clipped, length * f, length * f + 1)[0])
            .filter(Boolean)
            .map((p) => ({ lat: p.lat, lng: p.lng }));
        }
      } catch { /* no usable alignment for this section: bare A-to-B */ }
    }
    return out;
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
        body: JSON.stringify({
          origin: point(e.from),
          destination: point(e.to),
          // Pass-through points on the toll carriageway: the route may not
          // leave the expressway for the service road between them.
          intermediates: (e.via || []).map((p) => ({ ...point(p), via: true })),
          travelMode: 'DRIVE',
          routingPreference: 'TRAFFIC_AWARE',
          routeModifiers: { avoidTolls: false },
        }),
      });
    } catch {
      throw validationError('Google could not be reached. Existing measurements were kept.');
    }
    if (!response.ok) throw validationError(`Google returned HTTP ${response.status}. Existing measurements were kept.`);
    let payload;
    try { payload = await response.json(); } catch { throw validationError('Google returned an unreadable response.'); }
    return { id: e.id, ...parseRoute(payload, { expectedMeters: e.expectedMeters }) };
  }));
}
