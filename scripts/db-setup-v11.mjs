/**
 * The schema half of db/sql/31-cms-consistency.sql, for the per-file DB tests
 * that build their database from the db-setup scripts rather than from the
 * numbered SQL files: the gazette citation on toll_rates, connects-to per
 * language on interchanges, and the corridor_roads record.
 *
 * Safe to re-run: every ALTER is guarded by an information_schema check.
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

const has = async (table, column) => {
  const [rows] = await db.execute(
    'SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ?',
    [DB_NAME, table, column],
  );
  return rows.length > 0;
};

if (!(await has('toll_rates', 'sro_number'))) {
  await db.query(`ALTER TABLE toll_rates
    ADD COLUMN sro_number VARCHAR(191) NOT NULL DEFAULT '',
    ADD COLUMN sro_date VARCHAR(64) NOT NULL DEFAULT '',
    ADD COLUMN sro_link VARCHAR(500) NOT NULL DEFAULT ''`);
}
if (!(await has('interchanges', 'connects_to_labels'))) {
  await db.query('ALTER TABLE interchanges ADD COLUMN connects_to_labels JSON DEFAULT NULL');
}
await db.query(`
  CREATE TABLE IF NOT EXISTS corridor_roads (
    road_key VARCHAR(191) NOT NULL,
    names JSON NOT NULL,
    source_url VARCHAR(500) NOT NULL DEFAULT '',
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (road_key)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
`);

console.log(`toll_rates citation, interchanges.connects_to_labels and corridor_roads ready on ${DB_NAME}`);
await db.end();
