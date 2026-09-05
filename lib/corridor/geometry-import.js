import { haversineMetres } from './map.js';

/** Nearest point on a segment, in a local metric projection. */
export function segmentPoint(p, a, b) {
  const kx = 111320 * Math.cos(a.lat * Math.PI / 180);
  const ky = 110540;
  const dx = (b.lng - a.lng) * kx; const dy = (b.lat - a.lat) * ky;
  const length2 = dx * dx + dy * dy;
  const t = length2 ? Math.max(0, Math.min(1,
    ((p.lng - a.lng) * kx * dx + (p.lat - a.lat) * ky * dy) / length2)) : 0;
  const point = { lat: a.lat + t * (b.lat - a.lat), lng: a.lng + t * (b.lng - a.lng) };
  return { point, t, metres: haversineMetres(p, point) };
}

export function nearestIndex(line, p) {
  let best = { index: 0, metres: Infinity };
  line.forEach((q, index) => {
    const metres = haversineMetres(p, q);
    if (metres < best.metres) best = { index, metres };
  });
  return best;
}

export function nearestOnLine(line, p) {
  let best = { index: 0, t: 0, metres: Infinity, point: null };
  for (let i = 0; i < line.length - 1; i += 1) {
    const candidate = segmentPoint(p, line[i], line[i + 1]);
    if (candidate.metres < best.metres) best = { ...candidate, index: i };
  }
  return best;
}

/** Shortest continuous route through a road graph. Shared coordinates join
 * fragments at interior junctions as well as endpoints. A dead-end or parallel
 * carriageway cannot trap a greedy walk. Small endpoint gaps are explicit and
 * bounded; missing stretches are never bridged across hundreds of metres. */
export function stitch(lines, start, end, maxGapM = 20) {
  if (!lines.length || !end) return [];
  const points = []; const ids = new Map(); const edges = []; const ends = new Set();
  const idOf = (p) => {
    const key = `${Number(p.lat).toFixed(7)},${Number(p.lng).toFixed(7)}`;
    if (!ids.has(key)) { ids.set(key, points.length); points.push(p); edges.push(new Map()); }
    return ids.get(key);
  };
  const connect = (a, b) => {
    if (a === b) return;
    const d = haversineMetres(points[a], points[b]);
    edges[a].set(b, d); edges[b].set(a, d);
  };
  for (const line of lines) {
    const row = line.map(idOf);
    if (row.length < 2) continue;
    ends.add(row[0]); ends.add(row.at(-1));
    for (let i = 1; i < row.length; i += 1) connect(row[i - 1], row[i]);
  }
  for (const a of ends) {
    for (let b = 0; b < points.length; b += 1) {
      if (a !== b && haversineMetres(points[a], points[b]) <= maxGapM) connect(a, b);
    }
  }
  const source = nearestIndex(points, start).index;
  const target = nearestIndex(points, end).index;
  const distances = new Array(points.length).fill(Infinity);
  const previous = new Array(points.length).fill(-1); const visited = new Set();
  distances[source] = 0;
  while (visited.size < points.length) {
    let current = -1; let min = Infinity;
    for (let i = 0; i < points.length; i += 1) {
      if (!visited.has(i) && distances[i] < min) { current = i; min = distances[i]; }
    }
    if (current < 0 || current === target) break;
    visited.add(current);
    for (const [next, distance] of edges[current]) {
      if (distances[current] + distance < distances[next]) {
        distances[next] = distances[current] + distance; previous[next] = current;
      }
    }
  }
  if (!Number.isFinite(distances[target])) return [];
  const route = [];
  for (let at = target; at >= 0; at = previous[at]) route.push(points[at]);
  return route.reverse();
}

export function clipToTerminals(line, start, end) {
  if (line.length < 2) return { line: [], startOffM: Infinity, endOffM: Infinity };
  const a = nearestOnLine(line, start); const b = nearestOnLine(line, end);
  if (a.index + a.t > b.index + b.t) return clipToTerminals(line.slice().reverse(), start, end);
  return {
    line: [a.point, ...line.slice(a.index + 1, b.index + 1), b.point]
      .filter((p, i, all) => !i || haversineMetres(all[i - 1], p) > 0.01),
    startOffM: a.metres, endOffM: b.metres,
  };
}

/** Ramer-Douglas-Peucker in metres, with an iterative stack. */
export function simplify(line, toleranceM) {
  if (line.length < 3 || !(toleranceM > 0)) return line;
  const keep = new Set([0, line.length - 1]); const stack = [[0, line.length - 1]];
  while (stack.length) {
    const [lo, hi] = stack.pop(); let far = -1; let farD = toleranceM;
    for (let i = lo + 1; i < hi; i += 1) {
      const d = segmentPoint(line[i], line[lo], line[hi]).metres;
      if (d > farD) { far = i; farD = d; }
    }
    if (far > 0) { keep.add(far); stack.push([lo, far], [far, hi]); }
  }
  return line.filter((_, i) => keep.has(i));
}

export function chainages(line) {
  let length = 0;
  return line.map((p, i) => {
    if (i) length += haversineMetres(line[i - 1], p);
    return { ...p, chainage_m: Math.round(length) };
  });
}

/** Clip a measured distance along a polyline; used for approach highlights. */
export function clipChainage(line, from, to) {
  const measured = chainages(line); const result = [];
  for (let i = 1; i < measured.length; i += 1) {
    const a = measured[i - 1]; const b = measured[i];
    if (b.chainage_m < from || a.chainage_m > to) continue;
    const distance = b.chainage_m - a.chainage_m;
    for (const value of [Math.max(from, a.chainage_m), Math.min(to, b.chainage_m)]) {
      const t = distance ? (value - a.chainage_m) / distance : 0;
      const p = { lat: a.lat + (b.lat - a.lat) * t, lng: a.lng + (b.lng - a.lng) * t };
      if (!result.length || haversineMetres(result.at(-1), p) > 0.01) result.push(p);
    }
  }
  return result;
}
