/**
 * Seeds a minimal home page so the new locale routes have something to render.
 * Re-runnable: drops and recreates the `home` page (blocks cascade).
 *   node scripts/seed-home.mjs [--database=name]
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

await db.execute('DELETE FROM pages WHERE slug = ?', ['home']);

const [page] = await db.execute(
  "INSERT INTO pages (slug, status) VALUES ('home', 'published')"
);
await db.execute(
  "INSERT INTO page_translations (page_id, locale, title, status) VALUES (?, 'en', 'Home', 'published')",
  [page.insertId]
);

const BLOCKS = [
  {
    type: 'stat-row',
    data: {
      stats: [
        { value: '48', unit: 'KM', label: 'Corridor' },
        { value: '18', unit: 'KM', label: 'Open to traffic' },
        { value: '73.5', unit: '%', label: 'Works complete' },
        { value: '4', unit: '', label: 'National highways' },
      ],
    },
  },
  {
    type: 'rich-text',
    data: {
      heading: 'Bangladesh’s first access-controlled expressway',
      body: '<p>Forty-eight kilometres linking four national highways east of the capital.</p>',
    },
  },
];

for (let i = 0; i < BLOCKS.length; i += 1) {
  const [block] = await db.execute(
    'INSERT INTO blocks (page_id, type, sort_order) VALUES (?, ?, ?)',
    [page.insertId, BLOCKS[i].type, i]
  );
  await db.execute(
    "INSERT INTO block_translations (block_id, locale, data, status) VALUES (?, 'en', ?, 'published')",
    [block.insertId, JSON.stringify(BLOCKS[i].data)]
  );
}

console.log(`Seeded home page #${page.insertId} with ${BLOCKS.length} blocks on ${DB_NAME}`);
await db.end();
