/**
 * Import the road's real centreline.
 *
 * ---------------------------------------------------------------------------
 * THE PROBLEM THIS SOLVES
 * ---------------------------------------------------------------------------
 * DBEDC's survey workbook gives eight road-network waypoints across 47.6 km.
 * Drawn as an alignment they are eight straight legs — a schematic, not a road,
 * and it looks like one. The chainages in that workbook were measured along the
 * routed centreline, so the waypoints are a sample of a curve we were not given
 * the rest of, and no amount of curve fitting recovers it: a spline through
 * sparse points asserts bends the survey never recorded, on an operator's own
 * map of its own road.
 *
 * So the shape has to come from somewhere that actually has it.
 *
 * ---------------------------------------------------------------------------
 * TWO SOURCES
 * ---------------------------------------------------------------------------
 *   --osm            Query OpenStreetMap's Overpass API for the highway ways
 *                    that carry the corridor, stitch them into one line, clip
 *                    it to the surveyed terminals and store it.
 *
 *   --file <path>    Read a GeoJSON (LineString / MultiLineString / Feature /
 *                    FeatureCollection) or GPX track. Use this when DBEDC or
 *                    the design consultant supplies the alignment directly,
 *                    which is the better source: it is the as-built line rather
 *                    than a community map of it.
 *
 * LICENCE. OpenStreetMap data is ODbL. It may be used here and the credit must
 * be displayed, so the attribution is written into corridor_geometry_source in
 * the same transaction as the points and rendered on the map from that row. An
 * import cannot silently drop it.
 *
 * NETWORK. --osm needs outbound HTTPS to an Overpass endpoint. Run it wherever
 * that exists; the corridor is a few hundred points and the result goes into
 * the database, not into the build.
 *
 * Usage:
 *   node scripts/import-corridor-geometry.mjs --osm
 *   node scripts/import-corridor-geometry.mjs --file alignment.geojson --attribution "DBEDC survey, 2026"
 *   node scripts/import-corridor-geometry.mjs --osm --dry-run
 */
import fs from 'node:fs/promises';
import mysql from 'mysql2/promise';
import { loadEnv } from './load-env.mjs';
import { haversineMetres } from '../lib/corridor/map.js';

loadEnv();

const argv = process.argv.slice(2);
const has = (f) => argv.includes(f);
const val = (f, d = null) => {
  const i = argv.indexOf(f);
  return i >= 0 && argv[i + 1] ? argv[i + 1] : d;
};

const DRY = has('--dry-run');
const FILE = val('--file');
const USE_OSM = has('--osm') || !FILE;
const ENDPOINT = val('--endpoint', 'https://overpass-api.de/api/interpreter');
// Simplification tolerance in metres. 5 m keeps every real bend on a 47 km
// motorway and drops the sub-lane jitter that triples the point count for
// nothing a reader can see at any zoom this map offers.
const TOLERANCE = Number(val('--tolerance', '5'));

const DB_NAME = val('--database', process.env.DB_NAME || 'dhakabypass');

/* -------------------------------------------------------------------------- */
/* Sources                                                                     */
/* -------------------------------------------------------------------------- */

/**
 * The Overpass query.
 *
 * Selected by name AND by reference, because the corridor is tagged both ways
 * along its length and either alone misses segments. Bounded to the corridor's
 * own envelope with a margin, so a road of the same name elsewhere in
 * Bangladesh cannot be stitched into the line.
 */
function overpassQuery(bbox) {
  const { south, west, north, east } = bbox;
  const area = `(${south},${west},${north},${east})`;
  return `[out:json][timeout:120];
(
  way["highway"]["ref"~"N105"]${area};
  way["highway"]["name"~"Dhaka Bypass",i]${area};
);
out geom;`;
}

async function fromOverpass(bbox) {
  const body = new URLSearchParams({ data: overpassQuery(bbox) });
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    body,
    headers: { 'User-Agent': 'dhakabypass.com corridor import (one-off)' },
  });
  if (!res.ok) throw new Error(`Overpass answered ${res.status} ${res.statusText}`);
  const json = await res.json();
  const ways = (json.elements || [])
    .filter((e) => e.type === 'way' && Array.isArray(e.geometry) && e.geometry.length > 1)
    .map((e) => e.geometry.map((g) => ({ lat: Number(g.lat), lng: Number(g.lon) })));
  if (!ways.length) throw new Error('Overpass returned no matching ways.');
  return {
    lines: ways,
    source: 'osm',
    attribution: '© OpenStreetMap contributors',
  };
}

async function fromFile(path) {
  const text = await fs.readFile(path, 'utf8');
  const lines = path.toLowerCase().endsWith('.gpx') ? parseGpx(text) : parseGeoJson(text);
  if (!lines.length) throw new Error(`No line geometry found in ${path}.`);
  return {
    lines,
    source: 'file',
    attribution: val('--attribution', ''),
  };
}

function parseGeoJson(text) {
  const json = JSON.parse(text);
  const out = [];
  const walk = (node) => {
    if (!node || typeof node !== 'object') return;
    if (node.type === 'FeatureCollection') (node.features || []).forEach(walk);
    else if (node.type === 'Feature') walk(node.geometry);
    else if (node.type === 'LineString') out.push(toPoints(node.coordinates));
    else if (node.type === 'MultiLineString') (node.coordinates || []).forEach((c) => out.push(toPoints(c)));
    else if (node.type === 'GeometryCollection') (node.geometries || []).forEach(walk);
  };
  // GeoJSON is [lng, lat]. Getting this backwards puts the corridor in the
  // Indian Ocean, which at least fails loudly.
  const toPoints = (coords) => (coords || [])
    .filter((c) => Array.isArray(c) && c.length >= 2)
    .map((c) => ({ lat: Number(c[1]), lng: Number(c[0]) }));
  walk(json);
  return out.filter((l) => l.length > 1);
}

function parseGpx(text) {
  const out = [];
  for (const seg of text.split(/<trkseg[^>]*>/i).slice(1)) {
    const pts = [];
    const re = /<trkpt[^>]*\blat="([-\d.]+)"[^>]*\blon="([-\d.]+)"/gi;
    let m = re.exec(seg);
    while (m) {
      pts.push({ lat: Number(m[1]), lng: Number(m[2]) });
      m = re.exec(seg);
    }
    if (pts.length > 1) out.push(pts);
  }
  return out;
}

/* -------------------------------------------------------------------------- */
/* Stitching, clipping, simplifying                                            */
/* -------------------------------------------------------------------------- */

/**
 * Join a bag of way fragments into one line.
 *
 * Overpass returns the corridor as many ways in arbitrary order and arbitrary
 * direction — a dual carriageway is two ways, a bridge is its own way, and a
 * junction splits one road into three. Greedy nearest-endpoint stitching from
 * the fragment closest to the corridor start reassembles them in road order.
 *
 * A fragment whose nearest endpoint is further than `maxGapM` is dropped rather
 * than bridged: a leap across open country is a different road that happened to
 * match the query, and drawing the leap would put a straight 4 km line through
 * a field.
 */
export function stitch(lines, start, maxGapM = 400) {
  const pool = lines.map((l) => l.slice());
  if (!pool.length) return [];

  const endpoints = (l) => [l[0], l[l.length - 1]];
  let best = 0;
  let bestD = Infinity;
  pool.forEach((l, i) => {
    for (const e of endpoints(l)) {
      const d = haversineMetres(start, e);
      if (d < bestD) { bestD = d; best = i; }
    }
  });

  let line = pool.splice(best, 1)[0];
  if (haversineMetres(start, line[line.length - 1]) < haversineMetres(start, line[0])) line.reverse();

  let joined = true;
  while (joined && pool.length) {
    joined = false;
    const tail = line[line.length - 1];
    let pick = -1;
    let pickD = Infinity;
    let pickRev = false;
    pool.forEach((l, i) => {
      const [a, b] = endpoints(l);
      const da = haversineMetres(tail, a);
      const db = haversineMetres(tail, b);
      if (da < pickD) { pickD = da; pick = i; pickRev = false; }
      if (db < pickD) { pickD = db; pick = i; pickRev = true; }
    });
    if (pick >= 0 && pickD <= maxGapM) {
      const next = pool.splice(pick, 1)[0];
      if (pickRev) next.reverse();
      // Drop the duplicated joint so the line has no zero-length segment.
      line = line.concat(pickD < 1 ? next.slice(1) : next);
      joined = true;
    }
  }
  return line;
}

/** The index of the point on `line` nearest to `p`. */
export function nearestIndex(line, p) {
  let best = 0;
  let bestD = Infinity;
  line.forEach((q, i) => {
    const d = haversineMetres(p, q);
    if (d < bestD) { bestD = d; best = i; }
  });
  return { index: best, metres: bestD };
}

/**
 * Cut the line down to the corridor.
 *
 * The query returns the whole named road, which runs past both ends of the
 * concession. The surveyed terminals are the concession, so the line is clipped
 * to the points nearest them — otherwise the map would show DBEDC operating
 * kilometres it does not operate.
 */
export function clipToTerminals(line, start, end) {
  const a = nearestIndex(line, start);
  const b = nearestIndex(line, end);
  const [lo, hi] = a.index <= b.index ? [a.index, b.index] : [b.index, a.index];
  const cut = line.slice(lo, hi + 1);
  if (a.index > b.index) cut.reverse();
  return { line: cut, startOffM: a.metres, endOffM: b.metres };
}

/** Ramer-Douglas-Peucker, with distances in metres. */
export function simplify(line, toleranceM) {
  if (line.length < 3 || !(toleranceM > 0)) return line;
  const keep = new Array(line.length).fill(false);
  keep[0] = true;
  keep[line.length - 1] = true;

  const perpendicular = (p, a, b) => {
    // Local flat-earth approximation: over the few hundred metres between
    // candidate points the curvature is far below the tolerance.
    const kx = 111320 * Math.cos((a.lat * Math.PI) / 180);
    const ky = 110540;
    const ax = a.lng * kx; const ay = a.lat * ky;
    const bx = b.lng * kx; const by = b.lat * ky;
    const px = p.lng * kx; const py = p.lat * ky;
    const dx = bx - ax; const dy = by - ay;
    const len2 = dx * dx + dy * dy;
    if (!len2) return Math.hypot(px - ax, py - ay);
    let t = ((px - ax) * dx + (py - ay) * dy) / len2;
    t = Math.max(0, Math.min(1, t));
    return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
  };

  const stack = [[0, line.length - 1]];
  while (stack.length) {
    const [lo, hi] = stack.pop();
    let far = -1;
    let farD = toleranceM;
    for (let i = lo + 1; i < hi; i += 1) {
      const d = perpendicular(line[i], line[lo], line[hi]);
      if (d > farD) { farD = d; far = i; }
    }
    if (far > 0) {
      keep[far] = true;
      stack.push([lo, far], [far, hi]);
    }
  }
  return line.filter((_, i) => keep[i]);
}

/** Cumulative distance along the line, in metres. */
export function chainages(line) {
  let total = 0;
  return line.map((p, i) => {
    if (i > 0) total += haversineMetres(line[i - 1], p);
    return { ...p, chainage_m: Math.round(total) };
  });
}

/* -------------------------------------------------------------------------- */
/* Run                                                                         */
/* -------------------------------------------------------------------------- */

const db = await mysql.createConnection({
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: DB_NAME,
});

const [wp] = await db.query(
  'SELECT code, lat, lng, chainage_m FROM corridor_waypoints ORDER BY chainage_m',
);
if (wp.length < 2) {
  console.error('corridor_waypoints is empty. Run: node scripts/seed-corridor-geometry.mjs');
  await db.end();
  process.exit(1);
}
const start = { lat: Number(wp[0].lat), lng: Number(wp[0].lng) };
const end = { lat: Number(wp[wp.length - 1].lat), lng: Number(wp[wp.length - 1].lng) };
const lats = wp.map((w) => Number(w.lat));
const lngs = wp.map((w) => Number(w.lng));
// A 0.05 degree margin — about 5 km — so a terminal slip road just outside the
// waypoint envelope is still returned and can be clipped off afterwards.
const bbox = {
  south: Math.min(...lats) - 0.05, north: Math.max(...lats) + 0.05,
  west: Math.min(...lngs) - 0.05, east: Math.max(...lngs) + 0.05,
};

console.log(USE_OSM ? `Querying ${ENDPOINT}` : `Reading ${FILE}`);
let fetched;
try {
  fetched = USE_OSM ? await fromOverpass(bbox) : await fromFile(FILE);
} catch (err) {
  console.error(`\nCould not read the geometry: ${err.message}`);
  console.error(
    '\nIf this host has no outbound network, run the import somewhere that does,\n'
    + 'or export the alignment as GeoJSON and use --file.\n'
    + 'The map keeps working meanwhile: it falls back to the surveyed waypoints\n'
    + 'and labels itself a schematic.',
  );
  await db.end();
  process.exit(1);
}

const stitched = stitch(fetched.lines, start);
const clipped = clipToTerminals(stitched, start, end);
const simplified = simplify(clipped.line, TOLERANCE);
const points = chainages(simplified);
const lengthM = points.length ? points[points.length - 1].chainage_m : 0;
const surveyed = Number(wp[wp.length - 1].chainage_m) || 0;

console.log(`  fragments      ${fetched.lines.length}`);
console.log(`  stitched       ${stitched.length} points`);
console.log(`  clipped        ${clipped.line.length} points `
  + `(terminals off by ${Math.round(clipped.startOffM)} m / ${Math.round(clipped.endOffM)} m)`);
console.log(`  simplified     ${points.length} points at ${TOLERANCE} m`);
console.log(`  length         ${(lengthM / 1000).toFixed(3)} km `
  + `(surveyed ${(surveyed / 1000).toFixed(3)} km)`);

/**
 * The check that decides whether this is the road.
 *
 * A stitched line can be plausible and still wrong — a parallel service road,
 * a fragment of the old highway, one carriageway of a dual pair. Two tests
 * catch every one of those: the length must be within 5% of the surveyed
 * chainage, and every surveyed waypoint must lie within 250 m of the line. A
 * geometry that fails is refused rather than stored, because a wrong centreline
 * is far worse than the honest polyline it would replace.
 */
const problems = [];
if (surveyed && Math.abs(lengthM - surveyed) / surveyed > 0.05) {
  problems.push(
    `length differs from the surveyed chainage by `
    + `${((Math.abs(lengthM - surveyed) / surveyed) * 100).toFixed(1)}% (limit 5%)`,
  );
}
for (const w of wp) {
  const near = nearestIndex(points, { lat: Number(w.lat), lng: Number(w.lng) });
  if (near.metres > 250) {
    problems.push(`waypoint ${w.code} is ${Math.round(near.metres)} m from the line (limit 250 m)`);
  }
}

if (problems.length) {
  console.error('\nRefusing to store this geometry:');
  for (const p of problems) console.error(`  x ${p}`);
  console.error('\nThe corridor keeps its current alignment. Check the source, or supply\n'
    + 'the alignment directly with --file.');
  await db.end();
  process.exit(1);
}

if (DRY) {
  console.log('\n--dry-run: nothing written.');
  await db.end();
  process.exit(0);
}

await db.beginTransaction();
try {
  await db.query('DELETE FROM corridor_geometry');
  const rows = points.map((p, i) => [i, p.lat, p.lng, p.chainage_m]);
  // One multi-row insert: a few hundred points, and a partial line is not a
  // line, so it is this transaction or nothing.
  await db.query('INSERT INTO corridor_geometry (seq, lat, lng, chainage_m) VALUES ?', [rows]);
  await db.query(
    `INSERT INTO corridor_geometry_source (id, source, attribution, points, length_m)
     VALUES (1, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE source=VALUES(source), attribution=VALUES(attribution),
       points=VALUES(points), length_m=VALUES(length_m), imported_at=CURRENT_TIMESTAMP`,
    [fetched.source, fetched.attribution, points.length, lengthM],
  );
  await db.commit();
} catch (err) {
  await db.rollback();
  throw err;
}

console.log(`\nStored ${points.length} points. Source: ${fetched.source}`
  + `${fetched.attribution ? ` (${fetched.attribution})` : ''}`);
console.log('The map will draw the real centreline on the next revalidation.');
await db.end();
