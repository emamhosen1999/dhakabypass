/**
 * Turning surveyed coordinates into an SVG corridor map.
 *
 * Pure. No database, no DOM, no React — so the projection, the fitting and the
 * per-section splitting can all be tested against known values, which matters
 * because a map that is subtly wrong looks exactly like a map that is right.
 *
 * ---------------------------------------------------------------------------
 * WHERE THE LINE COMES FROM
 * ---------------------------------------------------------------------------
 * Every vertex is a surveyed coordinate. The alignment is drawn through the
 * union of two sets, ordered by chainage:
 *
 *   - the eight road-network waypoints (DBEDC_Corridor_Waypoints.xlsx sheet 2)
 *   - every interchange, toll plaza and bridge, which carry their own surveyed
 *     lat/lng projected onto the same centreline
 *
 * That is ~28 points rather than 8, which is the difference between a zigzag
 * and something that reads as a road — WITHOUT inventing a single coordinate.
 * No spline, no smoothing: an interpolated curve between sparse points asserts
 * a bend the survey never recorded, and on an operator's own map of its own
 * road that is exactly the kind of small invention this project refuses.
 * Straight segments with round joins, drawn through real points.
 *
 * The facility offsets from the centreline are between 0.5 and 17 metres. At a
 * corridor scale of 48 km across ~1000px, 17m is under half a pixel.
 *
 * ---------------------------------------------------------------------------
 * PROJECTION
 * ---------------------------------------------------------------------------
 * Web Mercator, the projection every tile provider serves — so when a TomTom
 * basemap is configured, the overlay lines up with the tiles underneath instead
 * of drifting. At this latitude (~23.8°N) and over 48km, the difference from an
 * equirectangular approximation is visible, so it is worth doing properly.
 */

/** Web Mercator, normalised to the unit square. Latitude is clamped to the
 *  projection's valid range so a bad row cannot produce Infinity. */
export function projectMercator(lat, lng) {
  const phi = (Math.max(-85.05112878, Math.min(85.05112878, Number(lat))) * Math.PI) / 180;
  const x = (Number(lng) + 180) / 360;
  const y = (1 - Math.log(Math.tan(phi) + 1 / Math.cos(phi)) / Math.PI) / 2;
  return { x, y };
}

/** Metres between two coordinates. Haversine, the same formula and Earth radius
 *  (6371.0088 km) the survey workbook used, so lengths agree with its chainages. */
export function haversineMetres(a, b) {
  const R = 6371008.8;
  const toRad = (d) => (Number(d) * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const s = Math.sin(dLat / 2) ** 2
    + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(s)));
}

const num = (v) => (v == null ? null : Number(v));

/**
 * Build everything an SVG needs.
 *
 * @param {object}  o
 * @param {Array}   o.waypoints  `{ code, lat, lng, chainage_m }`, the alignment
 * @param {Array}   o.sections   `{ from_code, to_code, condition_key, ... }`
 * @param {Array}   o.features   `{ id, lat, lng, chainage_m, kind, name }`
 * @param {number}  o.width      viewBox width  (a coordinate space, not pixels)
 * @param {number}  o.height     viewBox height
 * @param {number}  o.padding    inset so markers near an edge are not clipped
 */
export function buildCorridorMap({
  waypoints = [], sections = [], features = [], geometry = [],
  width = 1000, height = 760, padding = 48,
  // Space reserved OUTSIDE the projected road box: facility names on the right,
  // chainages on the left. Reserving it before fitting is what stops a label
  // from being drawn past the edge of the viewBox and silently clipped.
  labelGutter = 0, chainageGutter = 0,
  labelGap = 26,
} = {}) {
  const wp = waypoints
    .filter((w) => num(w.lat) != null && num(w.lng) != null)
    .map((w) => ({
      code: String(w.code),
      lat: Number(w.lat),
      lng: Number(w.lng),
      chainage: Number(w.chainage_m) || 0,
    }))
    .sort((a, b) => a.chainage - b.chainage);

  if (wp.length < 2) {
    return { ok: false, viewBox: `0 0 ${width} ${height}`, sections: [], waypoints: [], features: [] };
  }

  const feats = features
    .filter((f) => num(f.lat) != null && num(f.lng) != null)
    .map((f) => ({
      id: f.id,
      lat: Number(f.lat),
      lng: Number(f.lng),
      chainage: Number(f.chainage_m) || 0,
      kind: f.kind || 'interchange',
      name: f.name || '',
      status: f.status || null,
    }))
    .sort((a, b) => a.chainage - b.chainage);

  /**
   * THE DRAWN LINE.
   *
   * First choice is `geometry`: the imported road centreline, a few hundred
   * points that follow the road's actual curvature. Second is the surveyed
   * waypoints and facilities in chainage order — twenty points over 47.6 km,
   * which is a polyline and looks like one. Both are real; only the first is
   * the shape of the road, and `hasCentreline` below is what lets the page say
   * which one a reader is looking at instead of leaving them to assume.
   *
   * Nothing is interpolated in either case. A spline through sparse points
   * asserts bends the survey never recorded.
   */
  const centreline = (geometry || [])
    .filter((g) => num(g.lat) != null && num(g.lng) != null)
    .map((g) => ({
      lat: Number(g.lat), lng: Number(g.lng), chainage: Number(g.chainage_m) || 0,
    }))
    .sort((a, b) => a.chainage - b.chainage);
  const hasCentreline = centreline.length >= 2;

  const markers = [...wp.map((w) => ({ ...w, isWaypoint: true })), ...feats.map((f) => ({ ...f, isWaypoint: false }))]
    .sort((a, b) => a.chainage - b.chainage);
  const alignment = hasCentreline ? centreline : markers;
  // Everything that has to fit inside the frame: the line AND every marker on
  // it. A marker sits on the road, but a surveyed point can be a few metres off
  // an imported line, and near a terminal that is the difference between inside
  // the viewBox and clipped.
  const vertices = hasCentreline ? [...centreline, ...markers] : markers;

  // Fit: project everything, take the bounds, then scale uniformly so the
  // corridor is not stretched. A non-uniform fit would make the road's shape a
  // lie even though every point sat in the right relative place.
  const projected = vertices.map((v) => ({ ...v, ...projectMercator(v.lat, v.lng) }));
  const xs = projected.map((p) => p.x);
  const ys = projected.map((p) => p.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const spanX = maxX - minX || 1e-9;
  const spanY = maxY - minY || 1e-9;
  const inner = {
    w: Math.max(1, width - padding * 2 - labelGutter - chainageGutter),
    h: Math.max(1, height - padding * 2),
  };
  const scale = Math.min(inner.w / spanX, inner.h / spanY);
  const offX = padding + chainageGutter;
  const offY = padding;

  /**
   * The frame WRAPS the corridor rather than the corridor sitting inside a
   * fixed frame.
   *
   * This road runs north-west to south-east, so its projected bounds are
   * roughly 0.7 wide to 1 tall. Fitted uniformly into a 1000x720 landscape box
   * it filled about a third of the width and left two dead margins either side
   * — the map read as a thin line adrift in a grey rectangle. Emitting a
   * viewBox around the content instead means the drawing fills whatever
   * container it is given, at the corridor's own proportions, with no
   * distortion and no wasted space.
   */
  const frame = {
    w: spanX * scale + padding * 2 + labelGutter + chainageGutter,
    h: spanY * scale + padding * 2,
  };

  const place = (p) => ({
    x: offX + (p.x - minX) * scale,
    y: offY + (p.y - minY) * scale,
  });

  const points = projected.map((p) => ({ ...p, ...place(p) }));
  const byChainage = (a, b) => a.chainage - b.chainage;
  // The drawn line, placed. Separate from `points` because `points` also
  // carries the markers, which are not part of the road's shape.
  const linePoints = alignment
    .map((p) => ({ ...p, ...place(projectMercator(p.lat, p.lng)) }))
    .sort(byChainage);

  const toPath = (list) =>
    list.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' ');

  // Split the alignment at each waypoint so a section can be coloured
  // independently. A vertex that sits exactly on a boundary belongs to BOTH
  // adjacent paths — without that the two segments would not meet and the road
  // would show a hairline gap at every waypoint.
  const wpChainages = wp.map((w) => w.chainage);
  /**
   * Where a section starts and ends ON THE DRAWN LINE.
   *
   * By nearest point rather than by chainage, because the two are not the same
   * ruler once a real centreline is imported: its length is measured along the
   * points it actually has, and the survey's chainages were measured along the
   * as-designed alignment. They agree to within a few metres, and a few metres
   * of disagreement at a boundary is a section that starts just before or just
   * after the waypoint it is named for. Nearest-point puts the boundary exactly
   * at the surveyed waypoint, which is where a reader expects it.
   */
  const nearestOnLine = (target) => {
    let best = 0;
    let bestD = Infinity;
    for (let i = 0; i < linePoints.length; i += 1) {
      const d = haversineMetres(target, linePoints[i]);
      if (d < bestD) { bestD = d; best = i; }
    }
    return best;
  };
  const sectionRows = sections
    .map((s) => {
      const from = wp.find((w) => w.code === String(s.from_code));
      const to = wp.find((w) => w.code === String(s.to_code));
      if (!from || !to) return null;
      const lo = Math.min(from.chainage, to.chainage);
      const hi = Math.max(from.chainage, to.chainage);
      const ia = nearestOnLine(from);
      const ib = nearestOnLine(to);
      const slice = linePoints.slice(Math.min(ia, ib), Math.max(ia, ib) + 1);
      if (slice.length < 2) return null;
      return {
        id: s.id ?? `${s.from_code}-${s.to_code}`,
        fromCode: String(s.from_code),
        toCode: String(s.to_code),
        fromChainage: lo,
        toChainage: hi,
        lengthM: hi - lo,
        condition: s.condition_key || 'unknown',
        avgSpeedKmh: num(s.avg_speed_kmh),
        d: toPath(slice),
        sortOrder: Number(s.sort_order) || 0,
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.sortOrder - b.sortOrder || a.fromChainage - b.fromChainage);

  /**
   * A facility whose chainage is a waypoint's chainage is the SAME point: the
   * corridor terminals appear in both tables. Drawing both put a small white
   * dot underneath every numbered marker and a second entry in the label
   * column for a place already named in the panel beside the map.
   */
  const onWaypoint = new Set(wp.map((w) => w.chainage));
  const featureRows = points
    .filter((p) => !p.isWaypoint && p.kind !== 'waypoint' && !onWaypoint.has(p.chainage))
    .map((p) => ({
      id: p.id, x: p.x, y: p.y, chainage: p.chainage, kind: p.kind, name: p.name, status: p.status,
    }));

  const labelRows = labelGutter > 0
    ? layoutLabels(featureRows.filter((f) => f.name), {
      x: padding + chainageGutter + spanX * scale,
      top: padding * 0.5,
      bottom: frame.h - padding * 0.5,
      gap: labelGap,
    })
    : [];

  return {
    ok: true,
    viewBox: `0 0 ${frame.w.toFixed(2)} ${frame.h.toFixed(2)}`,
    width: frame.w,
    height: frame.h,
    // The whole alignment as one path, used for the casing drawn beneath the
    // coloured sections so the road has a consistent outline.
    d: toPath(linePoints),
    // True when the line is the imported road centreline rather than the
    // surveyed-waypoint polyline. The page tells the reader which.
    hasCentreline,
    sections: sectionRows,
    waypoints: declutter(points.filter((p) => p.isWaypoint).map((p) => ({
      code: p.code, x: p.x, y: p.y, chainage: p.chainage,
    })), frame),
    features: featureRows,
    // The coordinate grid, so the drawing reads as a map of a real place
    // rather than a diagram floating in a grey box. Nothing is invented: every
    // line is a whole fraction of a degree, drawn where the same projection
    // puts it.
    graticule: buildGraticule({
      minX, maxX, minY, maxY, place,
      box: {
        x0: padding + chainageGutter,
        x1: padding + chainageGutter + spanX * scale,
        y0: padding,
        y1: padding + spanY * scale,
      },
    }),
    // Named facilities, placed in the right-hand gutter with a leader back to
    // the marker. Empty when no gutter was reserved.
    labels: labelRows,
    bounds: { minLat: Math.min(...vertices.map((v) => v.lat)), maxLat: Math.max(...vertices.map((v) => v.lat)),
      minLng: Math.min(...vertices.map((v) => v.lng)), maxLng: Math.max(...vertices.map((v) => v.lng)) },
    // Every waypoint chainage, so a caller can label the axis without
    // recomputing the set.
    waypointChainages: wpChainages,
  };
}

/**
 * Decide which waypoints may show a chainage label.
 *
 * S and waypoint 2 are 2.3km apart on a 47.6km corridor, so at map scale their
 * labels overlapped into an unreadable smudge. Rather than shrink every label
 * to fit the worst case, a label is suppressed when it would collide with the
 * last one drawn — the marker and its number always remain, so no waypoint
 * disappears, only the redundant distance beside a crowded one.
 *
 * The terminals always keep their label: the start and end chainages are the
 * two a reader is most likely to want.
 */
function declutter(list, frame) {
  const minGap = Math.max(18, frame.h * 0.035);
  let lastLabelled = null;
  return list.map((w, i) => {
    const terminal = i === 0 || i === list.length - 1;
    const far = !lastLabelled
      || Math.hypot(w.x - lastLabelled.x, w.y - lastLabelled.y) >= minGap;
    const showChainage = terminal || far;
    if (showChainage) lastLabelled = w;
    return { ...w, showChainage, terminal };
  });
}

/**
 * A coordinate grid across the road box.
 *
 * Chosen so there are between three and eight lines each way — fewer reads as
 * an accident, more turns the map into graph paper. The step comes from a
 * fixed ladder of round fractions of a degree, because a grid at 0.0741° is
 * not a grid a reader can use.
 *
 * The lines are placed by projecting the degree value through the SAME
 * projection as the road, so a meridian sits where a meridian actually falls.
 * Spacing the lines evenly in pixels would be a lie that happens to look right
 * at this latitude.
 */
const GRID_STEPS = [1, 0.5, 0.25, 0.1, 0.05, 0.025, 0.01, 0.005];

export function buildGraticule({ minX, maxX, minY, maxY, place, box } = {}) {
  if (!place || !box) return { meridians: [], parallels: [], box: box || null };

  // Back out the degree bounds from the projected ones. x is linear in
  // longitude; latitude has to be inverted through the Mercator formula.
  const lngOf = (x) => x * 360 - 180;
  const latOf = (y) => (Math.atan(Math.sinh(Math.PI * (1 - 2 * y))) * 180) / Math.PI;
  const west = lngOf(minX);
  const east = lngOf(maxX);
  const north = latOf(minY);
  const south = latOf(maxY);

  const pick = (span) => GRID_STEPS.find((st) => span / st >= 3) || GRID_STEPS[GRID_STEPS.length - 1];
  const lngStep = pick(east - west);
  const latStep = pick(north - south);

  const ticks = (lo, hi, step) => {
    const out = [];
    for (let v = Math.ceil(lo / step) * step; v <= hi + 1e-9; v += step) {
      out.push(Number(v.toFixed(6)));
    }
    return out;
  };

  const meridians = ticks(west, east, lngStep).map((lng) => ({
    lng, step: lngStep, x: place(projectMercator(0, lng)).x,
  }));
  const parallels = ticks(south, north, latStep).map((lat) => ({
    lat, step: latStep, y: place(projectMercator(lat, 0)).y,
  }));
  return { meridians, parallels, box, lngStep, latStep };
}

/**
 * Stack the facility labels down the right-hand gutter without overlapping.
 *
 * Each label wants to sit at its marker's own y. Two toll plazas 220 metres
 * apart want the same one, so a forward pass pushes each label down to clear
 * the one above it, and a backward pass pushes the stack back up if it has run
 * past the bottom of the frame. The leader line is what preserves the truth:
 * the label may move, the point it names does not.
 *
 * Exported for tests — a label column that quietly overlaps is the kind of
 * defect that only shows up in a screenshot.
 */
export function layoutLabels(items, { x, top, bottom, gap = 26 } = {}) {
  const sorted = (items || []).slice().sort((a, b) => a.y - b.y);
  if (!sorted.length) return [];

  let cursor = top;
  const placed = sorted.map((it) => {
    const labelY = Math.max(it.y, cursor);
    cursor = labelY + gap;
    return { ...it, labelX: x, labelY };
  });

  // Overflow past the bottom: walk back up, pulling each label to sit at most
  // `gap` above the one below it, never above `top`.
  let limit = bottom;
  for (let i = placed.length - 1; i >= 0; i -= 1) {
    if (placed[i].labelY > limit) placed[i].labelY = Math.max(top, limit);
    limit = placed[i].labelY - gap;
  }
  return placed;
}

/** The conditions a section can be in, worst first — the order a summary reads. */
export const TRAFFIC_CONDITIONS = ['closed', 'heavy', 'slow', 'moderate', 'free', 'unknown'];

/**
 * How much of the corridor is in each condition, by LENGTH rather than by
 * section count.
 *
 * Counting sections would let a 2km stretch and a 15km stretch weigh the same,
 * so "30% moderate" would mean nothing a driver could use. Length is the only
 * denominator that answers "how much of my journey".
 */
export function trafficDistribution(sections) {
  const total = (sections || []).reduce((n, s) => n + (Number(s.lengthM) || 0), 0);
  const byCondition = new Map();
  for (const s of sections || []) {
    const key = TRAFFIC_CONDITIONS.includes(s.condition) ? s.condition : 'unknown';
    byCondition.set(key, (byCondition.get(key) || 0) + (Number(s.lengthM) || 0));
  }
  return TRAFFIC_CONDITIONS
    .filter((key) => byCondition.has(key))
    .map((key) => ({
      condition: key,
      metres: byCondition.get(key),
      // Rounded for display only; the metres are the truth.
      percent: total > 0 ? Math.round((byCondition.get(key) / total) * 100) : 0,
    }));
}

/**
 * One overall condition for the whole corridor.
 *
 * The WORST condition affecting a meaningful share of the road, not an average.
 * A driver asking "how is the road" needs to know about the closed 3km, and a
 * mean would bury it under 40km of free flow. The 5% floor stops a rounding
 * artefact on a very short section from reporting the whole corridor as closed.
 */
export function overallCondition(sections) {
  const dist = trafficDistribution(sections);
  if (!dist.length) return 'unknown';
  const meaningful = dist.filter((d) => d.percent >= 5);
  const ranked = (meaningful.length ? meaningful : dist)
    .filter((d) => d.condition !== 'unknown')
    .sort((a, b) => TRAFFIC_CONDITIONS.indexOf(a.condition) - TRAFFIC_CONDITIONS.indexOf(b.condition));
  return ranked.length ? ranked[0].condition : 'unknown';
}
