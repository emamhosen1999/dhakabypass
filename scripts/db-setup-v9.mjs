/**
 * Corridor geometry and traffic.
 *
 * The interactive geographic map was specified from the start —
 * docs/superpowers/specs/2026-08-31-dhakabypass-reinnovation-design.md: "Schematic
 * corridor strip everywhere + one real interactive map on the route page" — and
 * deferred in the travel-info plan for one reason: "Building a geographic map
 * now would require inventing coordinates, which is precisely what the
 * illustrative-data labelling exists to prevent."
 *
 * That reason has expired. docs/source-data/DBEDC_Corridor_Waypoints.xlsx carries
 * the real thing: eight road-network waypoints with surveyed coordinates and
 * chainages measured along the actual routed centreline, nine toll plazas and
 * three bridges projected onto the same geometry. Every coordinate this schema
 * holds is client-supplied. None is inferred.
 *
 * THREE TABLES, and the split matters:
 *
 *   corridor_waypoints  the alignment itself. Geometry, not facilities —
 *                       `interchanges` already holds the places a driver uses,
 *                       and mixing the two would mean a toll plaza could be
 *                       deleted and take a bend in the road with it.
 *
 *   corridor_sections   the stretches between consecutive waypoints, each
 *                       carrying a traffic condition. This is the row a traffic
 *                       feed writes to and the row the map colours from.
 *
 *   traffic_monthly     monthly vehicle counts from the toll plazas, which DBEDC
 *                       enters. Separate from sections because it is a different
 *                       kind of fact on a different clock: one is "how is the
 *                       road right now", the other is "how much traffic did it
 *                       carry in August".
 *
 * Safe to re-run: every CREATE is IF NOT EXISTS.
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

// DECIMAL, not FLOAT. A coordinate is an exact surveyed value, and binary
// floating point would round the seventh decimal place — about a centimetre
// here, but it also means a value read back never equals the value written,
// which turns "has this changed?" into a question with no reliable answer.
await db.query(`
  CREATE TABLE IF NOT EXISTS corridor_waypoints (
    id INT NOT NULL AUTO_INCREMENT,
    code VARCHAR(8) NOT NULL,
    lat DECIMAL(10,7) NOT NULL,
    lng DECIMAL(10,7) NOT NULL,
    chainage_m INT NOT NULL DEFAULT 0,
    sort_order INT NOT NULL DEFAULT 0,
    names LONGTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NULL CHECK (names IS NULL OR json_valid(names)),
    PRIMARY KEY (id),
    UNIQUE KEY code (code)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
`);

await db.query(`
  CREATE TABLE IF NOT EXISTS corridor_sections (
    id INT NOT NULL AUTO_INCREMENT,
    from_code VARCHAR(8) NOT NULL,
    to_code VARCHAR(8) NOT NULL,
    sort_order INT NOT NULL DEFAULT 0,
    -- free | moderate | slow | heavy | closed | unknown.
    -- DEFAULT 'unknown', deliberately: a section with no measurement must not
    -- claim to be flowing freely. The map renders unknown as grey and says so.
    condition_key VARCHAR(16) NOT NULL DEFAULT 'unknown',
    avg_speed_kmh INT NULL,
    measured_at TIMESTAMP NULL DEFAULT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY section (from_code, to_code)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
`);

await db.query(`
  CREATE TABLE IF NOT EXISTS traffic_monthly (
    id INT NOT NULL AUTO_INCREMENT,
    -- 'YYYY-MM'. A CHAR(7) rather than a DATE because the fact is a month, and
    -- a DATE would invite a day component nobody means.
    month CHAR(7) NOT NULL,
    plaza VARCHAR(32) NOT NULL DEFAULT 'all',
    vehicles INT NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    UNIQUE KEY month_plaza (month, plaza)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
`);

console.log(`corridor_waypoints, corridor_sections and traffic_monthly ready on ${DB_NAME}`);
await db.end();
