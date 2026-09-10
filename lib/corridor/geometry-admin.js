/**
 * The corridor's drawn centreline — `corridor_geometry` and
 * `corridor_geometry_source`.
 *
 * WHY THIS FILE EXISTS. Both tables had rows but no admin screen. Until now the
 * only way to change the line the public map draws was to run
 * `scripts/import-corridor-geometry.mjs` on a host with outbound network, or to
 * write SQL by hand.
 *
 * WHY IT REPLACES THE WHOLE LINE RATHER THAN EDITING ROWS. There are 166 points
 * today. A row editor over them would be unusable, and worse, it would let an
 * operator nudge one coordinate and silently bend the road: the map splits this
 * line at every waypoint chainage to colour the sections, and measures its
 * scale bar from the distance between its first and last point, so a single bad
 * row changes what several other panels claim. The line is one fact, so it is
 * written as one fact.
 *
 * WHAT STOPS AN OPERATOR BREAKING THE MAP. Exactly the acceptance tests
 * scripts/import-corridor-geometry.mjs already refuses an import on, moved here
 * so the screen applies them too rather than inventing a second, weaker
 * standard:
 *
 *   1. the length must be within 5% of the reference chainage the surveyed
 *      waypoints define, and
 *   2. every surveyed waypoint must lie within 250 m of the line.
 *
 * Those two together reject the failures that look plausible — a parallel
 * service road, one carriageway of a dual pair, a fragment of the old highway.
 * A third check is added here that the script does not need, because a script
 * builds its line by stitching a road graph while an operator pastes one: no
 * two consecutive points may be more than 2 km apart, so a missing stretch is
 * refused rather than drawn as a straight line across whatever lies between.
 *
 * A refusal never writes anything. The corridor keeps the alignment it has,
 * which is the safe direction: a wrong centreline is far worse than the honest
 * waypoint polyline it would replace.
 */

import { query, withTransaction } from '../db.js';
import { validationError } from '../errors.js';
import { haversineMetres } from './map.js';
import { chainages, nearestOnLine } from './geometry-import.js';

/** Roughly 30x the largest real import (166 points), and far under any limit
 *  that would matter to MySQL — a paste larger than this is a mistake. */
export const MAX_POINTS = 5000;
export const MAX_WAYPOINT_OFFSET_M = 250;
export const MAX_LENGTH_DRIFT = 0.05;
export const MAX_GAP_M = 2000;

/** `corridor_geometry_source.source`. `waypoints` is not offered as a choice:
 *  it is the state the table returns to when the imported line is removed. */
export const GEOMETRY_SOURCES = ['osm', 'survey', 'operator'];
export const SOURCE_LABELS = {
  osm: 'OpenStreetMap',
  survey: 'Surveyed alignment',
  operator: 'Operator-supplied',
  waypoints: 'Surveyed waypoints only (schematic)',
};

const NUMBER = /^-?\d+(\.\d+)?$/;
const round = (n, digits = 0) => {
  const f = 10 ** digits;
  return Math.round(n * f) / f;
};

/**
 * Reads a pasted coordinate list: one point per line, `lat, lng`.
 *
 * Blank lines and `#` comments are skipped, and a third column (a chainage
 * carried over from an export) is ignored — chainage is recomputed from the
 * geometry below, never trusted from the paste, so the distances the map
 * reports always match the line it draws.
 *
 * Errors name the LINE NUMBER. A 166-line paste that fails anonymously is a
 * paste an operator cannot fix.
 */
export function parseCoordinates(text) {
  const points = [];
  const lines = String(text ?? '').split(/\r?\n/);

  lines.forEach((raw, i) => {
    const line = raw.replace(/#.*$/, '').trim();
    if (!line) return;
    const parts = line.split(/[\s,]+/).filter(Boolean);
    const where = `Line ${i + 1} ("${raw.trim().slice(0, 40)}")`;
    if (parts.length < 2 || !NUMBER.test(parts[0]) || !NUMBER.test(parts[1])) {
      throw validationError(`${where} is not a coordinate. Use one point per line, latitude then longitude.`);
    }
    const lat = Number(parts[0]);
    const lng = Number(parts[1]);
    if (Math.abs(lat) > 90) {
      throw validationError(
        `${where} has a latitude of ${lat}, which is not a latitude. `
        + 'GeoJSON writes longitude first — check the column order.',
      );
    }
    if (Math.abs(lng) > 180) {
      throw validationError(`${where} has a longitude of ${lng}, which is out of range.`);
    }
    points.push({ lat, lng });
  });

  if (points.length < 2) {
    throw validationError('A corridor alignment needs at least two points, one per line.');
  }
  if (points.length > MAX_POINTS) {
    throw validationError(
      `That is ${points.length} points. The corridor alignment is limited to ${MAX_POINTS}.`,
    );
  }
  return points;
}

/**
 * Measures a candidate alignment and lists everything wrong with it.
 *
 * ALWAYS RETURNS — it never throws. The screen has to be able to SHOW an
 * operator the measurements behind a refusal, which it cannot do if the
 * measuring itself blows up.
 *
 * @param points     `[{ lat, lng }]`
 * @param waypoints  rows from `corridor_waypoints`; the reference the line is
 *                   judged against. An empty list means no judgement is
 *                   possible, not that the line passed.
 */
export function checkAlignment(points, waypoints = []) {
  const measured = chainages(Array.isArray(points) ? points : []);
  const lengthM = measured.length ? measured[measured.length - 1].chainage_m : 0;

  const refs = (Array.isArray(waypoints) ? waypoints : [])
    .filter((w) => w && NUMBER.test(String(w.lat)) && NUMBER.test(String(w.lng)))
    .map((w) => ({ code: String(w.code), lat: Number(w.lat), lng: Number(w.lng), chainage_m: Number(w.chainage_m) || 0 }));

  const referenceM = Math.max(0, ...refs.map((w) => w.chainage_m));
  const driftPct = referenceM ? round((Math.abs(lengthM - referenceM) / referenceM) * 100, 1) : 0;

  const offsets = measured.length >= 2
    ? refs.map((w) => ({ code: w.code, metres: Math.round(nearestOnLine(measured, w).metres) }))
    : refs.map((w) => ({ code: w.code, metres: Infinity }));

  let maxGapM = 0;
  let gapAt = 0;
  for (let i = 1; i < measured.length; i += 1) {
    const gap = haversineMetres(measured[i - 1], measured[i]);
    if (gap > maxGapM) { maxGapM = gap; gapAt = i; }
  }
  maxGapM = Math.round(maxGapM);

  const problems = [];
  if (referenceM && driftPct > MAX_LENGTH_DRIFT * 100) {
    problems.push(
      `The line's length is ${round(lengthM / 1000, 3)} km, which differs from the corridor's `
      + `reference chainage of ${round(referenceM / 1000, 3)} km by ${driftPct}% `
      + `(limit ${MAX_LENGTH_DRIFT * 100}%).`,
    );
  }
  for (const offset of offsets) {
    if (offset.metres > MAX_WAYPOINT_OFFSET_M) {
      problems.push(
        `Waypoint ${offset.code} is ${Number.isFinite(offset.metres) ? `${offset.metres} m` : 'nowhere near'} `
        + `from the line (limit ${MAX_WAYPOINT_OFFSET_M} m).`,
      );
    }
  }
  if (maxGapM > MAX_GAP_M) {
    problems.push(
      `Points ${gapAt} and ${gapAt + 1} are ${maxGapM} m apart (limit ${MAX_GAP_M} m). `
      + 'A gap that size is drawn as a straight line across whatever lies between them.',
    );
  }

  return { points: measured, lengthM, referenceM, driftPct, offsets, maxGapM, problems };
}

/**
 * The whole geometry form: where the line came from, the credit it must carry,
 * the deliberate confirmation, and the line itself.
 *
 * Ordered cheapest-first so an operator is told about a missing attribution
 * before a 166-line paste is measured.
 */
export function parseAlignment(form, waypoints = []) {
  const source = String(form.get('source') ?? '').trim();
  if (!GEOMETRY_SOURCES.includes(source)) {
    throw validationError(`Choose a listed geometry source: ${GEOMETRY_SOURCES.join(', ')}.`);
  }
  const attribution = String(form.get('attribution') ?? '').trim().slice(0, 191);
  if (source === 'osm' && !attribution) {
    throw validationError(
      'OpenStreetMap data must carry its attribution. Enter "© OpenStreetMap contributors".',
    );
  }
  if (form.get('confirm') !== 'on') {
    throw validationError(
      'Tick the confirmation. Replacing the alignment redraws the public corridor map, '
      + 'its section colouring and its scale bar.',
    );
  }

  const checked = checkAlignment(parseCoordinates(form.get('coordinates')), waypoints);
  if (checked.problems.length) {
    throw validationError(`The corridor keeps its current alignment. ${checked.problems.join(' ')}`);
  }
  return {
    source,
    attribution,
    points: checked.points,
    lengthM: checked.lengthM,
    driftPct: checked.driftPct,
  };
}

/** What the geometry screen shows before anything is changed. */
export async function getGeometryOverview() {
  const [stats] = (await query(
    `SELECT COUNT(*) AS points, MIN(chainage_m) AS first_m, MAX(chainage_m) AS length_m
       FROM corridor_geometry`,
  )) || [{}];
  const [source] = (await query(
    `SELECT source, attribution, points, length_m, imported_at
       FROM corridor_geometry_source WHERE id = 1`,
  )) || [];
  return {
    points: Number(stats?.points) || 0,
    lengthM: Number(stats?.length_m) || 0,
    source: source || null,
  };
}

/**
 * The whole line, in draw order.
 *
 * The screen prefills its textarea with this rather than showing an empty box:
 * an operator adjusting one bend needs to start from what is stored, and an
 * empty box beside a "replace the alignment" button invites replacing 166
 * surveyed points with three typed ones.
 */
export async function listGeometryForAdmin() {
  return (await query(
    'SELECT seq, lat, lng, chainage_m FROM corridor_geometry ORDER BY seq',
  )) || [];
}

/** `23.9867818, 90.3623354` per line — the format parseCoordinates() reads. */
export function toCoordinateText(points) {
  return (points || []).map((p) => `${p.lat}, ${p.lng}`).join('\n');
}

/**
 * Chunked because `query`/`withTransaction` go through `conn.execute`, which
 * prepares the statement and therefore cannot take mysql2's nested-array bulk
 * `VALUES ?` form. A fixed chunk size keeps the number of DISTINCT prepared
 * statements at two (a full chunk and one remainder) however long the line is.
 */
const CHUNK = 100;

export async function replaceGeometry({ points, source, attribution = '', lengthM }) {
  if (!Array.isArray(points) || points.length < 2) {
    throw validationError('A corridor alignment needs at least two points.');
  }
  return withTransaction(async (q) => {
    // A partial line is not a line: this is one transaction or nothing.
    await q('DELETE FROM corridor_geometry');
    for (let start = 0; start < points.length; start += CHUNK) {
      const chunk = points.slice(start, start + CHUNK);
      const params = [];
      chunk.forEach((p, i) => {
        params.push(start + i, Number(p.lat), Number(p.lng), Math.round(Number(p.chainage_m) || 0));
      });
      await q(
        'INSERT INTO corridor_geometry (seq, lat, lng, chainage_m) VALUES '
        + chunk.map(() => '(?, ?, ?, ?)').join(', '),
        params,
      );
    }
    await q(
      `INSERT INTO corridor_geometry_source (id, source, attribution, points, length_m)
       VALUES (1, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE source = VALUES(source), attribution = VALUES(attribution),
         points = VALUES(points), length_m = VALUES(length_m), imported_at = CURRENT_TIMESTAMP`,
      [source, attribution, points.length, Math.round(Number(lengthM) || 0)],
    );
  });
}

/**
 * Removes the imported centreline. Not a destructive act in the sense the word
 * usually carries here: the map's documented fallback is to draw the surveyed
 * waypoint polyline and label itself a schematic, which is honest. The row in
 * `corridor_geometry_source` is kept and set back to `waypoints` so the map can
 * still tell a reader what it is showing.
 */
export async function clearGeometry() {
  return withTransaction(async (q) => {
    await q('DELETE FROM corridor_geometry');
    await q(
      `INSERT INTO corridor_geometry_source (id, source, attribution, points, length_m)
       VALUES (1, ?, ?, 0, 0)
       ON DUPLICATE KEY UPDATE source = VALUES(source), attribution = VALUES(attribution),
         points = 0, length_m = 0, imported_at = CURRENT_TIMESTAMP`,
      ['waypoints', ''],
    );
  });
}
