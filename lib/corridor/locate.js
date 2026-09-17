import { nearestOnLine } from './geometry-import.js';
import { isPlainObject } from '../json.js';

/**
 * "Where am I on the expressway": a kilometre marker or a GPS fix, turned
 * into a chainage and what is around it.
 *
 * The control room and 999 both ask a stranded driver for the marker on the
 * nearest post (K12, K12+300). This module reads that marker, or projects a
 * browser position onto the surveyed centreline, and answers with the
 * stretch's status, the nearest toll plaza and the next exit each way. It is
 * pure so every refusal can be tested without a browser or a database.
 */
export const LOCATE_KEYS = Object.freeze({ marker: 'km', lat: 'lat', lng: 'lng' });

/** Kinds a driver can leave the road at. Bridges and footbridges are not exits. */
const EXIT_KINDS = new Set(['interchange', 'toll_plaza']);
const STRUCTURE_KINDS = new Set(['bridge', 'pedestrian_overpass']);

/** A fix further than this from the centreline is not on the expressway. */
export const MAX_OFFSET_M = 2000;
/** Structures worth mentioning as a landmark, either side of the position. */
const NEARBY_M = 1500;

const first = (value) => {
  if (Array.isArray(value)) return typeof value[0] === 'string' ? value[0] : '';
  return typeof value === 'string' ? value : '';
};

/** Bengali digits are typed on Bangla keyboards; the posts themselves are Latin. */
const BENGALI_ZERO = 0x09e6;
export function latinDigits(text) {
  return String(text).replace(/[০-৯]/g, (d) => String(d.charCodeAt(0) - BENGALI_ZERO));
}

/**
 * "K12", "K12+300", "12+300", "12", "12.3", "12,3" -> metres, or null.
 *
 * A bare number is kilometres, not metres: nobody reads "12" off a post and
 * means twelve metres. A decimal is tenths of a kilometre.
 */
export function parseMarker(text) {
  if (typeof text !== 'string') return null;
  const s = latinDigits(text).trim().toUpperCase().replace(/\s+/g, '').replace(/,/g, '.');
  if (!s) return null;
  const withPlus = /^K?(\d{1,3})\+(\d{1,3})$/.exec(s);
  if (withPlus) return Number(withPlus[1]) * 1000 + Number(withPlus[2]);
  const km = /^K?(\d{1,3})(?:\.(\d{1,3}))?(?:KM)?$/.exec(s);
  if (km) return Math.round(Number(`${km[1]}.${km[2] || '0'}`) * 1000);
  return null;
}

const coord = (raw, limit) => {
  const s = first(raw).trim();
  if (!/^-?\d{1,3}(\.\d+)?$/.test(s)) return null;
  const n = Number(s);
  return Number.isFinite(n) && Math.abs(n) <= limit ? n : null;
};

/** What the visitor asked, off a plain query object. */
export function readLocateQuery(search) {
  const own = (key) => (isPlainObject(search) && Object.hasOwn(search, key) ? search[key] : undefined);
  const marker = first(own(LOCATE_KEYS.marker)).trim();
  const lat = coord(own(LOCATE_KEYS.lat), 90);
  const lng = coord(own(LOCATE_KEYS.lng), 180);
  return {
    marker,
    point: lat !== null && lng !== null ? { lat, lng } : null,
    chosen: own(LOCATE_KEYS.marker) !== undefined || own(LOCATE_KEYS.lat) !== undefined,
  };
}

const usableLine = (geometry) => (Array.isArray(geometry) ? geometry : [])
  .map((g) => ({ lat: Number(g?.lat), lng: Number(g?.lng), chainage_m: Number(g?.chainage_m) }))
  .filter((g) => Number.isFinite(g.lat) && Number.isFinite(g.lng) && Number.isFinite(g.chainage_m));

/** A position -> chainage along the centreline, and how far off it the position is. */
export function projectPoint(point, geometry) {
  const line = usableLine(geometry);
  if (line.length < 2 || !point) return null;
  const hit = nearestOnLine(line, point);
  if (!Number.isFinite(hit.metres)) return null;
  const a = line[hit.index];
  const b = line[hit.index + 1] || a;
  const chainage = Math.round(a.chainage_m + hit.t * (b.chainage_m - a.chainage_m));
  return { chainageM: chainage, offsetM: Math.round(hit.metres) };
}

const rows = (list) => (Array.isArray(list) ? list.filter(isPlainObject) : []);
const chainageOf = (row) => Number(row.chainage_m);

export function corridorLengthM(geometry, interchanges) {
  const line = usableLine(geometry);
  if (line.length) return Math.max(...line.map((g) => g.chainage_m));
  const points = rows(interchanges).map(chainageOf).filter(Number.isFinite);
  return points.length ? Math.max(...points) : 0;
}

function nearest(candidates, here, pick) {
  let best = null;
  for (const row of candidates) {
    const at = chainageOf(row);
    if (!Number.isFinite(at) || !pick(at)) continue;
    const distance = Math.abs(at - here);
    if (!best || distance < best.distanceM) best = { row, distanceM: distance };
  }
  return best;
}

/**
 * The answer, or the reason there is none.
 *
 *   idle        nothing asked yet
 *   invalid     the marker could not be read
 *   beyond      a real marker past the corridor's end
 *   off-road    a position too far from the centreline
 *   no-geometry a position given but no centreline to project onto
 *   located     a chainage with its surroundings
 */
export function locate({ query, geometry, interchanges, segments, maxOffsetM = MAX_OFFSET_M } = {}) {
  const asked = readLocateQuery(query);
  const lengthM = corridorLengthM(geometry, interchanges);
  const base = { ...asked, lengthM };
  if (!asked.chosen) return { ...base, status: 'idle' };

  let chainageM = null;
  let offsetM = null;
  if (asked.point) {
    const projected = projectPoint(asked.point, geometry);
    if (!projected) return { ...base, status: 'no-geometry' };
    if (projected.offsetM > maxOffsetM) return { ...base, status: 'off-road', offsetM: projected.offsetM };
    chainageM = projected.chainageM;
    offsetM = projected.offsetM;
  } else {
    chainageM = parseMarker(asked.marker);
    if (chainageM === null) return { ...base, status: 'invalid' };
  }
  if (lengthM > 0 && chainageM > lengthM) return { ...base, status: 'beyond', chainageM };

  const features = rows(interchanges);
  const exits = features.filter((r) => EXIT_KINDS.has(r.kind));
  const plazas = features.filter((r) => r.kind === 'toll_plaza');
  const segment = rows(segments).find((s) => Number(s.from_m) <= chainageM && chainageM <= Number(s.to_m)) || null;

  return {
    ...base,
    status: 'located',
    chainageM,
    offsetM,
    segment,
    nearestPlaza: nearest(plazas, chainageM, () => true),
    towardsStart: nearest(exits, chainageM, (at) => at < chainageM),
    towardsEnd: nearest(exits, chainageM, (at) => at > chainageM),
    structures: features
      .filter((r) => STRUCTURE_KINDS.has(r.kind) && Math.abs(chainageOf(r) - chainageM) <= NEARBY_M)
      .map((row) => ({ row, distanceM: Math.abs(chainageOf(row) - chainageM) }))
      .sort((a, b) => a.distanceM - b.distanceM),
  };
}
