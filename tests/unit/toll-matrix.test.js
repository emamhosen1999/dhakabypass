// tests/unit/toll-matrix.test.js
//
// The origin–destination fare matrix: how tolling points are identified, how
// a direction is decided, and — the part that matters most — what makes a row
// provisional.
//
// `toll_rates` cannot express an O–D fare: `section` is a free-text label and
// `uq_class_effective (vehicle_class, effective_from)` physically forbids two
// sections' rates for one class on one date. `toll_od_rates` is the table that
// can, and it ships seeded with COMPUTED figures so INT.2's calculator has
// something to be built against. Every one of those figures is a rate a driver
// could budget against and be charged something else at the plaza, so
// "provisional" is not a sentence in a paragraph somebody can delete — it is
// a column MySQL/MariaDB will not let anybody write.
//
// Pure functions only here; the query layer is exercised against the real
// database by the import in the task's verification step.
import { describe, it, expect } from 'vitest';
import {
  tollPoints, directionFor, isProvisional, hasCitation,
  buildMatrix, DIRECTIONS,
} from '../../lib/corridor/toll-matrix.js';

const INTERCHANGES = [
  { id: 81, chainage_m: 0, kind: 'interchange', names: { en: 'Naojor (corridor start)' } },
  { id: 89, chainage_m: 3218, kind: 'toll_plaza', names: { en: 'Vogra Toll Plaza (RHS)', bn: 'ভোগড়া' } },
  { id: 90, chainage_m: 3706, kind: 'toll_plaza', names: { en: 'Vogra Toll Plaza (LHS)' } },
  { id: 98, chainage_m: 14584, kind: 'bridge', names: { en: 'Nagda Bridge' } },
  { id: 91, chainage_m: 11365, kind: 'toll_plaza', names: { en: 'Mirer Bazar (A)' } },
  { id: 94, chainage_m: 24522, kind: 'toll_plaza', names: { en: 'Purbachal Toll Plaza' } },
  { id: 88, chainage_m: 47611, kind: 'interchange', names: { en: 'Madanpur (corridor end)' } },
];

describe('tollPoints — which records are tolling points', () => {
  // The block catalogue records, as one of four gaps that must close, that
  // "toll plazas and bridges are name-matched, not typed records —
  // lib/corridor/map-labels.js:17 string-replaces ' Toll Plaza' and ' Bridge'
  // out of feature names". That defect is a DISPLAY shortcut. The RECORD is
  // typed: interchanges.kind is an enum with a `toll_plaza` member, and it is
  // the only thing consulted here. Nothing in this module reads a name to
  // decide what a row is.
  it('selects on interchanges.kind, never on the name', () => {
    expect(tollPoints(INTERCHANGES).map((p) => p.id)).toEqual([89, 90, 91, 94]);
  });

  it('does not mistake a bridge whose name contains "Toll Plaza" for a plaza', () => {
    const trap = [{ id: 1, chainage_m: 100, kind: 'bridge', names: { en: 'Toll Plaza Bridge' } }];
    expect(tollPoints(trap)).toEqual([]);
  });

  it('does not miss a plaza whose name says nothing about tolls', () => {
    const quiet = [{ id: 2, chainage_m: 200, kind: 'toll_plaza', names: { en: 'K34' } }];
    expect(tollPoints(quiet).map((p) => p.id)).toEqual([2]);
  });

  it('returns them in chainage order, which is the order the corridor runs', () => {
    expect(tollPoints(INTERCHANGES).map((p) => p.chainage_m)).toEqual([3218, 3706, 11365, 24522]);
  });

  it('survives junk without throwing — this feeds an admin <select>', () => {
    expect(tollPoints(null)).toEqual([]);
    expect(tollPoints([null, 'x', { kind: 'toll_plaza' }])).toEqual([]);
  });
});

describe('directionFor', () => {
  it('names the two carriageways by the way chainage runs', () => {
    // interchangeCaption already publishes the corridor "north to south":
    // Naojor (K0, Gazipur) to Madanpur (K47+611, Narayanganj). Increasing
    // chainage is therefore southbound.
    expect(DIRECTIONS).toEqual(['southbound', 'northbound']);
    expect(directionFor(3218, 24522)).toBe('southbound');
    expect(directionFor(24522, 3218)).toBe('northbound');
  });

  it('refuses a pair that is not a journey', () => {
    expect(directionFor(3218, 3218)).toBeNull();
    expect(directionFor(3218, null)).toBeNull();
    expect(directionFor('3218', 24522)).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Provisional status. The structural half of this lives in the DDL:
// `is_provisional` is a STORED GENERATED column over `sro_number`, so no
// UPDATE can set it and no operator can mark a fare confirmed without typing
// the citation that makes it true. These are the reader-side counterparts —
// what the render layer asks, and it must ask the DATA, never the block.
// ---------------------------------------------------------------------------
describe('isProvisional / hasCitation', () => {
  it('treats a row with no S.R.O. number as provisional', () => {
    expect(isProvisional({ sro_number: '', is_provisional: 1 })).toBe(true);
    expect(hasCitation({ sro_number: '' })).toBe(false);
  });

  it('treats a row carrying an S.R.O. number and date as authoritative', () => {
    const row = { sro_number: 'S.R.O. 214-Law/2025', sro_date: '2025-08-23', is_provisional: 0 };
    expect(isProvisional(row)).toBe(false);
    expect(hasCitation(row)).toBe(true);
  });

  it('believes the stored generated column over anything else on the row', () => {
    // A hand-edited row, an import, or a future column could disagree with
    // itself. The database computed is_provisional from sro_number under a
    // constraint; a value pasted into another field did not.
    expect(isProvisional({ is_provisional: 1, sro_number: 'S.R.O. 1/2025' })).toBe(true);
  });

  it('fails safe: an unreadable row is provisional, never confirmed', () => {
    expect(isProvisional(null)).toBe(true);
    expect(isProvisional({})).toBe(true);
    expect(isProvisional({ sro_number: '   ' })).toBe(true);
    expect(isProvisional({ is_provisional: 0 })).toBe(true);
  });

  it('does not count a number without a date as a citation', () => {
    expect(hasCitation({ sro_number: 'S.R.O. 214', sro_date: '' })).toBe(false);
  });
});

describe('buildMatrix — the shape a renderer needs', () => {
  const ROWS = [
    { id: 1, origin_interchange_id: 89, destination_interchange_id: 91, direction: 'southbound',
      vehicle_class: 'car', distance_m: 8147, amount_bdt: '100.00', is_provisional: 1, sro_number: '' },
    { id: 2, origin_interchange_id: 91, destination_interchange_id: 89, direction: 'northbound',
      vehicle_class: 'car', distance_m: 8147, amount_bdt: '100.00', is_provisional: 1, sro_number: '' },
    { id: 3, origin_interchange_id: 89, destination_interchange_id: 94, direction: 'southbound',
      vehicle_class: 'car', distance_m: 21304, amount_bdt: '150.00', is_provisional: 0,
      sro_number: 'S.R.O. 1/2025', sro_date: '2025-08-23' },
    { id: 4, origin_interchange_id: 89, destination_interchange_id: 91, direction: 'southbound',
      vehicle_class: 'large_bus', distance_m: 8147, amount_bdt: '170.00', is_provisional: 1, sro_number: '' },
  ];

  it('lists only the plazas the chosen class actually has fares between', () => {
    const m = buildMatrix(ROWS, INTERCHANGES, { vehicleClass: 'large_bus' });
    expect(m.points.map((p) => p.id)).toEqual([89, 91]);
  });

  it('orders plazas by chainage so the table reads along the road', () => {
    const m = buildMatrix(ROWS, INTERCHANGES, { vehicleClass: 'car' });
    expect(m.points.map((p) => p.id)).toEqual([89, 91, 94]);
  });

  it('finds a fare by ordered pair — the two directions are separate rows', () => {
    const m = buildMatrix(ROWS, INTERCHANGES, { vehicleClass: 'car' });
    expect(m.cell(89, 91).amount_bdt).toBe('100.00');
    expect(m.cell(91, 89).direction).toBe('northbound');
    expect(m.cell(94, 89)).toBeNull();
    expect(m.cell(89, 89)).toBeNull();
  });

  it('reports whether ANY shown fare is still provisional', () => {
    expect(buildMatrix(ROWS, INTERCHANGES, { vehicleClass: 'car' }).anyProvisional).toBe(true);
    const confirmed = ROWS.filter((r) => r.id === 3);
    expect(buildMatrix(confirmed, INTERCHANGES, { vehicleClass: 'car' }).anyProvisional).toBe(false);
  });

  it('falls back to the lowest class present when none is named', () => {
    const m = buildMatrix(ROWS, INTERCHANGES, {});
    expect(m.vehicleClass).toBe('car');
  });

  it('shows nothing rather than another class’s prices when the named class has none', () => {
    const m = buildMatrix(ROWS, INTERCHANGES, { vehicleClass: 'rickshaw' });
    expect(m.points).toEqual([]);
    expect(m.rows).toEqual([]);
  });

  it('drops a fare whose plaza record has gone', () => {
    const orphan = [{ ...ROWS[0], destination_interchange_id: 9999 }];
    expect(buildMatrix(orphan, INTERCHANGES, { vehicleClass: 'car' }).points).toEqual([]);
  });

  it('survives junk', () => {
    expect(buildMatrix(null, null, {}).points).toEqual([]);
    expect(buildMatrix([null, 3], INTERCHANGES, {}).points).toEqual([]);
  });
});
