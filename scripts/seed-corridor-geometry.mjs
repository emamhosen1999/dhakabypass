/**
 * The corridor's real geometry, from DBEDC's own survey workbook.
 *
 * Source: docs/source-data/DBEDC_Corridor_Waypoints.xlsx, sheet 2 — the
 * ROAD-NETWORK model. Sheet 1 is a straight-line great-circle model whose start
 * point was extrapolated to force the total to exactly 48.000 km; it is useful
 * for arithmetic and wrong for drawing, because a straight line between
 * waypoints cuts across land the road goes around. Sheet 2 carries the driving
 * geometry the chainages are actually measured along, so that is what a map
 * must be drawn from.
 *
 * Every coordinate below is copied from that workbook. None is inferred,
 * rounded or filled in — which is the condition the travel-info plan set for
 * building this map at all.
 *
 *   npm run db:seed:geometry
 *
 * Non-destructive: waypoints and sections are upserted by their natural key, so
 * re-running corrects a coordinate without disturbing the traffic conditions
 * written against a section.
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

/**
 * Sheet 2, verbatim. `chainage_m` is the cumulative chainage in metres along
 * the routed centreline — K0+000 at Naojor to K47+611 at Madanpur.
 *
 * Place names follow the recorded decision in
 * docs/source-data/2026-09-03-client-decisions.md §2: corridor facility names
 * stay Latin in every locale, because they are DBEDC's own place names and our
 * transliteration of one is not a source of truth. The districts either end are
 * ordinary city names and do take their native forms.
 */
const WAYPOINTS = [
  { code: 'S', lat: 23.986737, lng: 90.362246, chainage: 0,
    names: { en: 'Naojor (corridor start)', bn: 'নাওজোড় (করিডোরের শুরু)', zh: 'Naojor（走廊起点）' } },
  { code: '2', lat: 23.977568, lng: 90.380874, chainage: 2314, names: null },
  { code: '3', lat: 23.949671, lng: 90.414551, chainage: 7554, names: null },
  { code: '4', lat: 23.930211, lng: 90.452655, chainage: 12090, names: null },
  { code: '5', lat: 23.834773, lng: 90.540481, chainage: 26799, names: null },
  { code: '6', lat: 23.785562, lng: 90.568720, chainage: 34973, names: null },
  { code: '7', lat: 23.731516, lng: 90.587646, chainage: 41371, names: null },
  { code: 'E', lat: 23.690500, lng: 90.546722, chainage: 47611,
    names: { en: 'Madanpur (corridor end)', bn: 'মদনপুর (করিডোরের শেষ)', zh: 'Madanpur（走廊终点）' } },
];

for (const [i, w] of WAYPOINTS.entries()) {
  await db.execute(
    `INSERT INTO corridor_waypoints (code, lat, lng, chainage_m, sort_order, names)
     VALUES (?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       lat = VALUES(lat), lng = VALUES(lng), chainage_m = VALUES(chainage_m),
       sort_order = VALUES(sort_order), names = VALUES(names)`,
    [w.code, w.lat, w.lng, w.chainage, i, w.names ? JSON.stringify(w.names) : null],
  );
}
console.log(`${WAYPOINTS.length} waypoints upserted from the road-network model`);

/**
 * One section per consecutive pair.
 *
 * The traffic condition is NOT set here. A seed that wrote 'free' would be
 * publishing a claim about a road nobody measured — the exact failure the
 * illustrative-data labelling exists to prevent. The column defaults to
 * 'unknown', and only an operator entry or a real feed moves it.
 */
let sections = 0;
for (let i = 0; i < WAYPOINTS.length - 1; i += 1) {
  const [a, b] = [WAYPOINTS[i], WAYPOINTS[i + 1]];
  await db.execute(
    `INSERT INTO corridor_sections (from_code, to_code, sort_order)
     VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE sort_order = VALUES(sort_order)`,
    [a.code, b.code, i],
  );
  sections += 1;
}
console.log(`${sections} sections upserted (traffic conditions left unset)`);

await db.end();
