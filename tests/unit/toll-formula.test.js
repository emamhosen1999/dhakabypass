// tests/unit/toll-formula.test.js
//
// The reconstructed DBEDC toll formula.
//
// This file is the reason the provisional O–D matrix is publishable at all.
// Every fare in `toll_od_rates` that carries no S.R.O. number was COMPUTED,
// and the only thing that makes a computed fare defensible rather than
// invented is that it comes out of the corridor operator's own published
// method. The legacy site (`old_dhakabypass/routes-facilities/index.html`,
// "Complete Toll Rate Table") printed, for all nine vehicle classes, three
// columns: a full-distance toll, a calculation formula of the shape
// `(4.31X18+50)X115%`, and the partial-section toll that formula produces.
//
// The assertions below reconstruct the formula from the first column and then
// check it against the third for all nine classes. If a future edit changes
// the access charge, the uplift or the rounding step, eight of nine cases will
// disagree with numbers DBEDC published themselves — which is exactly the
// alarm this file exists to raise.
import { describe, it, expect } from 'vitest';
import {
  DBEDC_2025, CLASS_BASIS, DERIVATIONS, PUBLISHED_PARTIAL_KM,
  uncappedFareBdt, odFare, classBasis,
} from '../../lib/corridor/toll-formula.js';

describe('the published formula, reconstructed', () => {
  it('records the three constants the legacy formula spells out', () => {
    // (perKm X km + 50) X 115%
    expect(DBEDC_2025.accessChargeBdt).toBe(50);
    expect(DBEDC_2025.upliftPercent).toBe(115);
    expect(DBEDC_2025.roundToBdt).toBe(10);
  });

  it('covers all nine published vehicle classes, in the gazette schedule order', () => {
    expect(CLASS_BASIS).toHaveLength(9);
    expect(CLASS_BASIS.map((c) => c.vehicle_class)).toEqual([
      'car', 'pickup', 'microbus', 'minibus', 'small_truck',
      'large_bus', 'medium_truck', 'heavy_truck', 'large_truck',
    ]);
    expect(CLASS_BASIS.map((c) => c.class_order)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
  });

  // THE LOAD-BEARING TEST. Nine independent checks against nine numbers the
  // operator printed on their own website.
  it.each(CLASS_BASIS)(
    'reproduces $vehicle_class’s published partial-section toll of ৳$publishedPartialBdt at 18 km',
    ({ perKmBdt, publishedPartialBdt }) => {
      expect(uncappedFareBdt(perKmBdt, PUBLISHED_PARTIAL_KM * 1000)).toBe(publishedPartialBdt);
    }
  );

  it('derives each per-km rate from the published full-corridor toll over 48.4 km', () => {
    // The legacy site prints both columns; this is the relationship between
    // them, and it is what identifies 48.4 km as the chargeable corridor
    // length the operator priced against. `car` is the single exception and
    // is asserted separately below, because it is a defect in their table,
    // not in this reading of it.
    for (const c of CLASS_BASIS) {
      if (c.vehicle_class === 'car') continue;
      expect(c.fullCorridorBdt / DBEDC_2025.corridorKm).toBeCloseTo(c.perKmBdt, 2);
    }
  });

  it('keeps the operator’s own per-km figure for car even though it does not divide out', () => {
    // Published: 4.31. 200 / 48.4 = 4.132. The published figure is almost
    // certainly a transposition of 4.13, but it is DBEDC's number and it is
    // what produces DBEDC's own published ৳150 — so it is the one used.
    // Substituting 4.13 would make this row disagree with the operator's
    // printed table, which is the opposite of the point.
    const car = classBasis('car');
    expect(car.perKmBdt).toBe(4.31);
    expect(uncappedFareBdt(4.31, 18000)).toBe(150);
    expect(uncappedFareBdt(4.132, 18000)).toBe(140);
  });
});

describe('uncappedFareBdt', () => {
  it('rounds to the nearest ৳10, the step every published figure sits on', () => {
    expect(CLASS_BASIS.every((c) => c.publishedPartialBdt % 10 === 0)).toBe(true);
    expect(CLASS_BASIS.every((c) => c.fullCorridorBdt % 10 === 0)).toBe(true);
    expect(uncappedFareBdt(4.31, 1000)).toBe(60); // (4.31 + 50) * 1.15 = 62.46
  });

  it('still charges the access component over a zero distance', () => {
    // 50 * 1.15 = 57.5 -> 60. Not a fare anybody pays, but it must not be 0:
    // a zero here would silently become a free trip if a caller ever passed a
    // pair whose chainages happened to match.
    expect(uncappedFareBdt(4.31, 0)).toBe(60);
  });

  it('returns null rather than NaN for unusable input', () => {
    expect(uncappedFareBdt('4.31', 1000)).toBeNull();
    expect(uncappedFareBdt(4.31, -1)).toBeNull();
    expect(uncappedFareBdt(4.31, 1000.5)).toBeNull(); // metres are integers here
    expect(uncappedFareBdt(NaN, 1000)).toBeNull();
    expect(uncappedFareBdt(4.31, null)).toBeNull();
  });
});

describe('odFare — the fare actually seeded for one origin/destination pair', () => {
  it('names its derivation, so the data itself says how the number was made', () => {
    const f = odFare('car', 8147);
    expect(f).toEqual({ amount_bdt: 100, derivation: DERIVATIONS.formula });
  });

  it('never charges more for part of the corridor than for the whole of it', () => {
    // 42.747 km of car at the published per-km rate computes to ৳270, but
    // DBEDC's own full-distance toll for a car is ৳200. A sub-journey
    // dearer than the end-to-end journey is not a rate, it is a bug — so the
    // published full-distance toll is a ceiling, and a capped row says so.
    expect(uncappedFareBdt(4.31, 42747)).toBe(270);
    expect(odFare('car', 42747)).toEqual({
      amount_bdt: 200, derivation: DERIVATIONS.capped,
    });
  });

  it('is monotonic in distance for every class', () => {
    for (const c of CLASS_BASIS) {
      let last = -1;
      for (let m = 0; m <= 48400; m += 100) {
        const f = odFare(c.vehicle_class, m);
        expect(f.amount_bdt).toBeGreaterThanOrEqual(last);
        last = f.amount_bdt;
      }
      expect(last).toBe(c.fullCorridorBdt);
    }
  });

  it('returns null for a class the operator never published', () => {
    expect(odFare('rickshaw', 8147)).toBeNull();
    expect(odFare('', 8147)).toBeNull();
    expect(odFare('constructor', 8147)).toBeNull();
  });
});
