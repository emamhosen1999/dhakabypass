/**
 * The eight surveyed points that define the corridor's alignment.
 *
 * WHY THIS FILE EXISTS. `corridor_waypoints` had rows but no admin screen, so
 * six of the eight waypoints carried `names = NULL` and every intermediate
 * label on the public corridor map and in the `traffic-status` block rendered
 * as "Waypoint 4 — Waypoint 5". The only way to fix a visitor-facing name was
 * hand-written SQL. The records-vs-blocks rule ("change the fact in its record
 * screen") only holds if every record is reachable, so this is the reader and
 * writer behind /admin/corridor/waypoints.
 *
 * THERE IS NO `kind` COLUMN, and nothing in the readers looks for one. A
 * waypoint's identity is its `code`:
 *
 *   - `corridor_sections` names its endpoints by that string, and
 *     `UNIQUE KEY section(from_code, to_code)` is its whole identity.
 *   - `lib/corridor/map.js` splits the drawn centreline at every waypoint
 *     chainage so a section can be coloured, and labels each marker with
 *     `names[locale] || names.en`, falling back to `Waypoint <code>`.
 *   - `lib/blocks/trafficStatus.js` keys the same locale map by code.
 *
 * S and E are the terminals only by convention — nothing in the schema or the
 * readers privileges them, and the corridor's start and end are simply the
 * lowest and highest chainage. So this screen does not offer a "kind" field it
 * would have to invent, and instead protects the thing that IS load-bearing:
 * a code may never change under an existing row.
 *
 * SECTIONS FOLLOW THE WAYPOINTS. A corridor section is the stretch between two
 * consecutive waypoints, nothing more, and no screen ever created or removed
 * one — so an operator who renamed and moved waypoints into interchanges could
 * not remove a leftover one ("remove that section first", with no way to).
 * Every save and delete now rebuilds `corridor_sections` as the consecutive
 * pairs in chainage order, inside the same transaction: a pair that still
 * exists keeps its id and its recorded condition and speed, a new pair starts
 * as "not measured", and a pair that no longer exists is removed.
 *
 * Pure parsing and repository access only; the 'use server' actions in
 * app/admin/(dash)/corridor/alignment-actions.js call these.
 */

import { query, withTransaction } from '../db.js';
import { validationError } from '../errors.js';
import { parseChainage } from './chainage.js';
import { localeMap } from './form.js';

/** Letters and digits, up to the varchar(8) the column allows. */
export const WAYPOINT_CODE = /^[A-Za-z0-9]{1,8}$/;

const NUMBER = /^-?\d+(\.\d+)?$/;

/**
 * `decimal(10,7)`. Rounded rather than rejected: a coordinate pasted from a GPS
 * export with eight decimal places is a real coordinate, and the eighth place
 * is a millimetre. What is NOT rounded away is the range check below.
 */
function coordinate(value, label, limit) {
  const text = String(value ?? '').trim();
  if (!NUMBER.test(text) || Math.abs(Number(text)) > limit) {
    throw validationError(
      `${label} must be a number between -${limit} and ${limit}.`
      + (limit === 90 ? ' Check the columns are latitude then longitude.' : ''),
    );
  }
  return Number(text).toFixed(7);
}

/**
 * Reads one row of the waypoints form.
 *
 * `names` comes back NULL when all three languages are blank, not `{}`. An
 * unnamed waypoint is the honest state for six of the eight on this corridor
 * today, and an operator must be able to put one BACK to unnamed — the readers
 * then print `Waypoint 4`, which at least tells a driver it is a survey point
 * and not a place they can leave the road at.
 */
export function parseWaypoint(form) {
  const idText = String(form.get('id') ?? '').trim();
  if (idText && !/^[1-9]\d*$/.test(idText)) {
    throw validationError('That waypoint is not valid. Reload the page and try again.');
  }

  const code = String(form.get('code') ?? '').trim();
  if (!WAYPOINT_CODE.test(code)) {
    throw validationError('Use a waypoint code of up to 8 letters or digits, such as 4, S or E.');
  }

  const chainage_m = parseChainage(String(form.get('chainage_m') ?? ''));
  if (chainage_m === null) {
    throw validationError('Enter a chainage like K12+090, or a plain number of metres.');
  }

  const orderText = String(form.get('sort_order') ?? '').trim();
  if (!/^\d+$/.test(orderText) || Number(orderText) > 2147483647) {
    throw validationError('Sort order must be a whole number, 0 or more.');
  }

  const names = localeMap(form, 'name');
  if (!names.en && (names.bn || names.zh)) {
    throw validationError(
      'Add the English name too. Every other language falls back to it, so a waypoint '
      + 'named only in Bengali or Chinese still reads "Waypoint 4" to everyone else.',
    );
  }

  return {
    id: idText ? Number(idText) : null,
    code,
    lat: coordinate(form.get('lat'), 'Latitude', 90),
    lng: coordinate(form.get('lng'), 'Longitude', 180),
    chainage_m,
    sort_order: Number(orderText),
    names: Object.keys(names).length ? names : null,
  };
}

export async function listWaypointsForAdmin() {
  return (await query(
    `SELECT id, code, lat, lng, chainage_m, sort_order, names
       FROM corridor_waypoints ORDER BY sort_order, chainage_m, id`,
  )) || [];
}

/** `{ code: ['S-2', '2-3'] }` — which sections each waypoint currently defines. */
export async function sectionsByWaypoint() {
  const rows = (await query(
    'SELECT from_code, to_code FROM corridor_sections ORDER BY sort_order, id',
  )) || [];
  const out = {};
  for (const row of rows) {
    const label = `${row.from_code}-${row.to_code}`;
    for (const code of [row.from_code, row.to_code]) {
      (out[code] ||= []).push(label);
    }
  }
  return out;
}

/**
 * `corridor_sections` as the consecutive waypoint pairs, by chainage (the
 * order the map and the traffic table draw them). Pure: the desired rows and
 * which existing ids to keep, update or delete.
 */
export function planSections(waypoints, existing) {
  const ordered = [...(waypoints || [])].sort((a, b) => Number(a.chainage_m) - Number(b.chainage_m) || String(a.code).localeCompare(String(b.code)));
  const desired = [];
  for (let i = 1; i < ordered.length; i += 1) desired.push({ from_code: ordered[i - 1].code, to_code: ordered[i].code, sort_order: i - 1 });
  const byPair = new Map((existing || []).map((s) => [`${s.from_code}\u0000${s.to_code}`, s]));
  const keep = [];
  const insert = [];
  for (const d of desired) {
    const found = byPair.get(`${d.from_code}\u0000${d.to_code}`);
    if (found) { keep.push({ id: found.id, sort_order: d.sort_order }); byPair.delete(`${d.from_code}\u0000${d.to_code}`); }
    else insert.push(d);
  }
  return { keep, insert, remove: [...byPair.values()].map((s) => s.id) };
}

async function syncSections(q) {
  const waypoints = await q('SELECT code, chainage_m FROM corridor_waypoints FOR UPDATE');
  const existing = await q('SELECT id, from_code, to_code FROM corridor_sections FOR UPDATE');
  const plan = planSections(waypoints, existing);
  for (const id of plan.remove) await q('DELETE FROM corridor_sections WHERE id = ?', [id]);
  for (const k of plan.keep) await q('UPDATE corridor_sections SET sort_order = ? WHERE id = ?', [k.sort_order, k.id]);
  for (const d of plan.insert) {
    await q('INSERT INTO corridor_sections (from_code, to_code, sort_order) VALUES (?, ?, ?)', [d.from_code, d.to_code, d.sort_order]);
  }
  return plan;
}

export async function saveWaypoint(input) {
  const names = input.names ? JSON.stringify(input.names) : null;
  return withTransaction(async (q) => {
    if (input.id) {
      const rows = await q('SELECT id, code FROM corridor_waypoints WHERE id = ? FOR UPDATE', [input.id]);
      if (!rows.length) throw validationError('This waypoint no longer exists. Reload the page.');
      if (rows[0].code !== input.code) {
        throw validationError(
          `A waypoint code cannot be changed. Corridor sections refer to ${rows[0].code} by `
          + 'code, and renaming it here would leave them pointing at nothing. Add a new '
          + 'waypoint and move the sections instead.',
        );
      }
      await q(
        `UPDATE corridor_waypoints SET lat = ?, lng = ?, chainage_m = ?, sort_order = ?, names = ?
          WHERE id = ?`,
        [input.lat, input.lng, input.chainage_m, input.sort_order, names, input.id],
      );
      await syncSections(q);
      return;
    }
    const clash = await q('SELECT id FROM corridor_waypoints WHERE code = ?', [input.code]);
    if (clash.length) {
      throw validationError(`Waypoint code ${input.code} is already in use. Codes are unique.`);
    }
    await q(
      `INSERT INTO corridor_waypoints (code, lat, lng, chainage_m, sort_order, names)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [input.code, input.lat, input.lng, input.chainage_m, input.sort_order, names],
    );
    await syncSections(q);
  });
}

/**
 * Deleting a waypoint joins the two sections either side of it into one: the
 * sections are rebuilt from the remaining waypoints in the same transaction.
 * A corridor needs two ends, so the last two waypoints cannot be removed.
 */
export async function deleteWaypoint(id) {
  return withTransaction(async (q) => {
    const rows = await q('SELECT code FROM corridor_waypoints WHERE id = ? FOR UPDATE', [id]);
    if (!rows.length) throw validationError('This waypoint was already removed. Reload the page.');
    const [{ n }] = await q('SELECT COUNT(*) AS n FROM corridor_waypoints');
    if (Number(n) <= 2) {
      throw validationError('The corridor needs a start and an end, so the last two waypoints cannot be removed.');
    }
    await q('DELETE FROM corridor_waypoints WHERE id = ?', [id]);
    await syncSections(q);
  });
}
