// lib/corridor/toll-formula.js
//
// DBEDC'S OWN PUBLISHED TOLL CALCULATION, RECONSTRUCTED.
//
// ---------------------------------------------------------------------------
// WHY THIS FILE EXISTS
// ---------------------------------------------------------------------------
// `toll_od_rates` ships seeded, because INT.2's calculator cannot be built or
// demonstrated against an empty table. Seeding it means publishing numbers
// DBEDC has not yet confirmed, and a fare is not an ordinary placeholder: a
// driver who budgets ৳260 and is charged ৳400 at the plaza has been misled by
// this website. The master plan's Global Constraints put it plainly — "toll
// figures carry provenance", "operator-verified facts only".
//
// The seed is therefore constrained two ways. Structurally, every seeded row
// is provisional and stays provisional until somebody types the S.R.O. number
// (see db/sql/12-toll-od-matrix.sql — `is_provisional` is a GENERATED column,
// not a flag). And numerically, no figure is invented: every one comes out of
// the operator's own published method, which is what this file reconstructs.
//
// ---------------------------------------------------------------------------
// THE SOURCE
// ---------------------------------------------------------------------------
// The legacy site's /routes-facilities page carried a "Complete Toll Rate
// Table" with four columns — vehicle type, full distance toll, calculation
// formula, partial section toll. It is still on disk at
// `old_dhakabypass/routes-facilities/index.html`. The formula column reads,
// for all nine classes:
//
//     Large Truck / trailer, 15–25 t   ৳1600   (33.06X18+50)X115%   ৳740
//     Heavy Truck, 2–3 axles, 7 t+     ৳1280   (26.45X18+50)X115%   ৳610
//     Medium Truck, 5–7 t              ৳ 800   (16.53X18+50)X115%   ৳400
//     Large Bus, 31 seats              ৳ 600   (12.40X18+50)X115%   ৳310
//     Small Truck, 3 t                 ৳ 480   ( 9.92X18+50)X115%   ৳260
//     Minibus / Coaster                ৳ 360   ( 7.44X18+50)X115%   ৳210
//     Microbus                         ৳ 320   ( 6.61X18+50)X115%   ৳190
//     Pick-up / Jeep / Wrecker / Crane ৳ 280   ( 5.79X18+50)X115%   ৳180
//     Sedan Car                        ৳ 200   ( 4.31X18+50)X115%   ৳150
//
// Reading it out:
//
//   * The leading figure is a PER-KILOMETRE RATE in taka for that class.
//     Divide each full-distance toll by 48.4 and you get it back to two
//     decimals for eight of the nine classes — which also identifies 48.4 km,
//     not the round "48 km" of the marketing copy, as the chargeable corridor
//     length the schedule was priced against.
//   * `18` is the length in kilometres of the section being charged. It is
//     not a constant of the formula; it is the input. That is what makes this
//     formula usable for an O–D matrix at all.
//   * `+50` is a flat access charge in taka, levied once per journey.
//   * `X115%` is a uniform 15% uplift applied after the access charge.
//   * The result is rounded to the nearest ৳10 — every published figure in
//     both money columns sits on a ৳10 step.
//
// Substituting 18 back in reproduces DBEDC's own partial-section column for
// all nine classes. tests/unit/toll-formula.test.js asserts exactly that,
// nine times, so this reading is checked rather than asserted.
//
// ---------------------------------------------------------------------------
// THE ONE DISCREPANCY, LEFT ALONE DELIBERATELY
// ---------------------------------------------------------------------------
// Sedan car is published as 4.31/km, but 200 / 48.4 = 4.132 — almost certainly
// a transposition of 4.13 in the legacy table. The published 4.31 is kept.
// It is DBEDC's number, and it is the number that yields DBEDC's own published
// ৳150; "correcting" it would make this module disagree with the operator's
// printed table, and the whole point of computing from their formula is that
// the result is theirs and not ours.
//
// ---------------------------------------------------------------------------
// THE ONE INTERPRETIVE STEP, MARKED IN THE DATA
// ---------------------------------------------------------------------------
// Applied without limit the formula eventually charges more for part of the
// corridor than the published end-to-end toll: a car over 42.7 km computes to
// ৳270 against a full-distance toll of ৳200. The published full-distance toll
// is therefore treated as a ceiling. That is a reading, not a quotation — so a
// capped row records `dbedc-2025-formula-capped` rather than
// `dbedc-2025-formula`, and the interpretation is visible in the data instead
// of buried in a comment nobody reads.

export const DBEDC_2025 = Object.freeze({
  source: 'old_dhakabypass/routes-facilities/index.html — "Complete Toll Rate Table"',
  accessChargeBdt: 50,
  upliftPercent: 115,
  roundToBdt: 10,
  /** Divides each published full-distance toll into its published per-km rate. */
  corridorKm: 48.4,
});

/** The section length the published formula column is worked for. */
export const PUBLISHED_PARTIAL_KM = 18;

/**
 * What produced a stored amount. Written to `toll_od_rates.derivation` so a
 * row carries its own audit trail, and so replacing the provisional figures
 * with gazetted ones is a question anyone can ask the database.
 */
export const DERIVATIONS = Object.freeze({
  /** Straight out of the published formula at the surveyed distance. */
  formula: 'dbedc-2025-formula',
  /** The formula, limited to the published full-distance toll. */
  capped: 'dbedc-2025-formula-capped',
  /** Not computed: the rate DBEDC already publishes for that exact section. */
  published: 'dbedc-2025-published',
  /** Set by an operator on a gazetted rate. Never seeded. */
  gazette: 'gazette',
});

/**
 * The nine classes, in the order the gazette schedule uses.
 *
 * `vehicle_class` matches `toll_rates.vehicle_class` exactly, on purpose. The
 * published NAME of each class is not repeated here: it lives once, on
 * `toll_rates.class_labels`, and the matrix reader joins to it. Two copies of
 * "what a microbus is called" would eventually name the same vehicle
 * differently on the toll page and in the matrix — the records-vs-blocks rule
 * applied one level down.
 */
export const CLASS_BASIS = Object.freeze([
  { vehicle_class: 'car', class_order: 1, perKmBdt: 4.31, fullCorridorBdt: 200, publishedPartialBdt: 150 },
  { vehicle_class: 'pickup', class_order: 2, perKmBdt: 5.79, fullCorridorBdt: 280, publishedPartialBdt: 180 },
  { vehicle_class: 'microbus', class_order: 3, perKmBdt: 6.61, fullCorridorBdt: 320, publishedPartialBdt: 190 },
  { vehicle_class: 'minibus', class_order: 4, perKmBdt: 7.44, fullCorridorBdt: 360, publishedPartialBdt: 210 },
  { vehicle_class: 'small_truck', class_order: 5, perKmBdt: 9.92, fullCorridorBdt: 480, publishedPartialBdt: 260 },
  { vehicle_class: 'large_bus', class_order: 6, perKmBdt: 12.40, fullCorridorBdt: 600, publishedPartialBdt: 310 },
  { vehicle_class: 'medium_truck', class_order: 7, perKmBdt: 16.53, fullCorridorBdt: 800, publishedPartialBdt: 400 },
  { vehicle_class: 'heavy_truck', class_order: 8, perKmBdt: 26.45, fullCorridorBdt: 1280, publishedPartialBdt: 610 },
  { vehicle_class: 'large_truck', class_order: 9, perKmBdt: 33.06, fullCorridorBdt: 1600, publishedPartialBdt: 740 },
].map(Object.freeze));

/**
 * The basis row for a class key, or null.
 *
 * Own-property lookup rather than an object map, because the key reaching this
 * comes off a database row and from admin form input: `classBasis('constructor')`
 * must be null, not a function.
 */
export function classBasis(vehicleClass) {
  if (typeof vehicleClass !== 'string' || !vehicleClass) return null;
  return CLASS_BASIS.find((c) => c.vehicle_class === vehicleClass) || null;
}

const isMetres = (v) => typeof v === 'number' && Number.isFinite(v) && v >= 0 && Number.isInteger(v);

/**
 * `(perKm × km + 50) × 115%`, rounded to the nearest ৳10 — the published
 * formula and nothing else. No ceiling is applied here; `odFare` does that,
 * so the raw formula stays separately testable against the nine figures DBEDC
 * printed.
 *
 * Returns null rather than NaN for unusable input. A NaN travelling onwards
 * becomes "৳ NaN" beside a vehicle class on a public page; a null is caught by
 * the caller, which is the difference between a visible gap and a wrong price.
 * Metres must be a whole number for the same reason `lib/corridor/chainage.js`
 * insists: chainage is an INT column, and a fractional metre means a bug
 * upstream.
 */
export function uncappedFareBdt(perKmBdt, distanceM) {
  if (typeof perKmBdt !== 'number' || !Number.isFinite(perKmBdt) || perKmBdt < 0) return null;
  if (!isMetres(distanceM)) return null;
  const { accessChargeBdt, upliftPercent, roundToBdt } = DBEDC_2025;
  const raw = (perKmBdt * (distanceM / 1000) + accessChargeBdt) * (upliftPercent / 100);
  return Math.round(raw / roundToBdt) * roundToBdt;
}

/**
 * The fare seeded for one origin/destination pair, with the derivation that
 * produced it. Null for a class the operator has never published a rate for —
 * never a guess, and never another class's price.
 */
export function odFare(vehicleClass, distanceM) {
  const basis = classBasis(vehicleClass);
  if (!basis) return null;
  const uncapped = uncappedFareBdt(basis.perKmBdt, distanceM);
  if (uncapped === null) return null;
  if (uncapped > basis.fullCorridorBdt) {
    return { amount_bdt: basis.fullCorridorBdt, derivation: DERIVATIONS.capped };
  }
  return { amount_bdt: uncapped, derivation: DERIVATIONS.formula };
}
