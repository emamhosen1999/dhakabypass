/**
 * Seeds the DB from the JSON defaults (which were extracted from the original
 * site), so the dynamic site launches byte-identical to today's content.
 *
 *   node scripts/db-seed.mjs            # content + gallery
 *   node scripts/db-seed.mjs --admin    # also create/update the admin user
 *
 * Re-runnable: content upserts, gallery only seeds when empty.
 */
import fs from 'node:fs';
import path from 'node:path';
import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import { loadEnv } from './load-env.mjs';

loadEnv();

const ROOT = path.resolve(import.meta.dirname, '..');
const read = (p) => JSON.parse(fs.readFileSync(path.join(ROOT, p), 'utf8'));

const {
  DB_HOST = '127.0.0.1',
  DB_PORT = '3306',
  DB_USER = 'root',
  DB_PASSWORD = '',
  DB_NAME = 'dhakabypass',
  ADMIN_EMAIL,
  ADMIN_PASSWORD,
  ADMIN_NAME = 'Administrator',
} = process.env;

const db = await mysql.createConnection({
  host: DB_HOST,
  port: Number(DB_PORT),
  user: DB_USER,
  password: DB_PASSWORD,
  database: DB_NAME,
});

// ---- content ----
const defaults = { ...read('content/seed.json'), ...read('content/pages.json') };
let n = 0;
for (const [key, data] of Object.entries(defaults)) {
  await db.execute(
    `INSERT INTO content (section_key, data) VALUES (?, CAST(? AS JSON))
     ON DUPLICATE KEY UPDATE data = VALUES(data)`,
    [key, JSON.stringify(data)]
  );
  n++;
}
const fields = Object.values(defaults).reduce(
  (s, o) => s + (o && typeof o === 'object' ? Object.keys(o).length : 0),
  0
);
console.log(`content: ${n} sections (${fields} fields) upserted`);

// ---- gallery (only if empty, so admin edits are never clobbered) ----
const [[{ c: galleryCount }]] = await db.query('SELECT COUNT(*) AS c FROM gallery_images');
if (galleryCount === 0) {
  const imgs = read('content/gallery.json');
  for (const img of imgs) {
    await db.execute(
      'INSERT INTO gallery_images (file, caption, sort_order) VALUES (?, ?, ?)',
      [img.file, img.caption || '', img.sort ?? 0]
    );
  }
  console.log(`gallery: seeded ${imgs.length} photos`);
} else {
  console.log(`gallery: ${galleryCount} rows already present, left untouched`);
}

// ---- news updates (only if empty) ----
const [[{ c: newsCount }]] = await db.query('SELECT COUNT(*) AS c FROM news_updates');
if (newsCount === 0) {
  const news = read('content/news.json');
  for (const item of news) {
    await db.execute(
      `INSERT INTO news_updates (title, slug, category, source, url, excerpt, body, image, published_at, is_published)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        item.title,
        item.slug,
        item.category || 'Operations',
        item.source || '',
        item.url || '',
        item.excerpt || '',
        item.body || '',
        item.image || '',
        item.published_at || '2025-01-01',
        item.is_published ?? 1,
      ]
    );
  }
  console.log(`news: seeded ${news.length} articles`);
} else {
  console.log(`news: ${newsCount} articles already present, left untouched`);
}

// ---- admin user (password login; Google login is allowlist-based) ----
if (process.argv.includes('--admin')) {
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
    console.error('Set ADMIN_EMAIL and ADMIN_PASSWORD in .env.local to seed an admin user.');
    process.exitCode = 1;
  } else {
    const hash = await bcrypt.hash(ADMIN_PASSWORD, 12);
    await db.execute(
      `INSERT INTO admin_users (email, name, password_hash) VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash), name = VALUES(name)`,
      [ADMIN_EMAIL.toLowerCase(), ADMIN_NAME, hash]
    );
    console.log(`admin user ready: ${ADMIN_EMAIL}`);
  }
}

await db.end();
