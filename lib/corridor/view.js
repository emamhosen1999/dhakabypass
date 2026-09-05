/**
 * Everything the corridor map draws, as plain data.
 *
 * WHY THIS FILE EXISTS. The map is interactive, so the component that renders
 * it runs in the browser — and a client component cannot be handed a function.
 * Every label on that map is localised, every number goes through the reader's
 * own formatter, and both of those live on the server. So the server builds a
 * fully-formatted, fully-serialisable description of the drawing, and the
 * client renders it and adds the behaviour.
 *
 * The alternative — shipping the translations and the geometry maths to the
 * browser so it could format there — is a much larger bundle to do work that
 * has one correct answer per locale and is already known at build time.
 */
import context from './data/map-context.json';
import { ROAD_REFERENCES } from './road-references.js';
import { buildCorridorMap, projectMercator } from './map.js';
import { t } from '../i18n/ui.js';

/** SVG units for the facility label text. */
export const LABEL_FONT = 15;

/** The frame the corridor is fitted into, before the gutters are added. */
const FRAME = { width: 1280, height: 920, padding: 100, fixedFrame: true };

const CONDITION_STROKE = {
  free: 'var(--db-open)',
  moderate: 'var(--db-traffic-moderate)',
  slow: 'var(--db-traffic-slow)',
  heavy: 'var(--db-alert)',
  closed: 'var(--db-ink-3)',
  unknown: 'var(--db-rule-2)',
};

/**
 * How wide the label column has to be.
 *
 * Measured from the longest name that will actually be drawn, because the
 * alternative is a fixed number: too small and "Vogra Toll Plaza (RHS)" is
 * clipped at the edge of the viewBox with no error anywhere, too large and the
 * map shrinks to leave a strip of empty grey. There is no text metric on the
 * server, so this is an estimate — CJK and Bengali glyphs are about one em
 * wide, Latin about 0.55 — rounded up, then clamped so one absurd name from the
 * admin cannot squeeze the road out of the frame.
 */
export function gutterFor(features, font = LABEL_FONT) {
  const widest = (features || []).reduce((max, f) => {
    const name = String(f && f.name ? f.name : '');
    if (!name) return max;
    let w = 0;
    for (const ch of name) w += /[ঀ-৿　-鿿＀-￯]/.test(ch) ? 1 : 0.55;
    return Math.max(max, w);
  }, 0);
  // 16 for the leader elbow, 10 to keep the text off the frame edge.
  return Math.min(340, Math.max(150, Math.round(widest * font) + 26));
}

/**
 * A grid value as a reader expects to see it: `90.40°E`, with exactly as many
 * decimals as the step needs. A fixed two decimals prints `23.90` for two
 * different parallels when the step is 0.025; a raw float prints
 * `23.925000000000001`.
 */
export function formatDegrees(value, step, positive, negative) {
  const digits = Math.min(4, Math.max(0, Math.ceil(-Math.log10(step || 1))));
  return `${Math.abs(value).toFixed(digits)}°${value < 0 ? negative : positive}`;
}

/** The bounding box of one section's path, used to zoom to it on selection. */
function bboxOf(d) {
  const nums = String(d).match(/-?\d+(?:\.\d+)?/g) || [];
  let x0 = Infinity; let y0 = Infinity; let x1 = -Infinity; let y1 = -Infinity;
  for (let i = 0; i + 1 < nums.length; i += 2) {
    const x = Number(nums[i]);
    const y = Number(nums[i + 1]);
    if (x < x0) x0 = x;
    if (x > x1) x1 = x;
    if (y < y0) y0 = y;
    if (y > y1) y1 = y;
  }
  return Number.isFinite(x0) ? { x: x0, y: y0, w: Math.max(1, x1 - x0), h: Math.max(1, y1 - y0) } : null;
}

/**
 * Build the map, then describe it in strings and numbers only.
 *
 * @param {object} o
 * @param {string} o.locale
 * @param {Function} o.km      `(metres, digits) => "12.1 km"` in the reader's language
 * @param {Function} o.waypointName  `(code) => "Naojor (corridor start)"`
 */
export function buildMapView({
  waypoints = [], sections = [], features = [], geometry = [],
  locale = 'en', km, waypointName,
}) {
  const fmtKm = km || ((m, d = 1) => `${(m / 1000).toFixed(d)} km`);
  const nameOf = waypointName || ((code) => `${t(locale, 'mapWaypoint')} ${code}`);

  const map = buildCorridorMap({ waypoints, sections, features, geometry, ...FRAME });
  if (!map.ok) return { ok: false };
  const p = map.projection;
  const place = (lng, lat) => {
    const q = projectMercator(lat, lng);
    return { x: p.offX + (q.x-p.x)*p.scale, y: p.offY + (q.y-p.y)*p.scale };
  };
  const pathOf = coordinates => coordinates.map(([lng,lat],i) => {
    const q=place(lng,lat); return (i?'L':'M')+q.x.toFixed(2)+','+q.y.toFixed(2);
  }).join('');
  const geography = {
    image: context.image, download: context.download, date: context.date,
    x:p.offX+(context.extent.x-p.x)*p.scale, y:p.offY+(context.extent.y-p.y)*p.scale,
    width:context.extent.w*p.scale, height:context.extent.h*p.scale,
    highlights:context.highlights.map((r,i)=>({id:r.id+'-'+i,roadId:r.ref||r.name||r.id,kind:r.kind,name:r.name,major:r.major,d:pathOf(r.coordinates)})),
    junctions:context.junctions.map(j=>({...place(j.lng,j.lat),kind:j.kind,name:j.name})),
  };
  const roadGroups = new Map();
  for (const road of context.highlights) {
    const id = road.ref || road.name || road.id;
    if (!roadGroups.has(id)) {
      const reference = ROAD_REFERENCES[road.ref];
      const ends = [road.coordinates[0], road.coordinates.at(-1)];
      const position = road.position || road.coordinates[0];
      const end = ends.sort((a,b)=>Math.hypot(b[0]-position[0],b[1]-position[1])-Math.hypot(a[0]-position[0],a[1]-position[1]))[0];
      roadGroups.set(id, { id, ref: road.ref || '', name: reference?.name || road.name || '',
        source: reference?.source || `https://www.openstreetmap.org/way/${road.id}`,
        category: /^N\d/.test(road.ref)?'national':/^R\d/.test(road.ref)?'regional':/^Z\d/.test(road.ref)?'district':'local',
        kinds: [], paths: [], ...place(...end), major:road.major,
      });
    }
    const group = roadGroups.get(id);
    if (!group.kinds.includes(road.kind)) group.kinds.push(road.kind);
    group.paths.push(pathOf(road.coordinates));
  }
  geography.roads = [...roadGroups.values()].map(({paths,...r})=>({...r,bbox:bboxOf(paths.join(' '))}));

  const [, , width, height] = map.viewBox.split(' ').map(Number);

  return {
    ok: true,
    viewBox: map.viewBox,
    width,
    height,
    metresPerUnit: 40030228.884 * Math.cos(((map.bounds.minLat+map.bounds.maxLat)/2)*Math.PI/180) / map.projection.scale,
    d: map.d,
    hasCentreline: map.hasCentreline,
    labelFont: LABEL_FONT,
    geography,
    linePoints: map.linePoints,
    facilities: map.features.map(f=>({...f,id:String(f.id)})),

    sections: map.sections.map((s) => ({
      id: String(s.id),
      d: s.d,
      condition: s.condition,
      stroke: s.condition === 'closed' ? 'url(#db-map-closed)' : CONDITION_STROKE[s.condition] || CONDITION_STROKE.unknown,
      colour: CONDITION_STROKE[s.condition] || CONDITION_STROKE.unknown,
      bbox: bboxOf(s.d),
      // The SURVEYED length, not the drawn one: the traffic distribution
      // answers "how much of my journey", and the honest denominator for that
      // is the measured chainage, never however many SVG units the line
      // happens to occupy.
      lengthM: s.lengthM,
      // The native SVG tooltip, and the accessible name of the matching list
      // button. One string, so the two can never say different things.
      title: `${nameOf(s.fromCode)} — ${nameOf(s.toCode)} · `
        + `${fmtKm(s.fromChainage)}–${fmtKm(s.toChainage)} · `
        + t(locale, `traffic_${s.condition}`),
      name: `${nameOf(s.fromCode)} — ${nameOf(s.toCode)}`,
      meta: `${fmtKm(s.fromChainage)}–${fmtKm(s.toChainage)}`
        + (s.avgSpeedKmh ? ` · ${s.avgSpeedKmh} ${t(locale, 'mapKmh')}` : ''),
      conditionLabel: t(locale, `traffic_${s.condition}`),
    })),

    features: map.features.map((f) => ({
      id: String(f.id), x: f.x, y: f.y, kind: f.kind,
      pending: Boolean(f.status && f.status !== 'open'),
    })),

    labels: map.labels.map((f) => ({
      id: String(f.id), x: f.x, y: f.y, labelX: f.labelX, labelY: f.labelY, name: f.name,
    })),

    waypoints: map.waypoints.map((w) => ({
      code: w.code, x: w.x, y: w.y, terminal: w.terminal, name: nameOf(w.code),
      chainageLabel: w.showChainage ? fmtKm(w.chainage) : null,
    })),

    graticule: map.graticule ? {
      box: map.graticule.box,
      meridians: map.graticule.meridians.map((m) => ({
        x: m.x, text: formatDegrees(m.lng, m.step, 'E', 'W'),
      })),
      parallels: map.graticule.parallels.map((p) => ({
        y: p.y, text: formatDegrees(p.lat, p.step, 'N', 'S'),
      })),
    } : null,

    scale: buildScaleBar(map, waypoints, fmtKm),
    north: t(locale, 'mapNorth'),
    alt: t(locale, 'mapAltText'),
  };
}

/**
 * How long a round number of kilometres is, in SVG units.
 *
 * Derived from two real waypoints rather than from the projection constants:
 * measure the great-circle distance between the first and last waypoint, divide
 * by the drawn distance between the same two points, and the result is
 * units-per-metre for this particular rendering. That stays correct if the
 * frame, the padding or the corridor ever change.
 */
function buildScaleBar(map, waypoints, fmtKm) {
  const drawn = map.waypoints;
  if (drawn.length < 2) return null;
  const first = drawn[0];
  const last = drawn[drawn.length - 1];
  const source = (waypoints || []).filter((w) => w.lat != null && w.lng != null);
  const a = source.find((w) => String(w.code) === first.code);
  const b = source.find((w) => String(w.code) === last.code);
  if (!a || !b) return null;

  const R = 6371008.8;
  const toRad = (deg) => (Number(deg) * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const hav = Math.sin(dLat / 2) ** 2
    + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  const metres = 2 * R * Math.asin(Math.min(1, Math.sqrt(hav)));

  const px = Math.hypot(last.x - first.x, last.y - first.y);
  if (!metres || !px) return null;
  const unitsPerKm = (px / metres) * 1000;

  // The largest round distance that stays under a third of the frame width, so
  // the bar never crowds the map it is measuring.
  const budget = map.width / 3;
  const kmVal = [20, 10, 5, 2, 1].find((n) => n * unitsPerKm <= budget);
  return kmVal ? { px: kmVal * unitsPerKm, text: fmtKm(kmVal * 1000, 0) } : null;
}
