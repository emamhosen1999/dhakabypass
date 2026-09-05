/**
 * SAMPLE traffic data, so the corridor map can be seen working before DBEDC's
 * real figures exist.
 *
 * READ THIS BEFORE RUNNING IT IN PRODUCTION. Every number this writes is
 * invented. It exists so the map, the section panel and the monthly chart can
 * be built and reviewed against something, and it sets
 * `corridor.traffic_source = 'sample'` so every surface that shows a figure
 * from it says, in the reader's own language, that it is sample data.
 *
 * The whole project's rule is that an invented figure inside a well-built page
 * is worse than a gap, because it looks authoritative. This script is the one
 * deliberate exception, and it pays for that by making the label impossible to
 * remove accidentally: clearing the flag is a separate, explicit act in the
 * admin, and the seed never sets it to anything else.
 *
 *   npm run db:seed:traffic:sample
 *
 * To remove it again:
 *   npm run db:seed:traffic:sample -- --clear
 */
import mysql from 'mysql2/promise';
import { loadEnv } from './load-env.mjs';

loadEnv();

const args = process.argv.slice(2);
const clear = args.includes('--clear');
const arg = args.find((a) => a.startsWith('--database='));
const DB_NAME = arg ? arg.split('=')[1] : process.env.DB_NAME || 'dhakabypass';

const db = await mysql.createConnection({
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: DB_NAME,
});

if (clear) {
  await db.execute("UPDATE corridor_sections SET condition_key='unknown', avg_speed_kmh=NULL, measured_at=NULL");
  await db.execute('DELETE FROM traffic_monthly');
  await db.execute("DELETE FROM site_settings WHERE setting_key='corridor.traffic_source'");
  console.log('sample traffic cleared — sections back to unknown, monthly counts removed');
  await db.end();
  process.exit(0);
}

// Deliberately varied, so the map exercises every colour and the panel is worth
// looking at. The open section (Vogra to roughly K21) is the part carrying
// traffic today, so it gets the plausible conditions; the rest is under
// construction and reads as closed.
const CONDITIONS = [
  ['S', '2', 'free', 78],
  ['2', '3', 'moderate', 54],
  ['3', '4', 'slow', 34],
  ['4', '5', 'heavy', 19],
  ['5', '6', 'moderate', 58],
  ['6', '7', 'free', 81],
  ['7', 'E', 'closed', null],
];

for (const [from, to, condition, speed] of CONDITIONS) {
  await db.execute(
    `UPDATE corridor_sections SET condition_key = ?, avg_speed_kmh = ?, measured_at = NOW()
      WHERE from_code = ? AND to_code = ?`,
    [condition, speed, from, to],
  );
}
console.log(`${CONDITIONS.length} sections given sample conditions`);

// Twelve months ending last month — never the current one, which is incomplete
// and would render as a collapse in traffic rather than as a partial count.
const now = new Date();
const months = [];
for (let i = 12; i >= 1; i -= 1) {
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
  months.push(`${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`);
}

// A gentle upward trend with seasonal variation, so the chart shows a shape
// rather than a flat line. Still invented, still labelled.
let base = 412000;
for (const [i, month] of months.entries()) {
  const seasonal = Math.round(Math.sin((i / 12) * Math.PI * 2) * 24000);
  const vehicles = base + seasonal + i * 5200;
  await db.execute(
    `INSERT INTO traffic_monthly (month, plaza, vehicles) VALUES (?, 'all', ?)
     ON DUPLICATE KEY UPDATE vehicles = VALUES(vehicles)`,
    [month, vehicles],
  );
  base += 900;
}
console.log(`${months.length} months of sample vehicle counts written`);

await db.execute(
  `INSERT INTO site_settings (setting_key, value) VALUES ('corridor.traffic_source', ?)
   ON DUPLICATE KEY UPDATE value = VALUES(value)`,
  [JSON.stringify('sample')],
);
console.log("corridor.traffic_source = 'sample' — every figure will be labelled as such");

await db.end();
