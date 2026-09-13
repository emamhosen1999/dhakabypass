// tests/unit/blocks-corridor-live.test.js
//
// The pure halves of the three live corridor blocks: which records each one
// shows, in what order, and what it does with a configuration that matches
// nothing. These are the decisions that put a wrong price on a printed rate
// card or hide a closure, so they are tested without a database or a
// renderer in the way.
import { describe, it, expect } from 'vitest';
import { selectRates, hasSectionColumn, tollCitation, TOLL_SORTS } from '../../lib/blocks/tollTable.js';
import {
  selectSections, conditionsPresent, waypointNames, sectionCode, SECTION_SORTS,
} from '../../lib/blocks/trafficStatus.js';
import {
  selectInterchanges, visibleColumns, OPTIONAL_COLUMNS, INTERCHANGE_SORTS, rowLimit,
} from '../../lib/blocks/interchangeTable.js';
import { conditionKey, conditionColour, conditionLabelKey, CONDITIONS } from '../../lib/corridor/conditions.js';

// amount_bdt arrives from mysql2 as a DECIMAL string, which is what makes the
// numeric sort worth testing: '90' sorts above '610' as text.
const RATES = [
  { id: 1, vehicle_class: 'car', class_order: 1, section: 'Vogra – Purbachal', amount_bdt: '150.00' },
  { id: 2, vehicle_class: 'large_bus', class_order: 6, section: 'Vogra – Purbachal', amount_bdt: '310.00' },
  { id: 3, vehicle_class: 'heavy_truck', class_order: 8, section: 'Madanpur spur', amount_bdt: '90.00' },
];

describe('selectRates', () => {
  it('keeps the record order by default — the order the gazette schedule uses', () => {
    expect(selectRates(RATES, {}).map((r) => r.vehicle_class))
      .toEqual(['car', 'large_bus', 'heavy_truck']);
  });

  it('sorts by amount numerically, not as the DECIMAL strings mysql2 returns', () => {
    expect(selectRates(RATES, { sort: 'amount-asc' }).map((r) => r.amount_bdt))
      .toEqual(['90.00', '150.00', '310.00']);
    expect(selectRates(RATES, { sort: 'amount-desc' }).map((r) => r.amount_bdt))
      .toEqual(['310.00', '150.00', '90.00']);
  });

  it('matches the section filter ignoring case and surrounding space', () => {
    expect(selectRates(RATES, { section: '  vogra – purbachal ' })).toHaveLength(2);
  });

  it('is not a substring match — a section must not pick up its neighbours', () => {
    expect(selectRates(RATES, { section: 'Vogra' })).toEqual([]);
  });

  it('returns nothing rather than everything when the filter matches no rate', () => {
    // The wrong failure here publishes another section's prices under this
    // section's heading.
    expect(selectRates(RATES, { section: 'Nowhere' })).toEqual([]);
  });

  it('falls back to the record order for an unknown sort value', () => {
    expect(selectRates(RATES, { sort: 'cheapest' }).map((r) => r.id)).toEqual([1, 2, 3]);
  });

  it('survives a dead query and a malformed row', () => {
    expect(selectRates(null, {})).toEqual([]);
    expect(selectRates('nope', {})).toEqual([]);
    expect(selectRates([null, 'x', 42, { amount_bdt: 10 }], {})).toEqual([]);
  });

  it('never mutates the rows it was given', () => {
    const before = RATES.map((r) => r.vehicle_class);
    selectRates(RATES, { sort: 'amount-desc' });
    expect(RATES.map((r) => r.vehicle_class)).toEqual(before);
  });

  it('declares every sort the block type offers', () => {
    expect(TOLL_SORTS).toEqual(['class', 'amount-asc', 'amount-desc']);
  });
});

describe('hasSectionColumn', () => {
  it('is true when any shown rate names a section', () => {
    expect(hasSectionColumn(RATES)).toBe(true);
  });
  it('is false when none does, so the table drops a column of dashes', () => {
    expect(hasSectionColumn([{ section: '' }, { section: '   ' }, {}])).toBe(false);
    expect(hasSectionColumn(null)).toBe(false);
  });
});

describe('tollCitation', () => {
  it('is null when nothing has been entered — no empty citation line', () => {
    expect(tollCitation({})).toBeNull();
    expect(tollCitation({ revisionMechanism: '' }, [{ sro_number: '  ', sro_date: '' }])).toBeNull();
  });

  it('reads the number, date and link from the rate records, the mechanism from the block (audit 5.1)', () => {
    expect(tollCitation(
      { revisionMechanism: 'Revised every three years under the concession agreement.', sroNumber: 'IGNORED' },
      [{ sro_number: '' }, { sro_number: 'S.R.O. No. 128-Law/2023', sro_date: '14 May 2023', sro_link: '/uploads/sro-128.pdf' }],
    )).toEqual({
      number: 'S.R.O. No. 128-Law/2023',
      date: '14 May 2023',
      href: '/uploads/sro-128.pdf',
      mechanism: 'Revised every three years under the concession agreement.',
    });
  });

  it('drops a link that has no S.R.O. number to name it', () => {
    expect(tollCitation({ revisionMechanism: 'x' }, [{ sro_link: 'https://example.gov.bd/x.pdf', sro_date: '2023' }]))
      .toEqual({ number: '', date: '', href: '', mechanism: 'x' });
  });

  it('still renders a citation with a mechanism and no number', () => {
    expect(tollCitation({ revisionMechanism: 'Fixed by gazette notification.' }).mechanism)
      .toBe('Fixed by gazette notification.');
  });

  it('has no citation field on the block type any more', async () => {
    const def = (await import('../../lib/blocks/types/toll-table.js')).default;
    expect(def.fields.map((f) => f.name)).not.toEqual(expect.arrayContaining(['sroNumber']));
    expect(def.fields.some((f) => /^sro/.test(f.name))).toBe(false);
  });
});

describe('inForceSince', () => {
  it('is the latest effective date among the rows shown', async () => {
    const { inForceSince } = await import('../../lib/blocks/tollTable.js');
    const d = inForceSince([{ effective_from: '2025-03-27' }, { effective_from: new Date(2025, 6, 1) }, {}]);
    expect(d.getFullYear()).toBe(2025);
    expect(d.getMonth()).toBe(6);
    expect(inForceSince([])).toBeNull();
  });
});

const SECTIONS = [
  { id: 1, from_code: 'S', to_code: '2', sort_order: 0, condition_key: 'free', avg_speed_kmh: 80, measured_at: '2026-09-07T04:00:00.000Z' },
  { id: 2, from_code: '2', to_code: '3', sort_order: 1, condition_key: 'heavy', avg_speed_kmh: 12, measured_at: null },
  { id: 3, from_code: '3', to_code: 'E', sort_order: 2, condition_key: 'unknown', avg_speed_kmh: null, measured_at: null },
];

describe('selectSections', () => {
  it('names a section by its waypoint pair, which is its UNIQUE key', () => {
    expect(sectionCode(SECTIONS[0])).toBe('S-2');
  });

  it('follows the corridor by default', () => {
    expect(selectSections(SECTIONS, {}).map((s) => s.code)).toEqual(['S-2', '2-3', '3-E']);
  });

  it('sorts worst first, with "not measured" last rather than worst', () => {
    // A section nobody has measured is not a jam. Reporting it as one would
    // put congestion at the top of a list for a road that may be empty.
    expect(selectSections(SECTIONS, { sort: 'worst-first' }).map((s) => s.condition))
      .toEqual(['heavy', 'free', 'unknown']);
  });

  it('filters on section codes, ignoring case', () => {
    expect(selectSections(SECTIONS, { sections: ['s-2', '3-E'] }).map((s) => s.code))
      .toEqual(['S-2', '3-E']);
  });

  it('ignores a code that matches nothing rather than emptying the table', () => {
    expect(selectSections(SECTIONS, { sections: ['S-2', 'X-Y'] }).map((s) => s.code)).toEqual(['S-2']);
  });

  it('returns nothing rather than the whole corridor when no code matches', () => {
    expect(selectSections(SECTIONS, { sections: ['X-Y'] })).toEqual([]);
  });

  it('treats a zero speed as no measurement, not as stationary traffic', () => {
    const [row] = selectSections([{ ...SECTIONS[0], avg_speed_kmh: 0 }], {});
    expect(row.speed).toBeNull();
  });

  it('reduces an unrecognised condition_key to "unknown"', () => {
    const [row] = selectSections([{ ...SECTIONS[0], condition_key: 'gridlocked' }], {});
    expect(row.condition).toBe('unknown');
  });

  it('parses measured_at from a Date and from the ISO string the cache returns', () => {
    const [fromString] = selectSections(SECTIONS, {});
    expect(fromString.measuredAt).toBeInstanceOf(Date);
    const [fromDate] = selectSections([{ ...SECTIONS[0], measured_at: new Date('2026-09-07T04:00:00Z') }], {});
    expect(fromDate.measuredAt.toISOString()).toBe('2026-09-07T04:00:00.000Z');
  });

  it('never produces an Invalid Date', () => {
    const [row] = selectSections([{ ...SECTIONS[0], measured_at: 'not a date' }], {});
    expect(row.measuredAt).toBeNull();
  });

  it('survives a dead query and a malformed row', () => {
    expect(selectSections(null, {})).toEqual([]);
    expect(selectSections([null, 'x'], {})).toEqual([]);
  });

  it('declares every sort the block type offers', () => {
    expect(SECTION_SORTS).toEqual(['corridor', 'worst-first']);
  });
});

describe('conditionsPresent', () => {
  it('lists only the conditions on the road, in ramp order', () => {
    expect(conditionsPresent(selectSections(SECTIONS, {}))).toEqual(['heavy', 'free', 'unknown']);
  });
  it('is empty for an empty corridor, so no legend renders', () => {
    expect(conditionsPresent([])).toEqual([]);
  });
});

describe('waypointNames', () => {
  it('reads a names column that arrives parsed and one that arrives as a string', () => {
    const map = waypointNames([
      { code: 'S', names: { en: 'Naojor', bn: 'নাওজোড়' } },
      { code: 'E', names: '{"en":"Madanpur"}' },
    ]);
    expect(map.S.bn).toBe('নাওজোড়');
    expect(map.E.en).toBe('Madanpur');
  });

  it('gives an empty map for the six waypoints that carry no name today', () => {
    expect(waypointNames([{ code: '4', names: null }, { code: '5', names: 'not json' }]))
      .toEqual({ 4: {}, 5: {} });
  });

  it('survives a dead query', () => {
    expect(waypointNames(null)).toEqual({});
  });
});

const PLACES = [
  { id: 1, chainage_m: 12090, kind: 'toll_plaza', status: 'open', connects_to: 'N105', facilities: ['Fuel', 'Toilets'] },
  { id: 2, chainage_m: 2314, kind: 'interchange', status: 'construction', connects_to: '', facilities: [] },
  { id: 3, chainage_m: 500, kind: 'waypoint', status: 'open', connects_to: '', facilities: [] },
  { id: 4, chainage_m: 41371, kind: 'bridge', status: 'open', connects_to: '', facilities: 'nope' },
];
const NAMES = { 1: 'Kanchan', 2: 'Bhulta', 3: 'Waypoint 3', 4: 'Balu Bridge' };
const nameOf = (r) => NAMES[r.id] || '';

describe('selectInterchanges', () => {
  it('drops survey waypoints by KIND, never by name', () => {
    // strip.js filters the same records the same way. A name-based filter
    // would start publishing these the moment one is given a real name.
    expect(selectInterchanges(PLACES, {}, nameOf).map((r) => r.id)).toEqual([2, 1, 4]);
  });

  it('orders by chainage, and reverses it on request', () => {
    expect(selectInterchanges(PLACES, { sort: 'chainage-desc' }, nameOf).map((r) => r.id))
      .toEqual([4, 1, 2]);
  });

  it('orders by name when asked', () => {
    expect(selectInterchanges(PLACES, { sort: 'name' }, nameOf).map((r) => r.name))
      .toEqual(['Balu Bridge', 'Bhulta', 'Kanchan']);
  });

  it('drops a record with no name in any locale rather than rendering a blank row header', () => {
    expect(selectInterchanges(PLACES, {}, (r) => (r.id === 1 ? '' : NAMES[r.id])).map((r) => r.id))
      .toEqual([2, 4]);
  });

  it('normalises a facilities column that is not an array', () => {
    const [, , bridge] = selectInterchanges(PLACES, {}, nameOf);
    expect(bridge.facilities).toEqual([]);
  });

  it('survives a dead query and a malformed row', () => {
    expect(selectInterchanges(null, {}, nameOf)).toEqual([]);
    expect(selectInterchanges([null, 7], {}, nameOf)).toEqual([]);
  });

  it('declares every sort the block type offers', () => {
    expect(INTERCHANGE_SORTS).toEqual(['chainage', 'chainage-desc', 'name']);
  });
});

describe('visibleColumns', () => {
  it('shows every optional column on a block saved before the toggles existed', () => {
    // Defaulting an unrecognised value to VISIBLE keeps a published table from
    // silently losing a column.
    expect(visibleColumns({})).toEqual({
      chainage: true, type: true, connects: true, status: true, facilities: true,
    });
  });

  it('hides only what is set to "no"', () => {
    expect(visibleColumns({ showConnects: 'no', showFacilities: 'no' }))
      .toMatchObject({ connects: false, facilities: false, chainage: true });
  });

  it('covers exactly the optional columns, and location is not one of them', () => {
    expect(Object.keys(visibleColumns({}))).toEqual(OPTIONAL_COLUMNS);
    expect(OPTIONAL_COLUMNS).not.toContain('location');
  });
});

describe('the traffic condition ramp', () => {
  it('gives every condition a token colour and a ui_strings key', () => {
    for (const c of CONDITIONS) {
      expect(conditionColour(c)).toMatch(/^var\(--db-/);
      expect(conditionLabelKey(c)).toBe(`traffic_${c}`);
    }
  });

  it('reduces anything it does not recognise to "unknown"', () => {
    expect(conditionKey('constructor')).toBe('unknown');
    expect(conditionKey(undefined)).toBe('unknown');
    expect(conditionColour('nonsense')).toBe(conditionColour('unknown'));
  });

  it('uses no literal colour anywhere — every value is a design token', () => {
    for (const c of CONDITIONS) expect(conditionColour(c)).not.toMatch(/#[0-9a-f]/i);
  });
});

describe('selectInterchanges limit', () => {
  // The home page shows the first five interchanges and links to the route
  // page for the rest. The cut is applied AFTER the sort, so "first five"
  // follows the order the operator chose.
  const PLACES3 = [
    { id: 1, kind: 'interchange', chainage_m: 3000 },
    { id: 2, kind: 'toll_plaza', chainage_m: 1000 },
    { id: 3, kind: 'waypoint', chainage_m: 500 },
    { id: 4, kind: 'bridge', chainage_m: 9000 },
  ];
  const nameOf3 = (r) => `P${r.id}`;

  it('cuts after sorting', () => {
    expect(selectInterchanges(PLACES3, { limit: 2 }, nameOf3).map((r) => r.id)).toEqual([2, 1]);
    expect(selectInterchanges(PLACES3, { limit: 2, sort: 'chainage-desc' }, nameOf3).map((r) => r.id)).toEqual([4, 1]);
  });

  it('treats 0, blank, negative and garbage as "all"', () => {
    for (const limit of [0, '', -3, 'five', undefined, null]) {
      expect(selectInterchanges(PLACES3, { limit }, nameOf3), String(limit)).toHaveLength(3);
    }
    expect(rowLimit({ limit: '2.9' })).toBe(2);
  });

  it('never counts a survey waypoint toward the limit', () => {
    // The waypoint is dropped before the cut, so limit 3 still yields three
    // usable rows rather than two rows and a hole.
    expect(selectInterchanges(PLACES3, { limit: 3 }, nameOf3)).toHaveLength(3);
  });
});
