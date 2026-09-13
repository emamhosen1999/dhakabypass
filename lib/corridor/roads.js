/**
 * The roads the corridor map names (audit 2.5/2.6).
 *
 * The map's road GEOMETRY is built from OpenStreetMap by
 * scripts/build-corridor-context.mjs into data/map-context.json. The NAMES a
 * visitor reads — in three languages — and the reference each road links to
 * are a record, `corridor_roads`, edited at /admin/corridor/roads. A road
 * with no record shows the name OpenStreetMap gave it and links to its OSM
 * way, which is honest about where the name came from.
 *
 * A road is keyed the way the map groups it: its route number (`N1`, `R301`)
 * when it has one, otherwise its OSM name, otherwise its OSM way id.
 */
import { query } from '../db.js';
import { asJson, isPlainObject } from '../json.js';
import { validationError } from '../errors.js';
import { mapRoads } from './road-names.js';

export { roadKey, mapRoads, resolveRoad } from './road-names.js';

const shape = (row) => {
  const names = asJson(row.names, {});
  return { key: String(row.road_key), names: isPlainObject(names) ? names : {}, source: String(row.source_url || '') };
};

/** All records. A database without the table (before 31) has none. */
export async function listCorridorRoads() {
  try {
    return ((await query('SELECT road_key, names, source_url FROM corridor_roads ORDER BY road_key')) || []).map(shape);
  } catch (err) {
    if (err?.code === 'ER_NO_SUCH_TABLE') return [];
    throw err;
  }
}

export async function saveCorridorRoad({ key, names = {}, source = '' }) {
  const k = String(key || '').trim();
  if (!mapRoads().some((r) => r.key === k)) throw validationError('That road is not on the corridor map.');
  const src = String(source || '').trim();
  if (src && !/^https:\/\//i.test(src)) throw validationError('The reference link must start with https://');
  if (src.length > 500) throw validationError('The reference link must be 500 characters or fewer.');
  for (const v of Object.values(names)) {
    if (String(v).length > 120) throw validationError('A road name must be 120 characters or fewer.');
  }
  if (!Object.keys(names).length && !src) {
    await query('DELETE FROM corridor_roads WHERE road_key = ?', [k]);
    return;
  }
  await query(
    `INSERT INTO corridor_roads (road_key, names, source_url) VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE names = VALUES(names), source_url = VALUES(source_url)`,
    [k, JSON.stringify(names), src],
  );
}
