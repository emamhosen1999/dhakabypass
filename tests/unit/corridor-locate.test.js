import { describe, it, expect } from 'vitest';
import {
  parseMarker, latinDigits, readLocateQuery, projectPoint, locate, corridorLengthM, MAX_OFFSET_M,
} from '../../lib/corridor/locate.js';

// A straight north-south line, 10 km long, chainage every kilometre.
const GEOMETRY = Array.from({ length: 11 }, (_, i) => ({
  seq: i, lat: 24 - i * 0.009, lng: 90.4, chainage_m: i * 1000,
}));

const FEATURES = [
  { id: 1, chainage_m: 0, kind: 'interchange', status: 'open', names: { en: 'Start IC' } },
  { id: 2, chainage_m: 3200, kind: 'toll_plaza', status: 'open', names: { en: 'Plaza A' } },
  { id: 3, chainage_m: 4500, kind: 'bridge', status: 'open', names: { en: 'River bridge' } },
  { id: 4, chainage_m: 7000, kind: 'pedestrian_overpass', status: 'open', names: { en: 'Footbridge' } },
  { id: 5, chainage_m: 8500, kind: 'toll_plaza', status: 'construction', names: { en: 'Plaza B' } },
  { id: 6, chainage_m: 10000, kind: 'interchange', status: 'construction', names: { en: 'End IC' } },
];

const SEGMENTS = [
  { from_m: 0, to_m: 6000, status: 'open' },
  { from_m: 6000, to_m: 10000, status: 'construction' },
];

describe('parseMarker', () => {
  it('reads the forms printed on the posts', () => {
    expect(parseMarker('K12')).toBe(12000);
    expect(parseMarker('k12+300')).toBe(12300);
    expect(parseMarker('12+300')).toBe(12300);
    expect(parseMarker(' K 3 + 050 ')).toBe(3050);
  });
  it('treats a bare number as kilometres, with a decimal as tenths', () => {
    expect(parseMarker('12')).toBe(12000);
    expect(parseMarker('12.3')).toBe(12300);
    expect(parseMarker('12,3')).toBe(12300);
    expect(parseMarker('12 km')).toBe(12000);
  });
  it('accepts Bengali digits, which a Bangla keyboard types', () => {
    expect(latinDigits('১২')).toBe('12');
    expect(parseMarker('K১২+৩০০')).toBe(12300);
  });
  it('refuses anything that is not a marker', () => {
    for (const bad of ['', '   ', 'abc', 'K', '+300', '12+3000', '1e3', null, 12]) {
      expect(parseMarker(bad), String(bad)).toBeNull();
    }
  });
});

describe('readLocateQuery', () => {
  it('distinguishes not asked from asked badly', () => {
    expect(readLocateQuery({}).chosen).toBe(false);
    expect(readLocateQuery({ km: '' }).chosen).toBe(true);
  });
  it('only accepts a coordinate pair that is plausible', () => {
    expect(readLocateQuery({ lat: '23.9', lng: '90.4' }).point).toEqual({ lat: 23.9, lng: 90.4 });
    expect(readLocateQuery({ lat: '23.9' }).point).toBeNull();
    expect(readLocateQuery({ lat: '123.9', lng: '90.4' }).point).toBeNull();
    expect(readLocateQuery({ lat: ['23.9'], lng: ['90.4'] }).point).toEqual({ lat: 23.9, lng: 90.4 });
    expect(readLocateQuery({ lat: 'abc', lng: '90.4' }).point).toBeNull();
  });
});

describe('projectPoint', () => {
  it('lands a point beside the line on the right chainage', () => {
    const hit = projectPoint({ lat: 24 - 4.5 * 0.009, lng: 90.401 }, GEOMETRY);
    expect(hit.chainageM).toBeGreaterThan(4400);
    expect(hit.chainageM).toBeLessThan(4600);
    expect(hit.offsetM).toBeGreaterThan(50);
    expect(hit.offsetM).toBeLessThan(150);
  });
  it('needs at least two usable points', () => {
    expect(projectPoint({ lat: 24, lng: 90.4 }, [])).toBeNull();
    expect(projectPoint({ lat: 24, lng: 90.4 }, [{ lat: 'x', lng: 90.4, chainage_m: 0 }, GEOMETRY[1]])).toBeNull();
  });
});

describe('locate', () => {
  const run = (query) => locate({ query, geometry: GEOMETRY, interchanges: FEATURES, segments: SEGMENTS });

  it('is idle until something is asked', () => {
    expect(run({}).status).toBe('idle');
    expect(run({}).lengthM).toBe(10000);
  });

  it('answers a marker with the stretch, the plaza and the exits each way', () => {
    const r = run({ km: 'K4+500' });
    expect(r.status).toBe('located');
    expect(r.chainageM).toBe(4500);
    expect(r.segment.status).toBe('open');
    expect(r.nearestPlaza.row.id).toBe(2);
    expect(r.nearestPlaza.distanceM).toBe(1300);
    expect(r.towardsStart.row.id).toBe(2);
    expect(r.towardsEnd.row.id).toBe(5);
    expect(r.towardsEnd.distanceM).toBe(4000);
    // Bridges are landmarks, never exits; the footbridge at 7 km is too far to mention.
    expect(r.structures.map((s) => s.row.id)).toEqual([3]);
  });

  it('never offers a bridge or a footbridge as an exit', () => {
    const r = run({ km: 'K6+900' });
    expect(r.towardsStart.row.id).toBe(2);
    expect(r.towardsEnd.row.id).toBe(5);
  });

  it('says when there is no exit before the corridor ends', () => {
    const r = run({ km: 'K9+900' });
    expect(r.towardsEnd.row.id).toBe(6);
    expect(run({ km: 'K0+000' }).towardsStart).toBeNull();
  });

  it('refuses a marker past the end and an unreadable one', () => {
    expect(run({ km: 'K10+001' }).status).toBe('beyond');
    expect(run({ km: 'K10+000' }).status).toBe('located');
    expect(run({ km: 'nowhere' }).status).toBe('invalid');
  });

  it('projects a position and refuses one far from the road', () => {
    const on = run({ lat: String(24 - 2 * 0.009), lng: '90.4001' });
    expect(on.status).toBe('located');
    expect(on.chainageM).toBe(2000);
    expect(on.offsetM).toBeLessThan(20);
    const off = run({ lat: '24', lng: '90.5' });
    expect(off.status).toBe('off-road');
    expect(off.offsetM).toBeGreaterThan(MAX_OFFSET_M);
  });

  it('cannot place a position without a centreline', () => {
    const r = locate({ query: { lat: '24', lng: '90.4' }, geometry: [], interchanges: FEATURES, segments: SEGMENTS });
    expect(r.status).toBe('no-geometry');
    // A typed marker still works: the interchanges give the length.
    expect(locate({ query: { km: '3' }, geometry: [], interchanges: FEATURES, segments: SEGMENTS }).status).toBe('located');
  });

  it('measures the corridor from the geometry, or the features when there is none', () => {
    expect(corridorLengthM(GEOMETRY, FEATURES)).toBe(10000);
    expect(corridorLengthM([], FEATURES)).toBe(10000);
    expect(corridorLengthM([], [])).toBe(0);
  });

  it('reports no segment status where none covers the chainage', () => {
    const r = locate({ query: { km: '2' }, geometry: GEOMETRY, interchanges: FEATURES, segments: [] });
    expect(r.segment).toBeNull();
  });
});
