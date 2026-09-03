// tests/unit/corridor-strip-data.test.js
import { describe, it, expect } from 'vitest';
import { buildStripModel } from '../../lib/corridor/strip.js';

const SEGMENTS = [
  { id: 1, from_m: 0, to_m: 3900, status: 'construction', labels: {} },
  { id: 2, from_m: 3900, to_m: 21900, status: 'open', labels: { en: 'Open section' } },
  { id: 3, from_m: 21900, to_m: 48000, status: 'construction', labels: {} },
];
const INTERCHANGES = [
  { id: 1, chainage_m: 21900, names: { en: 'Purbachal' }, kind: 'interchange', status: 'open', connects_to: '' },
  { id: 2, chainage_m: 0, names: { en: 'Kodda' }, kind: 'interchange', status: 'construction', connects_to: 'N3' },
];

describe('buildStripModel', () => {
  it('positions bands as percentages of the extent', () => {
    const m = buildStripModel({ segments: SEGMENTS, interchanges: [], locale: 'en' });
    expect(m.extent.length_m).toBe(48000);
    expect(m.bands).toHaveLength(3);
    expect(m.bands[0].leftPct).toBe(0);
    expect(m.bands[0].widthPct).toBeCloseTo(8.13, 1);
    expect(m.bands[1].widthPct).toBeCloseTo(37.5, 1);
  });

  it('orders markers by chainage regardless of input order', () => {
    const m = buildStripModel({ segments: SEGMENTS, interchanges: INTERCHANGES, locale: 'en' });
    expect(m.markers.map((x) => x.name)).toEqual(['Kodda', 'Purbachal']);
  });

  it('gives every marker a position and a formatted chainage', () => {
    const m = buildStripModel({ segments: SEGMENTS, interchanges: INTERCHANGES, locale: 'en' });
    expect(m.markers[0]).toMatchObject({ leftPct: 0, chainage: 'K0+000' });
    expect(m.markers[1].chainage).toBe('K21+900');
    expect(m.markers[1].leftPct).toBeCloseTo(45.63, 1);
  });

  it('localises marker names with English fallback', () => {
    const ic = [{ id: 1, chainage_m: 0, names: { en: 'Bhulta', bn: 'ভুলতা' }, kind: 'interchange', status: 'open', connects_to: '' }];
    expect(buildStripModel({ segments: SEGMENTS, interchanges: ic, locale: 'bn' }).markers[0].name).toBe('ভুলতা');
    expect(buildStripModel({ segments: SEGMENTS, interchanges: ic, locale: 'zh' }).markers[0].name).toBe('Bhulta');
  });

  it('reports only the statuses actually present in the legend', () => {
    const m = buildStripModel({ segments: SEGMENTS, interchanges: [], locale: 'en' });
    expect([...m.legend].sort()).toEqual(['construction', 'open']);
    const openOnly = buildStripModel({
      segments: [{ id: 1, from_m: 0, to_m: 10, status: 'open', labels: {} }], interchanges: [], locale: 'en',
    });
    expect(openOnly.legend).toEqual(['open']);
  });

  it('returns an empty, renderable model for no data instead of throwing', () => {
    const m = buildStripModel({ segments: [], interchanges: [], locale: 'en' });
    expect(m.bands).toEqual([]);
    expect(m.markers).toEqual([]);
    expect(m.extent.length_m).toBe(0);
    expect(m.legend).toEqual([]);
  });

  it('never positions a band or marker outside 0-100', () => {
    const m = buildStripModel({
      segments: SEGMENTS,
      interchanges: [{ id: 9, chainage_m: 999999, names: { en: 'Bad row' }, kind: 'interchange', status: 'open', connects_to: '' }],
      locale: 'en',
    });
    for (const b of m.bands) {
      expect(b.leftPct).toBeGreaterThanOrEqual(0);
      expect(b.leftPct + b.widthPct).toBeLessThanOrEqual(100.01);
    }
    expect(m.markers[0].leftPct).toBeLessThanOrEqual(100);
  });
});

describe('marker row assignment', () => {
  // The real corridor: 20 markers, four of them between K11+365 and K13+403.
  const CHAINAGES = [
    0, 2314, 3218, 3706, 7554, 11365, 12090, 13184, 13403, 14584,
    16795, 24522, 26799, 27403, 34353, 34973, 36554, 41371, 45965, 47611,
  ];
  const model = () => buildStripModel({
    segments: [{ id: 1, from_m: 0, to_m: 47611, status: 'open', labels: {} }],
    interchanges: CHAINAGES.map((c, i) => ({
      id: i, chainage_m: c, names: { en: `Marker ${i}` }, kind: 'interchange', status: 'open',
    })),
  });

  it('never puts two markers on one row closer than the minimum gap', () => {
    // This is the whole point. Index parity (the previous approach) put
    // K11+365 and K13+184 on the same row ~45px apart with labels twice
    // that wide, and they printed on top of each other on the home page.
    const byRow = new Map();
    for (const m of model().markers) {
      if (!byRow.has(m.row)) byRow.set(m.row, []);
      byRow.get(m.row).push(m.leftPct);
    }
    for (const [, positions] of byRow) {
      const sorted = [...positions].sort((a, b) => a - b);
      for (let i = 1; i < sorted.length; i += 1) {
        expect(sorted[i] - sorted[i - 1]).toBeGreaterThanOrEqual(7);
      }
    }
  });

  it('reports a row count that covers every marker', () => {
    const m = model();
    expect(m.rowCount).toBeGreaterThanOrEqual(1);
    for (const marker of m.markers) {
      expect(marker.row).toBeLessThan(m.rowCount);
      expect(Number.isInteger(marker.row)).toBe(true);
      expect(marker.row).toBeGreaterThanOrEqual(0);
    }
  });

  it('uses a single row when markers are far apart', () => {
    const m = buildStripModel({
      segments: [{ id: 1, from_m: 0, to_m: 40000, status: 'open', labels: {} }],
      interchanges: [0, 20000, 40000].map((c, i) => ({
        id: i, chainage_m: c, names: { en: `M${i}` }, kind: 'interchange', status: 'open',
      })),
    });
    expect(m.rowCount).toBe(1);
    expect(m.markers.every((x) => x.row === 0)).toBe(true);
  });

  it('adds rows rather than overlapping when markers are tightly clustered', () => {
    // Five markers inside 1% of the corridor cannot share a row at any
    // sane label width. Growing downward is correct; overlapping is not.
    const m = buildStripModel({
      segments: [{ id: 1, from_m: 0, to_m: 100000, status: 'open', labels: {} }],
      interchanges: [100, 200, 300, 400, 500].map((c, i) => ({
        id: i, chainage_m: c, names: { en: `M${i}` }, kind: 'interchange', status: 'open',
      })),
    });
    expect(m.rowCount).toBe(5);
  });

  it('honours a caller-supplied minimum gap', () => {
    const wide = buildStripModel({
      segments: [{ id: 1, from_m: 0, to_m: 47611, status: 'open', labels: {} }],
      interchanges: CHAINAGES.map((c, i) => ({
        id: i, chainage_m: c, names: { en: `M${i}` }, kind: 'interchange', status: 'open',
      })),
      minGapPct: 20,
    });
    expect(wide.rowCount).toBeGreaterThan(model().rowCount);
  });

  it('places a marker with an unusable position rather than dropping it', () => {
    const m = buildStripModel({
      segments: [{ id: 1, from_m: 0, to_m: 1000, status: 'open', labels: {} }],
      interchanges: [{ id: 1, chainage_m: 500, names: { en: 'ok' }, kind: 'interchange', status: 'open' }],
    });
    expect(m.markers).toHaveLength(1);
    expect(m.markers[0].row).toBe(0);
  });
});

describe('marker row assignment keeps same-row labels apart', () => {
  // The real corridor: 20 markers over 47,611 m, with four clustered between
  // K11+365 and K13+403. That cluster is what broke the original approach of
  // alternating rows by index parity — alternating still put two of them on the
  // same row about 45px apart, under labels twice that wide.
  const CHAINAGES = [
    0, 2314, 3218, 3706, 7554, 11365, 12090, 13184, 13403, 14584,
    16795, 24522, 26799, 27403, 34353, 34973, 36554, 41371, 45965, 47611,
  ];
  const segments = [{ id: 1, from_m: 0, to_m: 47611, status: 'construction', labels: {} }];
  const interchanges = CHAINAGES.map((c, i) => ({
    id: i + 1, chainage_m: c, names: { en: `Point ${i}` }, kind: 'interchange', status: 'open',
  }));

  function sameRowGapsAreSafe(model, minGapPct) {
    const rows = new Map();
    for (const m of model.markers) {
      if (!rows.has(m.row)) rows.set(m.row, []);
      rows.get(m.row).push(m.leftPct);
    }
    for (const [, positions] of rows) {
      const sorted = [...positions].sort((a, b) => a - b);
      for (let i = 1; i < sorted.length; i += 1) {
        if (sorted[i] - sorted[i - 1] < minGapPct) return false;
      }
    }
    return true;
  }

  it('never places two markers on one row closer than the gap', () => {
    const model = buildStripModel({ segments, interchanges, locale: 'en' });
    expect(sameRowGapsAreSafe(model, 15)).toBe(true);
  });

  it('holds for any gap a caller passes', () => {
    for (const gap of [5, 8, 15, 25, 40]) {
      const model = buildStripModel({ segments, interchanges, locale: 'en', minGapPct: gap });
      expect(sameRowGapsAreSafe(model, gap)).toBe(true);
    }
  });

  it('needs more rows as the required gap grows, never fewer', () => {
    let previous = 0;
    for (const gap of [5, 8, 15, 25, 40]) {
      const { rowCount } = buildStripModel({ segments, interchanges, locale: 'en', minGapPct: gap });
      expect(rowCount).toBeGreaterThanOrEqual(previous);
      previous = rowCount;
    }
  });

  it('reports a rowCount that actually covers every marker', () => {
    // The CSS sizes the strip's height from rowCount. If it under-reported by
    // even one, the last row would render outside the padded box.
    const model = buildStripModel({ segments, interchanges, locale: 'en' });
    const highest = Math.max(...model.markers.map((m) => m.row));
    expect(model.rowCount).toBe(highest + 1);
    expect(model.markers.every((m) => m.row < model.rowCount)).toBe(true);
  });

  it('puts the first marker on the top row so the strip is never blank at the top', () => {
    const model = buildStripModel({ segments, interchanges, locale: 'en' });
    expect(model.markers[0].row).toBe(0);
  });
});
