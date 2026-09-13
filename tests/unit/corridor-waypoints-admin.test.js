// tests/unit/corridor-waypoints-admin.test.js
//
// `corridor_waypoints` had rows but no screen, so six of the eight waypoints on
// this corridor carried names = NULL and every intermediate section label on the
// public map and in the `traffic-status` block rendered as "Waypoint 4 —
// Waypoint 5". This file pins the validation and the repository guards behind
// the screen that fixes that.
//
// The table has NO `kind` column. A waypoint's identity is its `code`, and
// `corridor_sections` refers to it by that string (UNIQUE KEY
// `section(from_code,to_code)`), so a code may never change under an existing
// row — and the sections are rebuilt from the waypoints on every save and
// delete, so a waypoint can always be removed.

import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../lib/db.js', () => ({ query: vi.fn(), withTransaction: vi.fn() }));

import { withTransaction } from '../../lib/db.js';
import {
  parseWaypoint, saveWaypoint, deleteWaypoint, WAYPOINT_CODE, planSections,
} from '../../lib/corridor/waypoints-admin.js';

const form = (values) => new Map(Object.entries(values));

const valid = {
  id: '4',
  code: '4',
  lat: '23.9302110',
  lng: '90.4526550',
  chainage_m: 'K12+090',
  sort_order: '3',
  'name.en': 'Bhulta',
};

beforeEach(() => vi.clearAllMocks());

describe('parseWaypoint', () => {
  it('reads a full row, in metres, with a locale map', () => {
    expect(parseWaypoint(form({ ...valid, 'name.bn': 'ভুলতা', 'name.zh': '布尔塔' }))).toEqual({
      id: 4,
      code: '4',
      lat: '23.9302110',
      lng: '90.4526550',
      chainage_m: 12090,
      sort_order: 3,
      names: { en: 'Bhulta', bn: 'ভুলতা', zh: '布尔塔' },
    });
  });

  it('accepts a plain metre count as well as K-notation', () => {
    expect(parseWaypoint(form({ ...valid, chainage_m: '12090' })).chainage_m).toBe(12090);
  });

  it('returns names as null when all three languages are blank', () => {
    // The restorable state. Six waypoints are legitimately unnamed today and an
    // operator must be able to put one back, not just fill one in.
    expect(parseWaypoint(form({ ...valid, 'name.en': '' })).names).toBeNull();
  });

  it('refuses a translation with no English to fall back to', () => {
    // Every reader resolves names[locale] || names.en. A bn-only row shows the
    // Bengali name to a Chinese reader, or "Waypoint 4" — never the right thing.
    expect(() => parseWaypoint(form({ ...valid, 'name.en': '', 'name.bn': 'ভুলতা' })))
      .toThrow(/English/);
  });

  it('treats a new row as one with no id', () => {
    const { id } = parseWaypoint(form({ ...valid, id: '' }));
    expect(id).toBeNull();
  });

  it.each([
    ['', /code/i],
    ['   ', /code/i],
    ['toolongcode', /code/i],
    ['S E', /code/i],
    ['4;DROP', /code/i],
  ])('rejects the code %j', (code, message) => {
    expect(() => parseWaypoint(form({ ...valid, code }))).toThrow(message);
  });

  it.each(['S', 'E', '4', 'W12'])('accepts the real code %s', (code) => {
    expect(WAYPOINT_CODE.test(code)).toBe(true);
    expect(parseWaypoint(form({ ...valid, code })).code).toBe(code);
  });

  it.each(['', '91', '-90.5', 'abc', 'NaN', '23,9'])('rejects latitude %j', (lat) => {
    expect(() => parseWaypoint(form({ ...valid, lat }))).toThrow(/[Ll]atitude/);
  });

  it.each(['', '181', '-180.5', 'abc'])('rejects longitude %j', (lng) => {
    expect(() => parseWaypoint(form({ ...valid, lng }))).toThrow(/[Ll]ongitude/);
  });

  it('rejects a swapped coordinate pair rather than storing a point in the sea', () => {
    // Pasting a GeoJSON "lng, lat" pair is the likeliest coordinate mistake on
    // this corridor: 90.45 is not a latitude anywhere on Earth.
    expect(() => parseWaypoint(form({ ...valid, lat: '90.4526550', lng: '23.9302110' })))
      .toThrow(/[Ll]atitude/);
  });

  it.each(['', 'K12', '-1', '1.5', 'soon'])('rejects chainage %j', (chainage_m) => {
    expect(() => parseWaypoint(form({ ...valid, chainage_m }))).toThrow(/chainage/i);
  });

  it.each(['-1', '1.5', 'first'])('rejects sort order %j', (sort_order) => {
    expect(() => parseWaypoint(form({ ...valid, sort_order }))).toThrow(/order/i);
  });
});

/**
 * A fake transaction that answers by SQL text, so the tests read as the
 * sequence of things the repository does rather than as call indexes.
 */
function fakeDb({ waypoints = [], sections = [], lock = [], count } = {}) {
  const state = { waypoints: [...waypoints], sections: sections.map((x) => ({ ...x })), nextId: 100 };
  const q = vi.fn(async (sql, params = []) => {
    if (/SELECT id, code FROM corridor_waypoints WHERE id = \? FOR UPDATE/.test(sql)) return lock;
    if (/SELECT code FROM corridor_waypoints WHERE id = \? FOR UPDATE/.test(sql)) return lock;
    if (/SELECT id FROM corridor_waypoints WHERE code = \?/.test(sql)) return state.waypoints.filter((w) => w.code === params[0]);
    if (/SELECT COUNT\(\*\) AS n FROM corridor_waypoints/.test(sql)) return [{ n: count ?? state.waypoints.length }];
    if (/SELECT code, chainage_m FROM corridor_waypoints/.test(sql)) return state.waypoints;
    if (/SELECT id, from_code, to_code FROM corridor_sections/.test(sql)) return state.sections;
    if (/INSERT INTO corridor_waypoints/.test(sql)) { state.waypoints.push({ code: params[0], chainage_m: params[3] }); return { insertId: 9 }; }
    if (/DELETE FROM corridor_waypoints/.test(sql)) { state.waypoints = state.waypoints.filter((w) => w.id !== params[0]); return { affectedRows: 1 }; }
    if (/DELETE FROM corridor_sections/.test(sql)) { state.sections = state.sections.filter((x) => x.id !== params[0]); return {}; }
    if (/INSERT INTO corridor_sections/.test(sql)) { state.sections.push({ id: state.nextId++, from_code: params[0], to_code: params[1] }); return {}; }
    return { affectedRows: 1 };
  });
  withTransaction.mockImplementation((fn) => fn(q));
  return { q, state };
}

describe('planSections', () => {
  it('pairs consecutive waypoints by chainage, keeping pairs that still exist', () => {
    const plan = planSections(
      [{ code: 'E', chainage_m: 47611 }, { code: 'S', chainage_m: 0 }, { code: '6', chainage_m: 40000 }],
      [{ id: 1, from_code: 'S', to_code: '6' }, { id: 6, from_code: '6', to_code: '7' }, { id: 7, from_code: '7', to_code: 'E' }],
    );
    expect(plan).toEqual({ keep: [{ id: 1, sort_order: 0 }], insert: [{ from_code: '6', to_code: 'E', sort_order: 1 }], remove: [6, 7] });
  });
});

describe('saveWaypoint', () => {
  it('updates an existing row, stores names as JSON, and rebuilds the sections', async () => {
    const { q } = fakeDb({ lock: [{ id: 4, code: '4' }], waypoints: [{ id: 4, code: '4', chainage_m: 12090 }] });
    await saveWaypoint({
      id: 4, code: '4', lat: '23.93', lng: '90.45', chainage_m: 12090, sort_order: 3,
      names: { en: 'Bhulta' },
    });
    const [, params] = q.mock.calls.find(([x]) => /UPDATE corridor_waypoints/.test(x));
    expect(params).toContain('{"en":"Bhulta"}');
    expect(params.at(-1)).toBe(4);
    expect(q.mock.calls.some(([x]) => /FROM corridor_sections/.test(x))).toBe(true);
  });

  it('writes SQL NULL, not the string "null", when a row is unnamed', async () => {
    const { q } = fakeDb({ lock: [{ id: 4, code: '4' }] });
    await saveWaypoint({
      id: 4, code: '4', lat: '23.93', lng: '90.45', chainage_m: 12090, sort_order: 3, names: null,
    });
    // The CHECK constraint is (names IS NULL OR json_valid(names)); 'null' is
    // valid JSON and would pass, but every reader would then see a named row.
    const params = q.mock.calls.find(([x]) => /UPDATE corridor_waypoints/.test(x))[1];
    expect(params).toContain(null);
    expect(params).not.toContain('null');
  });

  it('refuses to change the code of an existing waypoint', async () => {
    const { q } = fakeDb({ lock: [{ id: 4, code: '4' }] });
    await expect(saveWaypoint({
      id: 4, code: '9', lat: '23.93', lng: '90.45', chainage_m: 12090, sort_order: 3, names: null,
    })).rejects.toThrow(/code/i);
    expect(q).toHaveBeenCalledTimes(1);
  });

  it('reports a row that has gone rather than silently inserting one', async () => {
    fakeDb({ lock: [] });
    await expect(saveWaypoint({
      id: 99, code: '9', lat: '23.93', lng: '90.45', chainage_m: 1, sort_order: 0, names: null,
    })).rejects.toThrow(/no longer exists/i);
  });

  it('refuses a new waypoint whose code is already taken', async () => {
    fakeDb({ waypoints: [{ id: 4, code: '4', chainage_m: 1 }] });
    await expect(saveWaypoint({
      id: null, code: '4', lat: '23.93', lng: '90.45', chainage_m: 1, sort_order: 0, names: null,
    })).rejects.toThrow(/already/i);
  });

  it('inserts a new waypoint and splits the section it falls in', async () => {
    const { state } = fakeDb({
      waypoints: [{ id: 1, code: 'S', chainage_m: 0 }, { id: 2, code: 'E', chainage_m: 47611 }],
      sections: [{ id: 1, from_code: 'S', to_code: 'E' }],
    });
    await saveWaypoint({ id: null, code: '9', lat: '23.93', lng: '90.45', chainage_m: 20000, sort_order: 8, names: null });
    expect(state.sections.map((x) => `${x.from_code}-${x.to_code}`)).toEqual(['S-9', '9-E']);
  });
});

describe('deleteWaypoint', () => {
  it('removes a waypoint that ends two sections by joining them into one', async () => {
    const { state } = fakeDb({
      lock: [{ code: '7' }],
      waypoints: [{ id: 6, code: '6', chainage_m: 40000 }, { id: 7, code: '7', chainage_m: 41371 }, { id: 8, code: 'E', chainage_m: 47611 }],
      sections: [{ id: 6, from_code: '6', to_code: '7' }, { id: 7, from_code: '7', to_code: 'E' }],
    });
    await deleteWaypoint(7);
    expect(state.waypoints.map((w) => w.code)).toEqual(['6', 'E']);
    expect(state.sections.map((x) => `${x.from_code}-${x.to_code}`)).toEqual(['6-E']);
  });

  it('refuses to remove one of the last two waypoints', async () => {
    const { q } = fakeDb({ lock: [{ code: 'E' }], count: 2 });
    await expect(deleteWaypoint(8)).rejects.toThrow(/start and an end/i);
    expect(q.mock.calls.some(([x]) => /DELETE/.test(x))).toBe(false);
  });

  it('reports a waypoint that has already gone', async () => {
    fakeDb({ lock: [] });
    await expect(deleteWaypoint(9)).rejects.toThrow(/already removed/i);
  });
});
