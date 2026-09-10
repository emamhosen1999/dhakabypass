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
 * a code may never change under an existing row, and a waypoint that still
 * defines a section may never be deleted.
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
  });
}

/**
 * Deleting a waypoint is deleting the endpoint of one or two corridor sections
 * and one of the points the map splits its colouring at, so it is refused while
 * anything still refers to the code. MySQL has no foreign key here (the
 * reference is by string, not by id), which is exactly why the check is
 * explicit and inside the transaction rather than left to the engine.
 */
export async function deleteWaypoint(id) {
  return withTransaction(async (q) => {
    const rows = await q('SELECT code FROM corridor_waypoints WHERE id = ? FOR UPDATE', [id]);
    if (!rows.length) throw validationError('This waypoint was already removed. Reload the page.');
    const { code } = rows[0];
    const used = await q(
      'SELECT from_code, to_code FROM corridor_sections WHERE from_code = ? OR to_code = ?',
      [code, code],
    );
    if (used.length) {
      const list = used.map((s) => `${s.from_code}-${s.to_code}`).join(', ');
      throw validationError(
        `Waypoint ${code} still defines ${used.length === 1 ? 'the corridor section' : 'corridor sections'} `
        + `${list}. Remove ${used.length === 1 ? 'that section' : 'those sections'} first.`,
      );
    }
    await q('DELETE FROM corridor_waypoints WHERE id = ?', [id]);
  });
}
