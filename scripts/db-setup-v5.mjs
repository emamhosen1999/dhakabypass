/**
 * Adds 'waypoint' to interchanges.kind.
 *
 * The corridor data carries eight rows of kind 'interchange', but six of them
 * are not interchanges at all — they are survey waypoints from the client's
 * coordinate list, named "Waypoint 2" through "Waypoint 7". They exist so the
 * corridor's geometry can be reconstructed; they are not places a driver can
 * join or leave the road, and their names mean nothing to one.
 *
 * They keep their lat/lng because the corridor map (a later phase) needs the
 * polyline. They simply stop appearing on pages meant for drivers.
 *
 * Modelling this as a kind rather than filtering on the name pattern matters:
 * the moment DBEDC supplies a real name for one of these points, a name-based
 * filter would silently start publishing it.
 *
 * Safe to re-run: the ALTER is skipped when the value is already present.
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

const [cols] = await db.execute(
  `SELECT COLUMN_TYPE FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'interchanges' AND COLUMN_NAME = 'kind'`,
  [DB_NAME],
);

if (!cols.length) {
  console.error('interchanges.kind not found — run scripts/db-setup-v3.mjs first');
  await db.end();
  process.exit(1);
}

if (cols[0].COLUMN_TYPE.includes("'waypoint'")) {
  console.log("  interchanges.kind already allows 'waypoint'");
} else {
  await db.query(
    `ALTER TABLE interchanges MODIFY COLUMN kind
       ENUM('interchange','toll_plaza','service_area','u_loop','pedestrian_overpass','bridge','waypoint')
       NOT NULL DEFAULT 'interchange'`,
  );
  console.log("  added 'waypoint' to interchanges.kind");
}

console.log(`interchanges.kind ready on ${DB_NAME}`);
await db.end();
