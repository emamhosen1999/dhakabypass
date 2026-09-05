/**
 * The corridor map's geometry.
 *
 * A map that is subtly wrong looks exactly like a map that is right, so the
 * things tested here are the ones with no visible symptom: whether the
 * projection is actually Mercator, whether the fit is uniform, whether a
 * section's path really covers that section, and whether the traffic summary
 * weighs by distance rather than by section count.
 */
import { describe, it, expect } from 'vitest';
import {
  projectMercator, haversineMetres, buildCorridorMap, layoutLabels,
  trafficDistribution, overallCondition, TRAFFIC_CONDITIONS,
} from '../../lib/corridor/map.js';
import { gutterFor } from '../../lib/corridor/view.js';

// The real road-network waypoints, abbreviated.
const WAYPOINTS = [
  { code: 'S', lat: 23.986737, lng: 90.362246, chainage_m: 0 },
  { code: '4', lat: 23.930211, lng: 90.452655, chainage_m: 12090 },
  { code: '6', lat: 23.785562, lng: 90.568720, chainage_m: 34973 },
  { code: 'E', lat: 23.690500, lng: 90.546722, chainage_m: 47611 },
];
const SECTIONS = [
  { id: 1, from_code: 'S', to_code: '4', condition_key: 'free', sort_order: 0 },
  { id: 2, from_code: '4', to_code: '6', condition_key: 'heavy', sort_order: 1 },
  { id: 3, from_code: '6', to_code: 'E', condition_key: 'moderate', sort_order: 2 },
];

describe('projectMercator', () => {
  it('is Mercator, not equirectangular', () => {
    // The give-away: equal latitude steps do NOT map to equal y steps.
    const a = projectMercator(0, 0).y;
    const b = projectMercator(30, 0).y;
    const c = projectMercator(60, 0).y;
    expect(Math.abs(b - a)).not.toBeCloseTo(Math.abs(c - b), 3);
  });

  it('puts the equator and prime meridian at the centre of the unit square', () => {
    const p = projectMercator(0, 0);
    expect(p.x).toBeCloseTo(0.5, 9);
    expect(p.y).toBeCloseTo(0.5, 9);
  });

  it('increases y southward, matching screen coordinates', () => {
    expect(projectMercator(24, 90).y).toBeLessThan(projectMercator(23, 90).y);
  });

  it('clamps rather than returning Infinity at the poles', () => {
    for (const lat of [90, -90, 1e9]) {
      expect(Number.isFinite(projectMercator(lat, 0).y)).toBe(true);
    }
  });
});

describe('haversineMetres', () => {
  it('agrees with the survey workbook', () => {
    // Workbook sheet 2: S to waypoint 2 is 2.314 km by road. The straight line
    // is necessarily shorter, but must be the same order and within ~10%.
    const d = haversineMetres({ lat: 23.986737, lng: 90.362246 }, { lat: 23.977568, lng: 90.380874 });
    expect(d).toBeGreaterThan(1900);
    expect(d).toBeLessThan(2400);
  });

  it('is zero for a point against itself', () => {
    expect(haversineMetres({ lat: 23.9, lng: 90.4 }, { lat: 23.9, lng: 90.4 })).toBeCloseTo(0, 6);
  });
});

describe('buildCorridorMap', () => {
  const map = buildCorridorMap({ waypoints: WAYPOINTS, sections: SECTIONS, width: 1000, height: 700 });

  it('builds a path and one entry per section', () => {
    expect(map.ok).toBe(true);
    expect(map.d.startsWith('M')).toBe(true);
    expect(map.sections).toHaveLength(3);
  });

  it('keeps every point inside the padded frame', () => {
    for (const p of [...map.waypoints, ...map.features]) {
      expect(p.x).toBeGreaterThanOrEqual(0);
      expect(p.x).toBeLessThanOrEqual(1000);
      expect(p.y).toBeGreaterThanOrEqual(0);
      expect(p.y).toBeLessThanOrEqual(700);
    }
  });

  it('scales uniformly, so the corridor is not stretched to fill the frame', () => {
    // The give-away for a non-uniform fit: the aspect ratio of the projected
    // bounds would no longer match the aspect ratio of the drawn bounds.
    const ptsX = map.waypoints.map((p) => p.x);
    const ptsY = map.waypoints.map((p) => p.y);
    const drawn = (Math.max(...ptsX) - Math.min(...ptsX)) / (Math.max(...ptsY) - Math.min(...ptsY));
    const pa = projectMercator(map.bounds.maxLat, map.bounds.minLng);
    const pb = projectMercator(map.bounds.minLat, map.bounds.maxLng);
    const real = Math.abs(pb.x - pa.x) / Math.abs(pb.y - pa.y);
    expect(drawn).toBeCloseTo(real, 3);
  });

  it('draws each section only over its own chainage range', () => {
    const s = map.sections.find((x) => x.fromCode === '4');
    expect(s.fromChainage).toBe(12090);
    expect(s.toChainage).toBe(34973);
    expect(s.lengthM).toBe(22883);
  });

  it('makes adjacent sections share their boundary point, leaving no gap', () => {
    // Without the shared vertex the road shows a hairline break at every
    // waypoint — visible, and impossible to explain from the data.
    const [a, b] = map.sections;
    const lastOfA = a.d.trim().split(/[ML]/).filter(Boolean).pop().trim();
    const firstOfB = b.d.trim().split(/[ML]/).filter(Boolean)[0].trim();
    expect(lastOfA).toBe(firstOfB);
  });

  it('threads the alignment through facility coordinates too', () => {
    // Every vertex is surveyed; more of them means a line that reads as a road
    // rather than a zigzag, without inventing any geometry.
    const withFeatures = buildCorridorMap({
      waypoints: WAYPOINTS,
      sections: SECTIONS,
      features: [{ id: 9, lat: 23.9753671, lng: 90.3892799, chainage_m: 3218, kind: 'toll_plaza', name: 'Vogra' }],
    });
    expect(withFeatures.features).toHaveLength(1);
    expect(withFeatures.d.split('L').length).toBeGreaterThan(map.d.split('L').length);
  });

  it('degrades to not-ok rather than throwing when there is no geometry', () => {
    // A dead database must not take the route page down.
    expect(buildCorridorMap({ waypoints: [] }).ok).toBe(false);
    expect(buildCorridorMap({}).ok).toBe(false);
    expect(buildCorridorMap({ waypoints: [WAYPOINTS[0]] }).ok).toBe(false);
  });

  it('ignores a row with no coordinates instead of plotting it at zero', () => {
    const out = buildCorridorMap({
      waypoints: [...WAYPOINTS, { code: 'X', lat: null, lng: null, chainage_m: 5000 }],
      sections: SECTIONS,
    });
    expect(out.waypoints.map((w) => w.code)).not.toContain('X');
  });
});

describe('trafficDistribution', () => {
  const map = buildCorridorMap({ waypoints: WAYPOINTS, sections: SECTIONS });

  it('weighs by distance, not by section count', () => {
    // Three sections, very different lengths. Counting them would report 33%
    // each and tell a driver nothing about their journey.
    const dist = trafficDistribution(map.sections);
    const heavy = dist.find((d) => d.condition === 'heavy');
    const free = dist.find((d) => d.condition === 'free');
    expect(heavy.metres).toBe(22883);
    expect(free.metres).toBe(12090);
    expect(heavy.percent).toBeGreaterThan(free.percent);
  });

  it('sums to about 100%', () => {
    const total = trafficDistribution(map.sections).reduce((n, d) => n + d.percent, 0);
    expect(Math.abs(total - 100)).toBeLessThanOrEqual(2);
  });

  it('returns nothing for no sections rather than dividing by zero', () => {
    expect(trafficDistribution([])).toEqual([]);
    expect(trafficDistribution(null)).toEqual([]);
  });

  it('treats an unrecognised condition as unknown', () => {
    const out = trafficDistribution([{ lengthM: 100, condition: 'banana' }]);
    expect(out[0].condition).toBe('unknown');
  });
});

describe('overallCondition', () => {
  it('reports the worst condition affecting a meaningful share', () => {
    // Not an average: 40km of free flow must not bury a closed 8km.
    const sections = [
      { lengthM: 40000, condition: 'free' },
      { lengthM: 8000, condition: 'closed' },
    ];
    expect(overallCondition(sections)).toBe('closed');
  });

  it('ignores a sliver too small to matter', () => {
    // A 200m rounding artefact must not report the whole corridor as closed.
    const sections = [
      { lengthM: 47000, condition: 'free' },
      { lengthM: 200, condition: 'closed' },
    ];
    expect(overallCondition(sections)).toBe('free');
  });

  it('is unknown when nothing has been measured', () => {
    expect(overallCondition([{ lengthM: 100, condition: 'unknown' }])).toBe('unknown');
    expect(overallCondition([])).toBe('unknown');
  });

  it('ranks conditions worst-first', () => {
    expect(TRAFFIC_CONDITIONS.indexOf('closed')).toBeLessThan(TRAFFIC_CONDITIONS.indexOf('free'));
  });
});

/**
 * The annotation gutters.
 *
 * These exist because the corridor is much taller than it is wide, so fitted
 * into any landscape frame it left two dead grey margins and the map read as a
 * thin line adrift. The gutters turn that space into the facility labels — but
 * a gutter that is reserved and then not honoured by the fit puts labels
 * outside the viewBox, where they are silently clipped and look like they were
 * never drawn.
 */
describe('label gutters', () => {
  const FEATURES = [
    { id: 10, lat: 23.975370, lng: 90.389280, chainage_m: 3218, kind: 'toll_plaza', name: 'Vogra Toll Plaza (RHS)', status: 'open' },
    { id: 11, lat: 23.974370, lng: 90.392030, chainage_m: 3706, kind: 'toll_plaza', name: 'Vogra Toll Plaza (LHS)', status: 'open' },
    { id: 12, lat: 23.917270, lng: 90.468750, chainage_m: 14584, kind: 'bridge', name: 'Nagda Bridge', status: 'open' },
  ];
  const opts = {
    waypoints: WAYPOINTS, sections: SECTIONS, features: FEATURES,
    width: 1020, height: 780, padding: 46, chainageGutter: 62, labelGutter: 250,
  };
  const map = buildCorridorMap(opts);
  const [, , frameW, frameH] = map.viewBox.split(' ').map(Number);

  it('reserves the gutters in the frame, not out of the road', () => {
    const bare = buildCorridorMap({ ...opts, labelGutter: 0, chainageGutter: 0 });
    const roadWidth = (m) => {
      const xs = m.waypoints.map((p) => p.x);
      return Math.max(...xs) - Math.min(...xs);
    };
    // Same scale: the gutters are added around the drawing, and the fit here is
    // limited by height in both cases. If reserving a gutter shrank the road,
    // the labels would have been paid for out of the map.
    expect(roadWidth(map)).toBeCloseTo(roadWidth(bare), 6);
    // Precision 2: the viewBox is rounded to two decimals for the attribute.
    expect(frameW).toBeCloseTo(bare.width + 312, 2);
  });

  it('keeps the road clear of both gutters', () => {
    for (const p of [...map.waypoints, ...map.features]) {
      expect(p.x).toBeGreaterThanOrEqual(62);
      expect(p.x).toBeLessThanOrEqual(frameW - 250);
    }
  });

  it('labels every named facility, inside the frame', () => {
    expect(map.labels).toHaveLength(3);
    for (const l of map.labels) {
      expect(l.labelX).toBeGreaterThan(Math.max(...map.features.map((f) => f.x)));
      expect(l.labelX).toBeLessThan(frameW);
      expect(l.labelY).toBeGreaterThanOrEqual(0);
      expect(l.labelY).toBeLessThanOrEqual(frameH);
    }
  });

  it('does not stack two labels on top of each other', () => {
    // The two Vogra plazas are 488 metres apart on a 47.6km corridor: without
    // the layout pass their labels land within a few units of each other and
    // render as one unreadable smudge.
    const ys = map.labels.map((l) => l.labelY).sort((a, b) => a - b);
    for (let i = 1; i < ys.length; i += 1) expect(ys[i] - ys[i - 1]).toBeGreaterThanOrEqual(25.99);
  });

  it('emits no labels when no gutter was reserved', () => {
    expect(buildCorridorMap({ ...opts, labelGutter: 0 }).labels).toEqual([]);
  });

  it('drops the facilities that duplicate a waypoint', () => {
    // The corridor terminals are rows in BOTH tables. Drawn from both they put
    // a second marker under every numbered pin and a second entry in the label
    // column for a place already named in the panel.
    const dupes = buildCorridorMap({
      ...opts,
      features: [
        ...FEATURES,
        { id: 1, lat: 23.986737, lng: 90.362246, chainage_m: 0, kind: 'interchange', name: 'Naojor (corridor start)' },
        { id: 2, lat: 23.930211, lng: 90.452655, chainage_m: 12090, kind: 'waypoint', name: 'Waypoint 4' },
      ],
    });
    expect(dupes.features.map((f) => f.id).sort()).toEqual([10, 11, 12]);
    expect(dupes.labels.map((f) => f.name)).not.toContain('Naojor (corridor start)');
  });
});

describe('layoutLabels', () => {
  it('pushes a colliding label down, keeping chainage order', () => {
    const out = layoutLabels(
      [{ y: 100 }, { y: 104 }, { y: 108 }],
      { x: 500, top: 0, bottom: 400, gap: 20 },
    );
    expect(out.map((l) => l.labelY)).toEqual([100, 120, 140]);
    expect(out.every((l) => l.labelX === 500)).toBe(true);
  });

  it('pulls the stack back up when it runs past the bottom', () => {
    const out = layoutLabels(
      [{ y: 90 }, { y: 92 }, { y: 94 }],
      { x: 0, top: 0, bottom: 100, gap: 20 },
    );
    const ys = out.map((l) => l.labelY);
    expect(Math.max(...ys)).toBeLessThanOrEqual(100);
    for (let i = 1; i < ys.length; i += 1) expect(ys[i] - ys[i - 1]).toBeGreaterThanOrEqual(20);
  });

  it('never places a label above the top of the frame', () => {
    const out = layoutLabels(
      Array.from({ length: 10 }, () => ({ y: 95 })),
      { x: 0, top: 10, bottom: 100, gap: 20 },
    );
    expect(Math.min(...out.map((l) => l.labelY))).toBeGreaterThanOrEqual(10);
  });

  it('is empty for no input', () => {
    expect(layoutLabels([], { x: 0, top: 0, bottom: 10 })).toEqual([]);
  });
});

describe('gutterFor', () => {
  it('grows with the longest name that will be drawn', () => {
    const short = gutterFor([{ name: 'Ab' }], 15);
    const long = gutterFor([{ name: 'Ab' }, { name: 'Vogra Toll Plaza (RHS)' }], 15);
    expect(long).toBeGreaterThan(short);
  });

  it('allows more room per glyph for Bengali and CJK than for Latin', () => {
    // Eight Latin characters are narrower than eight Chinese ones; a column
    // sized for the first clips the second at the edge of the viewBox, with no
    // error and nothing in the DOM to say the text was cut.
    expect(gutterFor([{ name: '收费站收费站收费站收费站' }], 15))
      .toBeGreaterThan(gutterFor([{ name: 'aaaaaaaaaaaa' }], 15));
  });

  it('clamps, so one absurd name cannot squeeze the road out of the frame', () => {
    expect(gutterFor([{ name: 'x'.repeat(500) }], 15)).toBeLessThanOrEqual(340);
    expect(gutterFor([], 15)).toBeGreaterThanOrEqual(150);
    expect(gutterFor(null, 15)).toBeGreaterThanOrEqual(150);
  });
});
