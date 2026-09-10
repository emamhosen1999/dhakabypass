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
// `section(from_code,to_code)`), so the two guards that matter are: a code may
// never change under an existing row, and a waypoint that still defines a
// section may never be deleted.

import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../lib/db.js', () => ({ query: vi.fn(), withTransaction: vi.fn() }));

import { withTransaction } from '../../lib/db.js';
import {
  parseWaypoint, saveWaypoint, deleteWaypoint, WAYPOINT_CODE,
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

describe('saveWaypoint', () => {
  it('updates an existing row and stores names as JSON', async () => {
    const q = vi.fn()
      .mockResolvedValueOnce([{ id: 4, code: '4' }]) // SELECT ... FOR UPDATE
      .mockResolvedValueOnce({ affectedRows: 1 });
    withTransaction.mockImplementation((fn) => fn(q));

    await saveWaypoint({
      id: 4, code: '4', lat: '23.93', lng: '90.45', chainage_m: 12090, sort_order: 3,
      names: { en: 'Bhulta' },
    });

    const [sql, params] = q.mock.calls[1];
    expect(sql).toMatch(/UPDATE corridor_waypoints/);
    expect(params).toContain('{"en":"Bhulta"}');
    expect(params.at(-1)).toBe(4);
  });

  it('writes SQL NULL, not the string "null", when a row is unnamed', async () => {
    const q = vi.fn()
      .mockResolvedValueOnce([{ id: 4, code: '4' }])
      .mockResolvedValueOnce({ affectedRows: 1 });
    withTransaction.mockImplementation((fn) => fn(q));

    await saveWaypoint({
      id: 4, code: '4', lat: '23.93', lng: '90.45', chainage_m: 12090, sort_order: 3, names: null,
    });

    // The CHECK constraint is (names IS NULL OR json_valid(names)); 'null' is
    // valid JSON and would pass, but every reader would then see a named row.
    expect(q.mock.calls[1][1]).toContain(null);
    expect(q.mock.calls[1][1]).not.toContain('null');
  });

  it('refuses to change the code of an existing waypoint', async () => {
    const q = vi.fn().mockResolvedValueOnce([{ id: 4, code: '4' }]);
    withTransaction.mockImplementation((fn) => fn(q));
    await expect(saveWaypoint({
      id: 4, code: '9', lat: '23.93', lng: '90.45', chainage_m: 12090, sort_order: 3, names: null,
    })).rejects.toThrow(/code/i);
    expect(q).toHaveBeenCalledTimes(1);
  });

  it('reports a row that has gone rather than silently inserting one', async () => {
    const q = vi.fn().mockResolvedValueOnce([]);
    withTransaction.mockImplementation((fn) => fn(q));
    await expect(saveWaypoint({
      id: 99, code: '9', lat: '23.93', lng: '90.45', chainage_m: 1, sort_order: 0, names: null,
    })).rejects.toThrow(/no longer exists/i);
  });

  it('refuses a new waypoint whose code is already taken', async () => {
    const q = vi.fn().mockResolvedValueOnce([{ id: 4 }]);
    withTransaction.mockImplementation((fn) => fn(q));
    await expect(saveWaypoint({
      id: null, code: '4', lat: '23.93', lng: '90.45', chainage_m: 1, sort_order: 0, names: null,
    })).rejects.toThrow(/already/i);
  });

  it('inserts a new waypoint when the code is free', async () => {
    const q = vi.fn()
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce({ insertId: 9 });
    withTransaction.mockImplementation((fn) => fn(q));
    await saveWaypoint({
      id: null, code: '9', lat: '23.93', lng: '90.45', chainage_m: 1, sort_order: 8, names: null,
    });
    expect(q.mock.calls[1][0]).toMatch(/INSERT INTO corridor_waypoints/);
  });
});

describe('deleteWaypoint', () => {
  it('refuses while a corridor section still refers to the code', async () => {
    const q = vi.fn()
      .mockResolvedValueOnce([{ code: '4' }])
      .mockResolvedValueOnce([{ from_code: '3', to_code: '4' }, { from_code: '4', to_code: '5' }]);
    withTransaction.mockImplementation((fn) => fn(q));
    await expect(deleteWaypoint(4)).rejects.toThrow(/section/i);
    expect(q).toHaveBeenCalledTimes(2); // never reached the DELETE
  });

  it('deletes an unreferenced waypoint', async () => {
    const q = vi.fn()
      .mockResolvedValueOnce([{ code: '9' }])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce({ affectedRows: 1 });
    withTransaction.mockImplementation((fn) => fn(q));
    await deleteWaypoint(9);
    expect(q.mock.calls[2][0]).toMatch(/DELETE FROM corridor_waypoints/);
  });

  it('reports a waypoint that has already gone', async () => {
    const q = vi.fn().mockResolvedValueOnce([]);
    withTransaction.mockImplementation((fn) => fn(q));
    await expect(deleteWaypoint(9)).rejects.toThrow(/already removed/i);
  });
});
