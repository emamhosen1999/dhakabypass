/**
 * Adds `media.in_gallery` — whether an image appears in the public gallery.
 *
 * The media library is not a gallery. It holds page furniture as well as
 * photography: `/logo.webp`, `/route.webp`, the hero background. Publishing the
 * whole library would put a logo and a route diagram in among the site visits,
 * and every future upload — a PDF thumbnail, a diagram, a headshot — would
 * appear on a public page the moment someone added it to a block.
 *
 * DEFAULT 0, so nothing is ever published by accident. A new upload appears in
 * the gallery only when someone says it should. The alternative — default 1 —
 * makes the failure silent and public, which is the wrong direction for the one
 * flag that decides what the world sees.
 *
 * The migration then opts in the images that are unambiguously gallery
 * photography: the `/photo/*` set, which is the CSR and site-visit library the
 * old site published and which
 * `docs/source-data/2026-09-03-image-library-audit.md` cleared image by image.
 * The seven files that audit REJECTED are not registered in `media` at all —
 * `scripts/import-legacy-media.mjs` refuses to import them — so they cannot be
 * reached by this UPDATE.
 *
 * Only rows that have never been touched are opted in: the UPDATE is guarded on
 * the column having just been created, so re-running this cannot resurrect an
 * image an editor has since removed from the gallery.
 *
 * Safe to re-run. Takes its database from DB_NAME, or --database=<name>.
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

const [existing] = await db.execute(
  `SELECT 1 FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'media' AND COLUMN_NAME = 'in_gallery'`,
  [DB_NAME],
);

if (existing.length) {
  console.log('  media.in_gallery already present — leaving the flags alone');
} else {
  await db.query('ALTER TABLE media ADD COLUMN in_gallery TINYINT(1) NOT NULL DEFAULT 0');
  console.log('  added media.in_gallery (default 0 — nothing is published by accident)');

  // Only on first creation. Re-running must never re-publish an image an
  // editor has deliberately taken out of the gallery.
  const [res] = await db.query(
    "UPDATE media SET in_gallery = 1 WHERE origin = 'legacy' AND path LIKE '/photo/%'",
  );
  console.log(`  opted in ${res.affectedRows} audited legacy photographs`);
}

console.log(`media.in_gallery ready on ${DB_NAME}`);
await db.end();
