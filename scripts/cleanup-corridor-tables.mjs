/**
 * Drop the corridor tables from a database. Used when a schema change needs a
 * fresh recreation during development.
 *
 * THIS SCRIPT DESTROYS DATA. It previously defaulted `--database` to
 * `process.env.DB_NAME`, so running it with no arguments on the server would
 * have dropped the LIVE corridor tables -- every segment, interchange, toll
 * rate, advisory, and the whole of site_settings, which holds the published
 * corridor length and the illustrative flag. There is no database backup in
 * this project and every migration is forward-only, so that was unrecoverable.
 *
 * Three guards now, because a destructive script that is merely documented as
 * destructive is one tired evening away from being run:
 *
 *   1. --database is REQUIRED. No default, ever. You must name the target.
 *   2. The name must end in `_test`, or you must pass --force as well.
 *   3. It refuses outright when the target equals DB_NAME unless --force is
 *      given, because DB_NAME is the live database on the server.
 *
 * Usage:
 *   node scripts/cleanup-corridor-tables.mjs --database=dhakabypass_test
 *   node scripts/cleanup-corridor-tables.mjs --database=something --force
 */
import mysql from 'mysql2/promise';
import { loadEnv } from './load-env.mjs';

loadEnv();

const TABLES = ['advisories', 'toll_rates', 'interchanges', 'segments', 'site_settings'];

const arg = process.argv.find((a) => a.startsWith('--database='));
const force = process.argv.includes('--force');
const target = arg ? arg.split('=')[1] : '';

function refuse(why) {
  console.error(`REFUSED: ${why}`);
  console.error(`  This would DROP: ${TABLES.join(', ')}`);
  console.error('  Usage: node scripts/cleanup-corridor-tables.mjs --database=dhakabypass_test');
  process.exit(1);
}

if (!target) {
  refuse('--database=<name> is required. There is deliberately no default.');
}
if (target === process.env.DB_NAME && !force) {
  refuse(`"${target}" is DB_NAME — the live database. Pass --force only if you mean it.`);
}
if (!target.endsWith('_test') && !force) {
  refuse(`"${target}" is not a _test database. Pass --force only if you mean it.`);
}

const { DB_HOST = '127.0.0.1', DB_PORT = '3306', DB_USER = 'root', DB_PASSWORD = '' } = process.env;

const db = await mysql.createConnection({
  host: DB_HOST, port: Number(DB_PORT), user: DB_USER, password: DB_PASSWORD, database: target,
});

try {
  console.log(`Dropping ${TABLES.length} tables from "${target}"${force ? ' (--force)' : ''}...`);
  await db.query(`DROP TABLE IF EXISTS ${TABLES.join(', ')}`);
  console.log(`Corridor tables dropped from ${target}`);
} catch (err) {
  console.error('Cleanup failed:', err.message);
  process.exitCode = 1;
} finally {
  await db.end();
}
