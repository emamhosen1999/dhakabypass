/**
 * The road centreline.
 *
 * WHY THIS TABLE EXISTS. `corridor_waypoints` holds eight surveyed points over
 * 47.6 km. Drawn as an alignment they are a polyline: eight straight legs, and
 * a reader looking at the map says — correctly — "that is not a road". The
 * chainages in the survey workbook were measured along the ROUTED centreline,
 * so the waypoints are a sample of a curve nobody gave us the rest of.
 *
 * This table holds the rest of it: an ordered list of points dense enough to
 * draw the road's actual shape. It is populated by
 * `scripts/import-corridor-geometry.mjs`, from OpenStreetMap or from a GeoJSON
 * or GPX file, on a machine with network access. Until it is populated the map
 * falls back to the waypoint polyline and SAYS SO on the page, because a
 * schematic presented as a survey is the same class of lie as an invented
 * figure.
 *
 * `source` and `attribution` are not decoration. OpenStreetMap geometry is
 * ODbL: it may be used here, and the attribution must be shown. The map reads
 * this column and renders it, so an import can never quietly drop the credit.
 *
 * Safe to re-run: every statement is IF NOT EXISTS.
 * Takes its database from DB_NAME, or --database=<name>.
 */
import mysql from 'mysql2/promise';
import { loadEnv } from './load-env.mjs';

loadEnv();

const arg = process.argv.find((a) => a.startsWith('--database='));
const DB_NAME = arg ? arg.split('=')[1] : process.env.DB_NAME || 'dhakabypass';

const db = await mysql.createConnection({
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: DB_NAME,
});

// DECIMAL for the same reason as corridor_waypoints: a coordinate is an exact
// value, and a float read back never equals the float written.
await db.query(`
  CREATE TABLE IF NOT EXISTS corridor_geometry (
    id INT NOT NULL AUTO_INCREMENT,
    -- Position along the centreline. Not a chainage: chainages are measured
    -- facts from the survey, this is just draw order.
    seq INT NOT NULL,
    lat DECIMAL(10,7) NOT NULL,
    lng DECIMAL(10,7) NOT NULL,
    -- Distance from the start of the line, in metres, computed at import time
    -- so the map can slice a section without walking the whole table.
    chainage_m INT NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    UNIQUE KEY seq (seq),
    KEY chainage (chainage_m)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
`);

/**
 * One row describing where the centreline came from.
 *
 * A single row, keyed on a constant, rather than a settings entry: the licence
 * credit has to travel with the geometry. If the two lived apart, replacing the
 * geometry would leave the old attribution behind, which is worse than having
 * none — it would credit the wrong people.
 */
await db.query(`
  CREATE TABLE IF NOT EXISTS corridor_geometry_source (
    id TINYINT NOT NULL DEFAULT 1,
    -- 'osm', 'file', 'waypoints'. The map shows a different note for each.
    source VARCHAR(32) NOT NULL DEFAULT 'waypoints',
    -- Rendered verbatim on the map. ODbL requires it for OpenStreetMap data.
    attribution VARCHAR(191) NOT NULL DEFAULT '',
    points INT NOT NULL DEFAULT 0,
    length_m INT NOT NULL DEFAULT 0,
    imported_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
`);

console.log(`corridor_geometry and corridor_geometry_source ready on ${DB_NAME}`);
await db.end();
