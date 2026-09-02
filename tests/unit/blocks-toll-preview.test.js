import { describe, it, expect } from 'vitest';
import { pickRates } from '../../lib/blocks/tollPreview.js';

const RATES = [
  { vehicle_class: 'car', amount_bdt: 150 },
  { vehicle_class: 'microbus', amount_bdt: 190 },
  { vehicle_class: 'large_bus', amount_bdt: 310 },
  { vehicle_class: 'heavy_truck', amount_bdt: 610 },
];

describe('pickRates', () => {
  it('returns the requested classes in the requested order', () => {
    expect(pickRates(RATES, ['large_bus', 'car']).map((r) => r.vehicle_class))
      .toEqual(['large_bus', 'car']);
  });

  it('silently drops a class that has no rate in force', () => {
    expect(pickRates(RATES, ['car', 'motorcycle']).map((r) => r.vehicle_class)).toEqual(['car']);
  });

  it('falls back to the first three rates when nothing is requested', () => {
    expect(pickRates(RATES, []).map((r) => r.vehicle_class))
      .toEqual(['car', 'microbus', 'large_bus']);
    expect(pickRates(RATES, null)).toHaveLength(3);
  });

  it('returns an empty array for missing or malformed rates', () => {
    expect(pickRates(null, ['car'])).toEqual([]);
    expect(pickRates('nope', ['car'])).toEqual([]);
  });

  it('never returns a duplicate even if a class is listed twice', () => {
    expect(pickRates(RATES, ['car', 'car'])).toHaveLength(1);
  });
});
