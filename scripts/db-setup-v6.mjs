/**
 * Adds media.original_path — the path a row was FIRST registered under.
 *
 * Blocks reference an image by its public path, so replacing a photograph
 * rewrites the row's `path` from `/photo/16.webp` to `/uploads/...` (see
 * lib/media/replace.js). Nothing then remembers that `/photo/16.webp` was ever
 * a media row at all, and scripts/import-legacy-media.mjs — whose upsert is
 * keyed on the UNIQUE `path` — found no duplicate and INSERTed the placeholder
 * back, with its original English-only alt text, every time it ran. After 28
 * replacements one run refilled the whole list the operator had just cleared.
 * Pages never broke, because they point at /uploads/..., so nobody would
 * notice until the client asked why the list was full again.
 *
 * This column is that memory. It is written once, on the FIRST replacement,
 * and carried unchanged through every later one, so a row replaced twice still
 * names the legacy file it stands in for.
 *
 * NULLable and NOT unique, on purpose:
 *   - NULL means "never replaced" — every fresh upload and every row imported
 *     since is NULL, and the import treats NULL as "no claim made".
 *   - not UNIQUE because a database that already suffered the bug above can
 *     hold a resurrected duplicate; if that duplicate is replaced too, two
 *     rows legitimately name the same legacy path. A UNIQUE constraint would
 *     turn that into a raw SQL error inside an operator's upload, which is a
 *     worse failure than a duplicated audit record.
 *
 * No index: `media` is a 28-row table and the import reads it once per run.
 *
 * KNOWN LIMIT: rows replaced BEFORE this migration ran have original_path
 * NULL and there is nothing left on the row to recover it from. Those specific
 * placeholders can still be resurrected once. Everything replaced from here on
 * is protected.
 *
 * Safe to re-run: the ALTER is guarded by an information_schema check.
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

const [rows] = await db.execute(
  `SELECT 1 FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'media' AND COLUMN_NAME = 'original_path'`,
  [DB_NAME],
);

if (rows.length) {
  console.log('  media.original_path already present');
} else {
  await db.query('ALTER TABLE media ADD COLUMN original_path VARCHAR(255) NULL');
  console.log('  added media.original_path');
}

console.log(`media.original_path ready on ${DB_NAME}`);
await db.end();
