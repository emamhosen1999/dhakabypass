/**
 * Seeds ILLUSTRATIVE corridor data so the Travel Info pages have something to
 * render before DBEDC supplies the official schedule.
 *
 * Every figure here is reconstructed from public reporting, NOT from an official
 * source. K3+900 and the 18 km Kodda–Purbachal open section are sourced; the
 * intermediate chainages are interpolated. corridor.illustrative is set to true
 * so the site says so on every page that shows these numbers.
 *
 *   node scripts/seed-corridor.mjs [--database=name]
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

const SEGMENTS = [
  { from_m: 0,     to_m: 3900,  status: 'construction', labels: { en: 'Kodda approach' } },
  { from_m: 3900,  to_m: 21900, status: 'open',         labels: { en: 'Kodda – Purbachal' }, opened_on: '2025-08-24' },
  { from_m: 21900, to_m: 48000, status: 'construction', labels: { en: 'Purbachal – Madanpur' } },
];

const INTERCHANGES = [
  { chainage_m: 0,     names: { en: 'Kodda' },      kind: 'interchange',  status: 'construction', connects_to: 'N3 · Dhaka–Mymensingh' },
  { chainage_m: 3900,  names: { en: 'Toll Plaza' }, kind: 'toll_plaza',   status: 'open',         connects_to: '' },
  { chainage_m: 9400,  names: { en: 'Bhogra' },     kind: 'interchange',  status: 'open',         connects_to: 'N4 · Dhaka–Tangail link' },
  { chainage_m: 16200, names: { en: 'Bhaowal' },    kind: 'service_area', status: 'open',         connects_to: '' },
  { chainage_m: 21900, names: { en: 'Purbachal' },  kind: 'interchange',  status: 'open',         connects_to: 'Purbachal Link Road' },
  { chainage_m: 34600, names: { en: 'Bhulta' },     kind: 'interchange',  status: 'construction', connects_to: 'N2 · Dhaka–Sylhet' },
  { chainage_m: 48000, names: { en: 'Madanpur' },   kind: 'interchange',  status: 'construction', connects_to: 'N1 · Dhaka–Chattogram' },
];

const TOLLS = [
  { vehicle_class: 'motorcycle', class_labels: { en: 'Motorcycle' },      class_order: 1, amount_bdt: 40,  effective_from: '2025-08-24' },
  { vehicle_class: 'car',        class_labels: { en: 'Car / Jeep' },      class_order: 2, amount_bdt: 100, effective_from: '2025-08-24' },
  { vehicle_class: 'microbus',   class_labels: { en: 'Microbus' },        class_order: 3, amount_bdt: 150, effective_from: '2025-08-24' },
  { vehicle_class: 'bus_small',  class_labels: { en: 'Bus (up to 31)' },  class_order: 4, amount_bdt: 250, effective_from: '2025-08-24' },
  { vehicle_class: 'bus_large',  class_labels: { en: 'Bus (32+)' },       class_order: 5, amount_bdt: 350, effective_from: '2025-08-24' },
  { vehicle_class: 'truck_4',    class_labels: { en: 'Truck (4 wheel)' }, class_order: 6, amount_bdt: 300, effective_from: '2025-08-24' },
  { vehicle_class: 'truck_6',    class_labels: { en: 'Truck (6 wheel)' }, class_order: 7, amount_bdt: 500, effective_from: '2025-08-24' },
];

try {
  await db.query('DELETE FROM segments');
  await db.query('DELETE FROM interchanges');
  await db.query('DELETE FROM toll_rates');

  for (const s of SEGMENTS) {
    await db.execute(
      'INSERT INTO segments (from_m, to_m, status, opened_on, labels) VALUES (?, ?, ?, ?, ?)',
      [s.from_m, s.to_m, s.status, s.opened_on || null, JSON.stringify(s.labels)]
    );
  }
  for (const i of INTERCHANGES) {
    await db.execute(
      'INSERT INTO interchanges (chainage_m, names, kind, status, connects_to, facilities) VALUES (?, ?, ?, ?, ?, ?)',
      [i.chainage_m, JSON.stringify(i.names), i.kind, i.status, i.connects_to, JSON.stringify([])]
    );
  }
  for (const t of TOLLS) {
    await db.execute(
      'INSERT INTO toll_rates (vehicle_class, class_labels, class_order, section, amount_bdt, effective_from) VALUES (?, ?, ?, ?, ?, ?)',
      [t.vehicle_class, JSON.stringify(t.class_labels), t.class_order, 'Full corridor', t.amount_bdt, t.effective_from]
    );
  }

  await db.execute(
    `INSERT INTO site_settings (setting_key, value) VALUES ('corridor.illustrative', 'true')
     ON DUPLICATE KEY UPDATE value = VALUES(value)`
  );

  console.log(
    `Seeded ${SEGMENTS.length} segments, ${INTERCHANGES.length} interchanges and ` +
    `${TOLLS.length} toll rates on ${DB_NAME}, flagged ILLUSTRATIVE.`
  );
} catch (err) {
  console.error('Seed failed:', err.message);
  process.exitCode = 1;
} finally {
  await db.end();
}
