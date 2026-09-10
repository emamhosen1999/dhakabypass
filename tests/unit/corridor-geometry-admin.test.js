// tests/unit/corridor-geometry-admin.test.js
//
// `corridor_geometry` is the road's real centreline — 166 points today — and
// the corridor map draws it, splits it at every waypoint to colour the
// sections, and measures its scale bar from it. It had rows but no screen.
//
// A per-row editor for 166 coordinates would be unusable AND unsafe, so the
// screen replaces the whole alignment at once. That makes ACCEPTANCE the whole
// design: this file pins the same two tests scripts/import-corridor-geometry.mjs
// already refuses an import on — the length must be within 5% of the reference
// chainage, and every surveyed waypoint must lie within 250 m of the line —
// plus a maximum jump between consecutive points, so a missing stretch cannot
// be drawn as a straight line across the countryside.

import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../lib/db.js', () => ({ query: vi.fn(), withTransaction: vi.fn() }));

import { withTransaction } from '../../lib/db.js';
import {
  parseCoordinates, checkAlignment, parseAlignment, replaceGeometry, clearGeometry,
  MAX_POINTS, MAX_WAYPOINT_OFFSET_M, MAX_LENGTH_DRIFT, MAX_GAP_M, GEOMETRY_SOURCES,
} from '../../lib/corridor/geometry-admin.js';

const form = (values) => new Map(Object.entries(values));

// A metric kilometre due north on the meridian: 1 degree of latitude is
// 111 195 m at R = 6 371 008.8 m, the radius lib/corridor/map.js uses.
const KM_IN_DEG = 1000 / 111195;
const START = { lat: 23, lng: 90 };
const at = (metres) => ({ lat: 23 + (metres / 1000) * KM_IN_DEG, lng: 90 });

const WAYPOINTS = [
  { code: 'S', lat: '23.0000000', lng: '90.0000000', chainage_m: 0 },
  { code: '2', lat: at(500).lat.toFixed(7), lng: '90.0000000', chainage_m: 500 },
  { code: 'E', lat: at(1000).lat.toFixed(7), lng: '90.0000000', chainage_m: 1000 },
];

const straight = (n = 11) => Array.from({ length: n }, (_, i) => at((i / (n - 1)) * 1000));
const text = (points) => points.map((p) => `${p.lat}, ${p.lng}`).join('\n');

beforeEach(() => vi.clearAllMocks());

describe('parseCoordinates', () => {
  it('reads "lat, lng" lines, ignoring blanks, comments and a third column', () => {
    expect(parseCoordinates(`
      # the alignment, north to south
      23.9867818, 90.3623354
      23.9855871 90.3640536

      23.9846713,90.3651924,373
    `)).toEqual([
      { lat: 23.9867818, lng: 90.3623354 },
      { lat: 23.9855871, lng: 90.3640536 },
      { lat: 23.9846713, lng: 90.3651924 },
    ]);
  });

  it('needs at least two points to be a line', () => {
    expect(() => parseCoordinates('23.98, 90.36')).toThrow(/two/i);
    expect(() => parseCoordinates('')).toThrow(/two/i);
  });

  it(`refuses more than ${MAX_POINTS} points`, () => {
    const many = Array.from({ length: MAX_POINTS + 1 }, (_, i) => `23.${i}, 90.1`).join('\n');
    expect(() => parseCoordinates(many)).toThrow(new RegExp(String(MAX_POINTS)));
  });

  it('names the offending line number rather than failing anonymously', () => {
    expect(() => parseCoordinates('23.9, 90.3\nnorth a bit\n23.8, 90.4')).toThrow(/line 2/i);
  });

  it('catches a GeoJSON pair pasted in lng, lat order', () => {
    // The likeliest paste mistake there is. 90.36 is not a latitude anywhere.
    expect(() => parseCoordinates('90.3623354, 23.9867818\n90.3640536, 23.9855871'))
      .toThrow(/latitude/i);
  });

  it.each(['23.9, 190.4', '23.9, -180.5'])('rejects the longitude in %j', (line) => {
    expect(() => parseCoordinates(`${line}\n23.8, 90.4`)).toThrow(/longitude/i);
  });
});

describe('checkAlignment — the two tests that decide whether this is the road', () => {
  it('accepts a line that follows the waypoints and measures it', () => {
    const result = checkAlignment(straight(), WAYPOINTS);
    expect(result.problems).toEqual([]);
    expect(result.lengthM).toBeGreaterThan(995);
    expect(result.lengthM).toBeLessThan(1005);
    expect(result.referenceM).toBe(1000);
    expect(result.points).toHaveLength(11);
    expect(result.points[0].chainage_m).toBe(0);
    expect(result.points.at(-1).chainage_m).toBe(result.lengthM);
  });

  it(`refuses a length more than ${MAX_LENGTH_DRIFT * 100}% off the reference chainage`, () => {
    const doubled = [at(0), at(500), at(1000), at(1500), at(2000)];
    const result = checkAlignment(doubled, WAYPOINTS);
    expect(result.driftPct).toBeGreaterThan(MAX_LENGTH_DRIFT * 100);
    expect(result.problems.join(' ')).toMatch(/length/i);
  });

  it(`refuses a line that leaves a waypoint more than ${MAX_WAYPOINT_OFFSET_M} m away`, () => {
    // Same start and end, but bowed a kilometre east through the middle: the
    // shape of a parallel service road, which passes a length check and is
    // still not the corridor.
    const bowed = [at(0), { ...at(500), lng: 90.01 }, at(1000)];
    const result = checkAlignment(bowed, WAYPOINTS);
    const two = result.offsets.find((o) => o.code === '2');
    expect(two.metres).toBeGreaterThan(MAX_WAYPOINT_OFFSET_M);
    expect(result.problems.join(' ')).toMatch(/waypoint 2/i);
  });

  it(`refuses a jump of more than ${MAX_GAP_M} m between consecutive points`, () => {
    const gapped = [at(0), at(1000), at(10000)];
    expect(checkAlignment(gapped, WAYPOINTS).problems.join(' ')).toMatch(/gap|apart/i);
  });

  it('still measures the line when there are no waypoints to check against', () => {
    // Never throws: the screen has to be able to SHOW an operator why an
    // alignment is being refused, which means the checker must always return.
    const result = checkAlignment(straight(), []);
    expect(result.referenceM).toBe(0);
    expect(result.offsets).toEqual([]);
    expect(result.problems).toEqual([]);
  });
});

describe('parseAlignment', () => {
  const good = () => form({
    coordinates: text(straight()),
    source: 'survey',
    attribution: 'DBEDC survey, 2026',
    confirm: 'on',
  });

  it('returns the measured points ready to store', () => {
    const parsed = parseAlignment(good(), WAYPOINTS);
    expect(parsed.source).toBe('survey');
    expect(parsed.attribution).toBe('DBEDC survey, 2026');
    expect(parsed.points).toHaveLength(11);
    expect(parsed.lengthM).toBe(parsed.points.at(-1).chainage_m);
  });

  it('will not replace the alignment without the confirmation ticked', () => {
    const f = good();
    f.delete('confirm');
    expect(() => parseAlignment(f, WAYPOINTS)).toThrow(/confirm/i);
  });

  it('reports every acceptance failure at once, and says the map is unchanged', () => {
    const f = good();
    f.set('coordinates', text([at(0), { ...at(500), lng: 90.01 }, at(4000)]));
    let message = '';
    try { parseAlignment(f, WAYPOINTS); } catch (err) { message = err.message; }
    expect(message).toMatch(/keeps its current alignment/i);
    expect(message).toMatch(/length/i);
    expect(message).toMatch(/waypoint 2/i);
  });

  it.each(['', 'whatever'])('rejects the source %j', (source) => {
    const f = good();
    f.set('source', source);
    expect(() => parseAlignment(f, WAYPOINTS)).toThrow(/source/i);
  });

  it('requires the attribution OpenStreetMap data must legally carry', () => {
    const f = good();
    f.set('source', 'osm');
    f.set('attribution', '');
    expect(() => parseAlignment(f, WAYPOINTS)).toThrow(/attribution/i);
    expect(GEOMETRY_SOURCES).toContain('osm');
  });
});

describe('replaceGeometry', () => {
  const points = [
    { lat: 23, lng: 90, chainage_m: 0 },
    { lat: 23.01, lng: 90, chainage_m: 1112 },
  ];

  it('clears and rewrites the whole line in one transaction, then records the source', async () => {
    const q = vi.fn().mockResolvedValue({ affectedRows: 1 });
    withTransaction.mockImplementation((fn) => fn(q));

    await replaceGeometry({ points, source: 'survey', attribution: 'DBEDC', lengthM: 1112 });

    const sql = q.mock.calls.map((c) => c[0]);
    expect(sql[0]).toMatch(/DELETE FROM corridor_geometry\b/);
    expect(sql.some((s) => /INSERT INTO corridor_geometry\b/.test(s))).toBe(true);
    expect(sql.at(-1)).toMatch(/corridor_geometry_source/);
    // A partial line is not a line: it is one transaction or nothing.
    expect(withTransaction).toHaveBeenCalledTimes(1);
  });

  it('numbers the points from seq 0 in the order given', async () => {
    const q = vi.fn().mockResolvedValue({ affectedRows: 1 });
    withTransaction.mockImplementation((fn) => fn(q));
    await replaceGeometry({ points, source: 'survey', attribution: '', lengthM: 1112 });
    const insert = q.mock.calls.find((c) => /INSERT INTO corridor_geometry\b/.test(c[0]));
    expect(insert[1].slice(0, 8)).toEqual([0, 23, 90, 0, 1, 23.01, 90, 1112]);
  });

  it('refuses to store fewer than two points', async () => {
    await expect(replaceGeometry({ points: [points[0]], source: 'survey', attribution: '', lengthM: 0 }))
      .rejects.toThrow(/two/i);
    expect(withTransaction).not.toHaveBeenCalled();
  });
});

describe('clearGeometry', () => {
  it('empties the table and returns the source to the waypoint polyline', async () => {
    const q = vi.fn().mockResolvedValue({ affectedRows: 166 });
    withTransaction.mockImplementation((fn) => fn(q));
    await clearGeometry();
    expect(q.mock.calls[0][0]).toMatch(/DELETE FROM corridor_geometry\b/);
    // The map's documented fallback: it draws the surveyed waypoints and
    // labels itself a schematic, rather than pretending to a centreline.
    expect(q.mock.calls.at(-1)[1]).toContain('waypoints');
  });
});
