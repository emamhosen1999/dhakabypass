// tests/unit/corridor-geometry.test.js
import { describe, it, expect } from 'vitest';
import {
  corridorExtent, openLength, percentOpen, positionPercent, sortByChainage, overlaps,
} from '../../lib/corridor/geometry.js';

const SEGMENTS = [
  { from_m: 0, to_m: 3900, status: 'construction' },
  { from_m: 3900, to_m: 21900, status: 'open' },
  { from_m: 21900, to_m: 48000, status: 'construction' },
];

describe('corridorExtent', () => {
  it('spans the lowest start to the highest end', () => {
    expect(corridorExtent(SEGMENTS)).toEqual({ from_m: 0, to_m: 48000, length_m: 48000 });
  });

  it('handles a single segment', () => {
    expect(corridorExtent([{ from_m: 1000, to_m: 5000, status: 'open' }]))
      .toEqual({ from_m: 1000, to_m: 5000, length_m: 4000 });
  });

  it('returns a zero extent for no segments', () => {
    expect(corridorExtent([])).toEqual({ from_m: 0, to_m: 0, length_m: 0 });
    expect(corridorExtent(null)).toEqual({ from_m: 0, to_m: 0, length_m: 0 });
  });
});

describe('openLength', () => {
  it('totals only open segments', () => {
    expect(openLength(SEGMENTS)).toBe(18000);
  });

  it('is zero when nothing is open', () => {
    expect(openLength([{ from_m: 0, to_m: 100, status: 'planned' }])).toBe(0);
    expect(openLength([])).toBe(0);
  });
});

describe('percentOpen', () => {
  it('derives the progress figure from the segments', () => {
    expect(percentOpen(SEGMENTS)).toBe(37.5);
  });

  it('is 100 when everything is open', () => {
    expect(percentOpen([{ from_m: 0, to_m: 48000, status: 'open' }])).toBe(100);
  });

  it('is 0, not NaN, for an empty corridor', () => {
    expect(percentOpen([])).toBe(0);
  });
});

describe('positionPercent', () => {
  const extent = { from_m: 0, to_m: 48000, length_m: 48000 };

  it('places a chainage along the strip', () => {
    expect(positionPercent(0, extent)).toBe(0);
    expect(positionPercent(48000, extent)).toBe(100);
    expect(positionPercent(24000, extent)).toBe(50);
  });

  it('clamps outside the extent instead of overflowing the strip', () => {
    expect(positionPercent(-5000, extent)).toBe(0);
    expect(positionPercent(99000, extent)).toBe(100);
  });

  it('returns 0 for a zero-length corridor rather than dividing by zero', () => {
    expect(positionPercent(100, { from_m: 0, to_m: 0, length_m: 0 })).toBe(0);
  });
});

describe('sortByChainage', () => {
  it('orders without mutating the input', () => {
    const input = [{ chainage_m: 900 }, { chainage_m: 100 }];
    const out = sortByChainage(input);
    expect(out.map((x) => x.chainage_m)).toEqual([100, 900]);
    expect(input.map((x) => x.chainage_m)).toEqual([900, 100]);
  });

  it('tolerates an empty or missing list', () => {
    expect(sortByChainage([])).toEqual([]);
    expect(sortByChainage(null)).toEqual([]);
  });
});

describe('overlaps', () => {
  it('detects a real overlap', () => {
    expect(overlaps({ from_m: 0, to_m: 100 }, { from_m: 50, to_m: 150 })).toBe(true);
  });

  it('treats touching endpoints as adjacent, not overlapping', () => {
    expect(overlaps({ from_m: 0, to_m: 100 }, { from_m: 100, to_m: 200 })).toBe(false);
  });

  it('detects containment', () => {
    expect(overlaps({ from_m: 0, to_m: 500 }, { from_m: 100, to_m: 200 })).toBe(true);
  });
});
