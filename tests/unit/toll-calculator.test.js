// tests/unit/toll-calculator.test.js
//
// INT.2's arithmetic and its refusals, tested without a database or a browser.
//
// Every assertion here is a way the calculator could quietly mislead a driver:
// quoting the northbound fare for a southbound journey, answering a journey
// that is not a journey, filling a gap in the matrix with a neighbouring
// price, or presenting a computed figure as the gazetted charge. Those are not
// rendering bugs — they are wrong prices on a government-linked site — so they
// are tested against the pure module rather than through the component.
import { describe, it, expect } from 'vitest';
import {
  CALC_KEYS, readSelection, journeyMinutes, calculate,
} from '../../lib/corridor/toll-calculator.js';

const PLAZAS = [
  { id: 89, chainage_m: 3218, kind: 'toll_plaza', names: { en: 'Vogra Toll Plaza (RHS)' } },
  { id: 91, chainage_m: 11365, kind: 'toll_plaza', names: { en: 'Mirer Bazar (A)' } },
  { id: 94, chainage_m: 24522, kind: 'toll_plaza', names: { en: 'Purbachal Toll Plaza' } },
  { id: 97, chainage_m: 45965, kind: 'toll_plaza', names: { en: 'Toll Plaza (K46)' } },
  // Not a plaza: an ordinary interchange, and a fare must never be offered
  // between one of these and anything else.
  { id: 81, chainage_m: 0, kind: 'interchange', names: { en: 'Naojor' } },
];

const rate = (o, d, cls, dist, amt, extra = {}) => ({
  id: `${o}-${d}-${cls}`,
  origin_interchange_id: o,
  destination_interchange_id: d,
  direction: d > o ? 'southbound' : 'northbound',
  vehicle_class: cls,
  class_labels: { en: 'Microbus', bn: 'মাইক্রোবাস', zh: '微型客车' },
  class_order: 3,
  distance_m: dist,
  amount_bdt: amt,
  effective_from: '2025-08-23',
  derivation: 'dbedc-2025-formula',
  sro_number: '', sro_date: '', sro_link: '', is_provisional: 1,
  ...extra,
});

// Vogra -> K46 southbound and its northbound mirror, priced DIFFERENTLY on
// purpose: every direction assertion below would pass by accident if the two
// carried the same amount.
const RATES = [
  rate(89, 97, 'microbus', 42747, '320.00'),
  rate(97, 89, 'microbus', 42747, '300.00'),
  rate(89, 91, 'microbus', 8147, '120.00'),
  rate(91, 89, 'microbus', 8147, '120.00'),
  rate(89, 94, 'car', 21304, '150.00'),
];

const sel = (from, to, vehicle) => ({ from, to, class: vehicle });

describe('reading the selection out of the query string', () => {
  it('names its query keys once, so the form and the reader cannot disagree', () => {
    expect(CALC_KEYS).toEqual({ from: 'from', to: 'to', vehicle: 'class' });
  });

  it('reads three chosen values', () => {
    expect(readSelection({ from: '89', to: '97', class: 'microbus' }))
      .toMatchObject({ originId: 89, destinationId: 97, vehicleClass: 'microbus', chosen: true });
  });

  it('treats a missing query as nothing chosen', () => {
    expect(readSelection(undefined)).toMatchObject({ originId: null, destinationId: null, vehicleClass: '', chosen: false });
    expect(readSelection({})).toMatchObject({ chosen: false });
  });

  it('takes the first value when a key repeats', () => {
    expect(readSelection({ from: ['89', '94'], to: '97', class: ['microbus'] }))
      .toMatchObject({ originId: 89, destinationId: 97, vehicleClass: 'microbus' });
  });

  it('rejects ids that are not positive integers rather than coercing them', () => {
    for (const bad of ['0', '-3', '1.5', 'car', '', ' ', 'NaN', '89abc']) {
      expect(readSelection({ from: bad, to: '97', class: 'microbus' }).originId).toBe(null);
    }
  });

  it('reads only own properties, so ?__proto__= cannot answer for a plaza', () => {
    const hostile = JSON.parse('{"__proto__":{"from":"89"}}');
    expect(readSelection(hostile).originId).toBe(null);
  });

  it('counts a partial selection as chosen, so the visitor is not silently ignored', () => {
    expect(readSelection({ from: '89' }).chosen).toBe(true);
  });
});

describe('direction is derived, never asked', () => {
  const base = { rates: RATES, interchanges: PLAZAS };

  it('reads southbound off increasing chainage and quotes the southbound fare', () => {
    const r = calculate({ ...base, selection: sel('89', '97', 'microbus') });
    expect(r.status).toBe('priced');
    expect(r.direction).toBe('southbound');
    expect(r.amountBdt).toBe('320.00');
  });

  it('reads northbound off decreasing chainage and quotes the OTHER fare', () => {
    const r = calculate({ ...base, selection: sel('97', '89', 'microbus') });
    expect(r.status).toBe('priced');
    expect(r.direction).toBe('northbound');
    expect(r.amountBdt).toBe('300.00');
  });

  it('takes no direction from the query string — only the ordered pair decides', () => {
    const r = calculate({
      ...base,
      selection: { ...sel('89', '97', 'microbus'), direction: 'northbound' },
    });
    expect(r.direction).toBe('southbound');
    expect(r.amountBdt).toBe('320.00');
  });

  it('will not quote a row whose stored direction contradicts the two chainages', () => {
    const wrong = [rate(89, 97, 'microbus', 42747, '320.00', { direction: 'northbound' })];
    const r = calculate({ rates: wrong, interchanges: PLAZAS, selection: sel('89', '97', 'microbus') });
    expect(r.status).toBe('unpriced');
    expect(r.amountBdt).toBe(null);
  });
});

describe('the refusals', () => {
  const base = { rates: RATES, interchanges: PLAZAS };

  it('nothing chosen is not an error — it is the resting state', () => {
    expect(calculate({ ...base, selection: {} }).status).toBe('idle');
  });

  it('a half-filled form asks for the rest rather than answering', () => {
    const r = calculate({ ...base, selection: sel('89', '', 'microbus') });
    expect(r.status).toBe('incomplete');
    expect(r.amountBdt).toBe(null);
  });

  it('the same plaza twice is not a journey', () => {
    const r = calculate({ ...base, selection: sel('89', '89', 'microbus') });
    expect(r.status).toBe('same-point');
    expect(r.amountBdt).toBe(null);
    expect(r.distanceM).toBe(null);
    expect(r.direction).toBe(null);
  });

  it('a point that is not a tolling point is refused, not priced', () => {
    // 81 is an interchange, not a toll plaza.
    const r = calculate({ ...base, selection: sel('81', '97', 'microbus') });
    expect(r.status).toBe('unknown-point');
    expect(r.amountBdt).toBe(null);
  });

  it('a pair with no published fare says so and never borrows a neighbour', () => {
    const r = calculate({ ...base, selection: sel('91', '94', 'microbus') });
    expect(r.status).toBe('unpriced');
    expect(r.amountBdt).toBe(null);
    expect(r.distanceM).toBe(null);
  });

  it('a class with no fare for a pair that IS priced for another class is unpriced', () => {
    // 89->94 exists for `car` only.
    const r = calculate({ ...base, selection: sel('89', '94', 'microbus') });
    expect(r.status).toBe('unpriced');
    expect(r.amountBdt).toBe(null);
  });

  it('a vehicle class the schedule does not carry is refused', () => {
    const r = calculate({ ...base, selection: sel('89', '97', 'rickshaw') });
    expect(r.status).toBe('unpriced');
  });

  it('survives rubbish where the fare rows should be', () => {
    for (const rubbish of [null, undefined, 'rates', 42, [null, 'x', 7]]) {
      const r = calculate({ rates: rubbish, interchanges: PLAZAS, selection: sel('89', '97', 'microbus') });
      expect(r.amountBdt).toBe(null);
      expect(r.provisional).toBe(true);
    }
  });
});

describe('provisional status rides on the row', () => {
  it('a seeded fare with no citation is provisional', () => {
    const r = calculate({ rates: RATES, interchanges: PLAZAS, selection: sel('89', '97', 'microbus') });
    expect(r.provisional).toBe(true);
  });

  it('only a generated 0 WITH the citation that generated it clears the warning', () => {
    const confirmed = [rate(89, 97, 'microbus', 42747, '320.00', {
      is_provisional: 0, sro_number: 'S.R.O. 214-Law/2025', sro_date: '23 August 2025',
    })];
    const r = calculate({ rates: confirmed, interchanges: PLAZAS, selection: sel('89', '97', 'microbus') });
    expect(r.provisional).toBe(false);
  });

  it('a forged is_provisional=0 with no citation is still provisional', () => {
    const forged = [rate(89, 97, 'microbus', 42747, '320.00', { is_provisional: 0 })];
    const r = calculate({ rates: forged, interchanges: PLAZAS, selection: sel('89', '97', 'microbus') });
    expect(r.provisional).toBe(true);
  });

  it('every state that shows no fare still reports provisional, so a caller cannot forget', () => {
    for (const s of [sel('', '', ''), sel('89', '89', 'microbus'), sel('91', '94', 'microbus')]) {
      expect(calculate({ rates: RATES, interchanges: PLAZAS, selection: s }).provisional).toBe(true);
    }
  });
});

describe('the tolling points offered', () => {
  it('offers only plazas the fare table actually prices, in road order', () => {
    const r = calculate({ rates: RATES, interchanges: PLAZAS, selection: {} });
    expect(r.points.map((p) => p.id)).toEqual([89, 91, 94, 97]);
  });

  it('offers each vehicle class once, in the gazette schedule order', () => {
    const r = calculate({ rates: RATES, interchanges: PLAZAS, selection: {} });
    expect(r.classes.map((c) => c.vehicle_class)).toEqual(['car', 'microbus']);
  });
});

describe('journey time is derived or omitted, never invented', () => {
  // Sections tiling 0 -> 20000, as corridor_sections does via its waypoints.
  const spans = [
    { id: 1, from_m: 0, to_m: 10000, avg_speed_kmh: 60, measured_at: '2026-09-10 08:00:00' },
    { id: 2, from_m: 10000, to_m: 20000, avg_speed_kmh: 40, measured_at: '2026-09-10 08:00:00' },
  ];

  it('weights each section by the distance actually travelled on it', () => {
    // 10 km at 60 = 10 min; 10 km at 40 = 15 min.
    expect(journeyMinutes(spans, 0, 20000)).toBe(25);
  });

  it('counts only the overlapping part of a section', () => {
    // 5 km at 60 = 5 min.
    expect(journeyMinutes(spans, 5000, 10000)).toBe(5);
  });

  it('reads the same both ways round', () => {
    expect(journeyMinutes(spans, 20000, 0)).toBe(25);
  });

  it('returns null when any section crossed has no measured speed', () => {
    const unmeasured = [spans[0], { ...spans[1], avg_speed_kmh: null }];
    expect(journeyMinutes(unmeasured, 0, 20000)).toBe(null);
  });

  it('returns null when a section is measured at zero — a closure is not a speed', () => {
    const closed = [spans[0], { ...spans[1], avg_speed_kmh: 0 }];
    expect(journeyMinutes(closed, 0, 20000)).toBe(null);
  });

  it('returns null when a section carries a speed but no measurement time', () => {
    const undated = [spans[0], { ...spans[1], measured_at: null }];
    expect(journeyMinutes(undated, 0, 20000)).toBe(null);
  });

  it('returns null rather than extrapolating across a gap in the sections', () => {
    expect(journeyMinutes([spans[0]], 0, 20000)).toBe(null);
  });

  it('returns null for no sections at all — which is the corridor today', () => {
    expect(journeyMinutes([], 0, 20000)).toBe(null);
    expect(journeyMinutes(null, 0, 20000)).toBe(null);
  });

  it('returns null for a zero-length journey', () => {
    expect(journeyMinutes(spans, 5000, 5000)).toBe(null);
  });

  it('carries the time onto a priced result when the sections are measured', () => {
    const measured = [
      { id: 1, from_m: 0, to_m: 50000, avg_speed_kmh: 60, measured_at: '2026-09-10 08:00:00' },
    ];
    const r = calculate({
      rates: RATES, interchanges: PLAZAS, sections: measured, selection: sel('89', '97', 'microbus'),
    });
    // 42.747 km at 60 km/h = 42.747 minutes.
    expect(r.minutes).toBe(43);
  });

  it('omits the time when the corridor is unmeasured, and never guesses one', () => {
    const r = calculate({ rates: RATES, interchanges: PLAZAS, sections: [], selection: sel('89', '97', 'microbus') });
    expect(r.status).toBe('priced');
    expect(r.amountBdt).toBe('320.00');
    expect(r.minutes).toBe(null);
  });
});
