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
