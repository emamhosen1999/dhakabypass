/**
 * Seed the institutional pages — about, governance, project, safety,
 * sustainability, procurement, disclosures, land acquisition, tariff
 * notifications and grievances — in en, bn and zh.
 *
 *   node scripts/seed-institutional.mjs              create what is missing
 *   node scripts/seed-institutional.mjs --replace    rewrite them from source
 *   node scripts/seed-institutional.mjs --dry-run    say what it would do
 *
 * The content is in lib/institutional/pages.js, with the reasoning for the
 * information architecture and for the awaiting-confirmation callouts.
 *
 * ---------------------------------------------------------------------------
 * NON-DESTRUCTIVE BY DEFAULT, and that is the important part
 * ---------------------------------------------------------------------------
 * `seed-home-v2.mjs` deletes every block on the home page and re-inserts the
 * seeded set, every time it runs. That is defensible for a single page seeded
 * once, and the deployment readiness review still lists it as a hazard: it sits
 * behind an inviting `npm run db:seed:home`, and running it on a live site
 * discards everything an editor has done.
 *
 * These pages exist specifically to be edited — every `db-pending` callout is a
 * gap for DBEDC to fill through the admin. A seed that overwrote them would
 * delete the very answers it is asking for, and would do it silently.
 *
 * So the default is: create a page that does not exist, leave alone one that
 * does. `--replace` is available for development and for a deliberate content
 * refresh, prints exactly which pages it will overwrite, and is the only path
 * that deletes anything.
 *
 * Each page is written inside a transaction. A page half-populated with blocks
 * is worse than a page that was never created: the first renders as a broken
 * page to the public, the second simply 404s until the seed is re-run.
 */

import mysql from 'mysql2/promise';
import { loadEnv } from './load-env.mjs';
import { INSTITUTIONAL_PAGES } from '../lib/institutional/pages.js';

loadEnv();

const args = process.argv.slice(2);
const replace = args.includes('--replace');
const dryRun = args.includes('--dry-run');
const dbArg = (args.find((a) => a.startsWith('--database=')) || '').split('=')[1];

const LOCALES = ['en', 'bn', 'zh'];

const db = await mysql.createConnection({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: dbArg || process.env.DB_NAME,
});

let created = 0;
let replaced = 0;
let skipped = 0;

for (const page of INSTITUTIONAL_PAGES) {
  const [rows] = await db.execute('SELECT id FROM pages WHERE slug = ?', [page.slug]);
  const exists = rows.length > 0;

  if (exists && !replace) {
    console.log(`  = ${page.slug.padEnd(32)} exists — left untouched`);
    skipped += 1;
    continue;
  }

  if (dryRun) {
    console.log(`  ${exists ? '~' : '+'} ${page.slug.padEnd(32)} would be ${exists ? 'replaced' : 'created'}`);
    if (exists) replaced += 1; else created += 1;
    continue;
  }

  await db.beginTransaction();
  try {
    let pageId;
    if (exists) {
      pageId = rows[0].id;
      // Block translations first: block_translations.block_id references
      // blocks.id, and deleting the parent first would either fail on the
      // constraint or orphan the children, depending on the schema.
      const [old] = await db.execute('SELECT id FROM blocks WHERE page_id = ?', [pageId]);
      for (const b of old) {
        await db.execute('DELETE FROM block_translations WHERE block_id = ?', [b.id]);
      }
      await db.execute('DELETE FROM blocks WHERE page_id = ?', [pageId]);
      await db.execute('UPDATE pages SET status = ? WHERE id = ?', ['published', pageId]);
    } else {
      const [ins] = await db.execute(
        'INSERT INTO pages (slug, status) VALUES (?, ?)',
        [page.slug, 'published'],
      );
      pageId = ins.insertId;
    }

    // page_translations is keyed on (page_id, locale) with no surrogate id, so
    // the upsert is the whole read-modify-write — a SELECT id / UPDATE ... WHERE
    // id pair fails against this schema with ER_BAD_FIELD_ERROR.
    //
    // seo_title is deliberately left unset: generateMetadata resolves
    // `seo_title || title`, so one field to keep correct beats two that have to
    // agree with each other.
    for (const locale of LOCALES) {
      const meta = page.meta[locale] || page.meta.en;
      await db.execute(
        `INSERT INTO page_translations (page_id, locale, title, seo_description, status)
         VALUES (?, ?, ?, ?, 'published')
         ON DUPLICATE KEY UPDATE
           title = VALUES(title), seo_description = VALUES(seo_description),
           status = VALUES(status)`,
        [pageId, locale, meta.title, meta.description],
      );
    }

    for (const [i, block] of page.blocks.entries()) {
      const [ins] = await db.execute(
        'INSERT INTO blocks (page_id, type, sort_order) VALUES (?, ?, ?)',
        [pageId, block.type, i],
      );
      for (const locale of LOCALES) {
        const data = block.data[locale];
        // No translation for this locale: BlockRenderer falls back to en, which
        // is a better outcome than an empty block.
        if (!data) continue;
        await db.execute(
          'INSERT INTO block_translations (block_id, locale, data, status) VALUES (?, ?, ?, ?)',
          [ins.insertId, locale, JSON.stringify(data), 'published'],
        );
      }
    }

    await db.commit();
    console.log(
      `  ${exists ? '~' : '+'} ${page.slug.padEnd(32)} ${exists ? 'replaced' : 'created'} — `
      + `${page.blocks.length} blocks x ${LOCALES.length} locales`,
    );
    if (exists) replaced += 1; else created += 1;
  } catch (err) {
    await db.rollback();
    console.error(`\n  x ${page.slug} failed and was rolled back:\n    ${err.message}\n`);
    await db.end();
    process.exit(1);
  }
}

console.log('');
console.log(
  `${created} created, ${replaced} replaced, ${skipped} left untouched`
  + `${dryRun ? '  (dry run — nothing was written)' : ''}`,
);
if (skipped && !replace) {
  console.log('Pass --replace to rewrite existing pages from source. This DISCARDS admin edits.');
}
if (!dryRun && (created || replaced)) {
  // unstable_cache entries survive a restart and a seed cannot call
  // revalidateTag() from outside the server, so a dev server will keep serving
  // the old page until its cache directory is cleared. This has cost at least
  // one implementer a wasted verification round.
  console.log('');
  console.log('If a dev server is running: stop it, delete .next/cache/fetch-cache, restart.');
}

await db.end();
