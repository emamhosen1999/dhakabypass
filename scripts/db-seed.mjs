/**
 * Seeds the newsroom from scripts/data/news.json when it is empty, and
 * optionally the first admin account.
 *
 *   node scripts/db-seed.mjs            # news (only into an empty table)
 *   node scripts/db-seed.mjs --admin    # also create/update the admin user
 *
 * Page, block, corridor and media content is seeded by db/sql and the
 * db:seed:* scripts; the legacy `content`/`gallery_images` seed is gone.
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

// ---- news updates (only if empty) ----
const [[{ c: newsCount }]] = await db.query('SELECT COUNT(*) AS c FROM news_updates');
if (newsCount === 0) {
  const news = read('scripts/data/news.json');
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
      // `users` is the table sign-in reads (lib/auth); the legacy admin_users
      // table this used to write is gone (W6.10).
      `INSERT INTO users (email, name, password_hash, role) VALUES (?, ?, ?, 'admin')
       ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash), name = VALUES(name), role = 'admin'`,
      [ADMIN_EMAIL.toLowerCase(), ADMIN_NAME, hash]
    );
    console.log(`admin user ready: ${ADMIN_EMAIL}`);
  }
}

await db.end();
