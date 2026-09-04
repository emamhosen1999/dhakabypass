/**
 * Adds `news_translations` — Bangla and Chinese for the newsroom.
 *
 * `news_updates` has one title, one excerpt and one body, in one language. That
 * was correct for the legacy site, which is English-only. The localised site is
 * published in en, bn and zh, and a newsroom that silently serves English
 * articles inside a Bangla page is the same defect the SEO work already fixed
 * for page titles: the reader gets no signal that anything is missing.
 *
 * A separate table rather than columns on `news_updates`, and rather than a
 * JSON blob:
 *
 *   - It mirrors `page_translations`, which the rest of this site already uses.
 *     One shape for translated content beats two.
 *   - It carries a per-locale `status`, so a half-finished Bangla translation
 *     can exist as a draft without appearing on the public site.
 *     `lib/content/resolve.js` already implements exactly that rule, and this
 *     table lets the newsroom reuse it rather than reimplement the fallback.
 *   - `news_updates` is read by the LEGACY site through lib/news.js, which is
 *     on the do-not-modify list. Adding columns there would change a table the
 *     legacy reader selects from; a new table cannot affect it at all.
 *
 * English is NOT stored here. It stays on `news_updates` as the base row, so an
 * article always has a body even with no translations, and there is exactly one
 * place to edit the English. `resolveTranslation` treats a missing locale as
 * "fall back to en", which is the behaviour that gives.
 *
 * Safe to re-run: CREATE TABLE IF NOT EXISTS.
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

// news_updates must exist first: this table's foreign key points at it, and
// db-setup.mjs is what creates it.
const [base] = await db.execute(
  `SELECT 1 FROM information_schema.TABLES
    WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'news_updates'`,
  [DB_NAME],
);
if (!base.length) {
  console.error('news_updates does not exist. Run scripts/db-setup.mjs first.');
  await db.end();
  process.exit(1);
}

await db.query(`
  CREATE TABLE IF NOT EXISTS news_translations (
    news_id INT NOT NULL,
    locale VARCHAR(5) NOT NULL,
    title VARCHAR(255) NOT NULL,
    excerpt TEXT NOT NULL,
    body LONGTEXT NULL,
    status VARCHAR(16) NOT NULL DEFAULT 'draft',
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (news_id, locale),
    CONSTRAINT fk_news_translations_news
      FOREIGN KEY (news_id) REFERENCES news_updates(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
`);

// ON DELETE CASCADE is deliberate: a translation of a deleted article is not
// something anyone would ever want to recover, and orphan rows would otherwise
// accumulate invisibly behind the admin's delete.

console.log(`news_translations ready on ${DB_NAME}`);
await db.end();
