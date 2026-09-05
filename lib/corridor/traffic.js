/**
 * Traffic conditions and monthly flow.
 *
 * TWO DIFFERENT KINDS OF FACT, on two different clocks, which is why they are
 * separate tables and separate readers:
 *
 *   conditions  how the road is RIGHT NOW, per section. Written by a traffic
 *               feed (TomTom) or by an operator during an incident.
 *   monthly     how much traffic the road CARRIED, per month, counted at the
 *               toll plazas. Entered by DBEDC.
 *
 * Both degrade to empty rather than throwing. The route page renders the map
 * from geometry alone, so a traffic outage costs the colouring and nothing else.
 */

import { query, dbEnabled } from '../db.js';
import { getSetting } from '../settings.js';

/**
 * Where the traffic conditions on this deployment come from.
 *
 * DEFAULTS TO 'sample'. Every reader that shows a condition also shows this,
 * and the wrong direction to fail is a page that presents made-up congestion as
 * a live measurement of a real road. An operator moves it to 'tomtom' or
 * 'operator' only once the data behind it is real — the same shape as
 * `corridor.illustrative`, and for the same reason.
 */
export async function getTrafficSource() {
  const value = await getSetting('corridor.traffic_source', 'sample');
  return ['sample', 'tomtom', 'operator'].includes(value) ? value : 'sample';
}

export async function listCorridorWaypoints() {
  if (!dbEnabled()) return [];
  try {
    return (await query(
      'SELECT code, lat, lng, chainage_m, sort_order, names FROM corridor_waypoints ORDER BY chainage_m',
    )) || [];
  } catch {
    return [];
  }
}

/**
 * The road's real centreline, if it has been imported.
 *
 * Empty is the normal state until `scripts/import-corridor-geometry.mjs` has
 * run: the map then falls back to the surveyed waypoint polyline and labels
 * itself a schematic. Empty is never an error here, and never silently becomes
 * a straight line pretending to be a road.
 */
export async function listCorridorGeometry() {
  if (!dbEnabled()) return [];
  try {
    return (await query(
      'SELECT seq, lat, lng, chainage_m FROM corridor_geometry ORDER BY seq',
    )) || [];
  } catch {
    return [];
  }
}

/** Where that centreline came from, and the credit it must carry. */
export async function getGeometrySource() {
  if (!dbEnabled()) return null;
  try {
    const rows = await query(
      'SELECT source, attribution, points, length_m FROM corridor_geometry_source WHERE id = 1',
    );
    return (rows && rows[0]) || null;
  } catch {
    return null;
  }
}

export async function listCorridorSections() {
  if (!dbEnabled()) return [];
  try {
    return (await query(
      `SELECT id, from_code, to_code, sort_order, condition_key, avg_speed_kmh, measured_at
         FROM corridor_sections ORDER BY sort_order, id`,
    )) || [];
  } catch {
    return [];
  }
}

/**
 * Monthly vehicle counts, most recent last so a chart reads left to right.
 *
 * `limit` is clamped: this is reachable from a public page on a shared host.
 */
export async function listMonthlyTraffic({ limit = 12 } = {}) {
  if (!dbEnabled()) return [];
  const take = Math.min(Math.max(Number(limit) || 12, 1), 60);
  try {
    const rows = await query(
      `SELECT month, plaza, vehicles FROM traffic_monthly
        WHERE plaza = 'all' ORDER BY month DESC LIMIT ${take}`,
    );
    return (rows || [])
      .map((r) => ({ month: String(r.month), vehicles: Number(r.vehicles) || 0 }))
      .reverse();
  } catch {
    return [];
  }
}

/**
 * The largest count in a series, for scaling a chart.
 *
 * Returns 1 rather than 0 for an empty series so a caller dividing by it cannot
 * produce NaN and render bars of height "NaN%".
 */
export function peakVehicles(rows) {
  return Math.max(1, ...(rows || []).map((r) => Number(r.vehicles) || 0));
}

/**
 * Month-on-month change as a percentage, or null when it cannot be computed.
 *
 * Null rather than 0: "no previous month" and "no change" are different facts,
 * and showing 0% for the first month of data is a small lie a reader will act on.
 */
export function monthOnMonthChange(rows) {
  if (!rows || rows.length < 2) return null;
  const prev = Number(rows[rows.length - 2].vehicles) || 0;
  const last = Number(rows[rows.length - 1].vehicles) || 0;
  if (prev === 0) return null;
  return ((last - prev) / prev) * 100;
}
