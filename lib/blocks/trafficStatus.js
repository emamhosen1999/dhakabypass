/**
 * The rows the `traffic-status` block prints, built from `corridor_sections`,
 * `corridor_waypoints` and the active `advisories`.
 *
 * Pure: no database, no React, no translation. The component supplies the
 * names (waypoints carry a per-locale JSON name) and turns a condition key
 * into a word; this file decides WHICH sections appear and in what order,
 * which is the part worth testing without a browser or a database.
 */

import { conditionKey, CONDITION_RANK } from '../corridor/conditions.js';

const str = (value) => (typeof value === 'string' ? value.trim() : '');

function usableDate(value) {
  if (value === null || value === undefined || value === '') return null;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isFinite(d.getTime()) ? d : null;
}

/**
 * How a section is named in a block's filter list: `from_code-to_code`.
 *
 * `corridor_sections` has no name of its own — its identity is the pair of
 * waypoint codes, which is also its UNIQUE key (db/sql/01-schema.sql). So the
 * operator filters on the same pair the sections admin screen shows them,
 * rather than on an `id` that means nothing on either screen and changes if
 * the corridor is ever re-imported.
 */
export function sectionCode(section) {
  return `${str(section && section.from_code)}-${str(section && section.to_code)}`;
}

export const SECTION_SORTS = ['corridor', 'worst-first'];

/**
 * @param sections  rows from listCorridorSections() (already freshness-checked)
 * @param data      the block's config: `sections` (list of codes; empty = all)
 *                  and `sort`
 *
 * The filter is matched case-insensitively against `sectionCode`, and an entry
 * that matches nothing is simply absent — a code for a section that has since
 * been renamed must not empty the whole table.
 *
 * A filter that matches NO section returns [], which the component renders as
 * the authored empty message rather than falling back to every section. The
 * same rule as selectRates(): a block configured for one stretch of road must
 * never quietly report on the whole corridor.
 */
export function selectSections(sections, data = {}) {
  if (!Array.isArray(sections)) return [];
  const rows = sections
    .filter((s) => s && typeof s === 'object')
    .map((s, i) => ({
      id: s.id === undefined || s.id === null ? `s${i}` : s.id,
      code: sectionCode(s),
      fromCode: str(s.from_code),
      toCode: str(s.to_code),
      condition: conditionKey(s.condition_key),
      // A speed of 0 is not a measurement, it is a missing one arriving as a
      // zero; treated as absent so the cell reads "—" rather than "0 km/h",
      // which a reader would take as "stationary traffic".
      speed: Number(s.avg_speed_kmh) > 0 ? Number(s.avg_speed_kmh) : null,
      // Never `undefined`, and never an Invalid Date. It arrives as a Date
      // from mysql2 but as an ISO STRING once it has been through
      // unstable_cache's JSON round trip, and as null on the six of seven
      // sections nobody has measured yet.
      measuredAt: usableDate(s.measured_at),
      sortOrder: Number(s.sort_order) || 0,
    }));

  const wanted = Array.isArray(data.sections)
    ? data.sections.map((c) => str(c).toLowerCase()).filter(Boolean)
    : [];
  const filtered = wanted.length > 0
    ? rows.filter((r) => wanted.includes(r.code.toLowerCase()))
    : rows;

  const sort = SECTION_SORTS.includes(data.sort) ? data.sort : 'corridor';
  const ordered = [...filtered];
  if (sort === 'worst-first') {
    // Stable within a condition: sections of equal condition stay in corridor
    // order, so a driver reading down the list still travels north to south.
    ordered.sort((a, b) => (CONDITION_RANK[a.condition] - CONDITION_RANK[b.condition])
      || (a.sortOrder - b.sortOrder));
  } else {
    ordered.sort((a, b) => a.sortOrder - b.sortOrder);
  }
  return ordered;
}

/** The conditions actually present, in ramp order — a legend listing states
 *  that never appear is noise (the same rule buildStripModel already applies). */
export function conditionsPresent(rows) {
  const seen = new Set((rows || []).map((r) => r.condition));
  return [...seen].sort((a, b) => CONDITION_RANK[a] - CONDITION_RANK[b]);
}

/**
 * `{ code: { en, bn, zh } }` from the waypoint rows.
 *
 * `names` is a JSON column, which mysql2 may hand back either parsed or as a
 * string depending on the driver and the server (MariaDB has no real JSON
 * type — see db/sql/README.md), and it is NULL for six of the eight waypoints
 * on this corridor today. All three cases resolve to an empty map rather than
 * throwing, so the component falls through to its own "Waypoint 4" wording.
 */
export function waypointNames(waypoints) {
  const out = {};
  for (const w of Array.isArray(waypoints) ? waypoints : []) {
    const code = str(w && w.code);
    if (!code) continue;
    let names = w.names;
    if (typeof names === 'string') {
      try { names = JSON.parse(names); } catch { names = null; }
    }
    out[code] = names && typeof names === 'object' && !Array.isArray(names) ? names : {};
  }
  return out;
}
