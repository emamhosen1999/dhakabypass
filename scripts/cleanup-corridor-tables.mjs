/**
 * Drop corridor tables from the specified database.
 * Used when schema changes require a fresh recreation.
 */
import mysql from 'mysql2/promise';
import { loadEnv } from './load-env.mjs';

loadEnv();

const arg = process.argv.find((a) => a.startsWith('--database='));
const DB_NAME = arg ? arg.split('=')[1] : process.env.DB_NAME || 'dhakabypass';
const { DB_HOST = '127.0.0.1', DB_PORT = '3306', DB_USER = 'root', DB_PASSWORD = '' } = process.env;

const db = await mysql.createConnection({
  host: DB_HOST, port: Number(DB_PORT), user: DB_USER, password: DB_PASSWORD, database: DB_NAME,
});

try {
  await db.query('DROP TABLE IF EXISTS advisories, toll_rates, interchanges, segments, site_settings');
  console.log(`Corridor tables dropped from ${DB_NAME}`);
} catch (err) {
  console.error('Cleanup failed:', err.message);
  process.exitCode = 1;
} finally {
  await db.end();
}
