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

  it('returns false when either argument is null or undefined', () => {
    expect(overlaps(null, { from_m: 0, to_m: 100 })).toBe(false);
    expect(overlaps({ from_m: 0, to_m: 100 }, null)).toBe(false);
    expect(overlaps(undefined, { from_m: 0, to_m: 100 })).toBe(false);
    expect(overlaps({ from_m: 0, to_m: 100 }, undefined)).toBe(false);
    expect(overlaps(undefined, undefined)).toBe(false);
  });

  it('returns false when arguments lack finite values', () => {
    expect(overlaps({ from_m: 'abc', to_m: 100 }, { from_m: 0, to_m: 100 })).toBe(false);
    expect(overlaps({ from_m: 0, to_m: 'xyz' }, { from_m: 0, to_m: 100 })).toBe(false);
    expect(overlaps({ from_m: 0, to_m: 100 }, { from_m: NaN, to_m: 100 })).toBe(false);
  });
});

describe('malformed segment handling', () => {
  it('skips null elements in segments array', () => {
    const segmentsWithNull = [
      { from_m: 0, to_m: 100, status: 'open' },
      null,
      { from_m: 100, to_m: 200, status: 'open' },
    ];
    expect(corridorExtent(segmentsWithNull)).toEqual({ from_m: 0, to_m: 200, length_m: 200 });
    expect(openLength(segmentsWithNull)).toBe(200);
    expect(percentOpen(segmentsWithNull)).toBe(100);
  });

  it('skips segments with non-numeric from_m or to_m', () => {
    const segmentsWithBadData = [
      { from_m: 0, to_m: 100, status: 'open' },
      { from_m: 'abc', to_m: 200, status: 'open' },
      { from_m: 200, to_m: 300, status: 'open' },
    ];
    expect(corridorExtent(segmentsWithBadData)).toEqual({ from_m: 0, to_m: 300, length_m: 300 });
    expect(openLength(segmentsWithBadData)).toBe(200);
    expect(percentOpen(segmentsWithBadData)).toBe(66.7);
    expect(Number.isNaN(percentOpen(segmentsWithBadData))).toBe(false);
  });

  it('skips inverted segments (to_m < from_m)', () => {
    const segmentsWithInverted = [
      { from_m: 0, to_m: 100, status: 'open' },
      { from_m: 200, to_m: 150, status: 'open' },
      { from_m: 200, to_m: 300, status: 'open' },
    ];
    expect(corridorExtent(segmentsWithInverted)).toEqual({ from_m: 0, to_m: 300, length_m: 300 });
    expect(openLength(segmentsWithInverted)).toBe(200);
    expect(percentOpen(segmentsWithInverted)).toBe(66.7);
  });

  it('clamps percentOpen to 0–100 even with overlapping open segments', () => {
    // Overlapping segments: 0–200 and 100–300 both open = 300 total, but extent is only 300
    const overlappingSegments = [
      { from_m: 0, to_m: 200, status: 'open' },
      { from_m: 100, to_m: 300, status: 'open' },
    ];
    const result = percentOpen(overlappingSegments);
    expect(result).toBeLessThanOrEqual(100);
    expect(result).toBeGreaterThanOrEqual(0);
  });
});
