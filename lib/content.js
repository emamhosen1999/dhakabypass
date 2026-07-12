import { query, dbEnabled } from './db';
import siteSeed from '../content/seed.json';
import pageSeed from '../content/pages.json';

// Site-level sections (header/footer/home) + per-page content extracted from the
// original site. Together these are the defaults for every editable field.
const seed = { ...siteSeed, ...pageSeed };

/**
 * Content is stored in MySQL (`content` table: section_key -> JSON data).
 * The JSON seed is the fallback/default, so the site renders correctly even
 * before the DB is provisioned, and any key not yet overridden in the DB
 * falls back to its original value.
 */

async function dbContent() {
  if (!dbEnabled()) return {};
  try {
    const rows = await query('SELECT section_key, data FROM content');
    const out = {};
    for (const row of rows || []) {
      out[row.section_key] =
        typeof row.data === 'string' ? JSON.parse(row.data) : row.data;
    }
    return out;
  } catch {
    // DB unreachable / table missing -> fall back to seed rather than 500.
    return {};
  }
}

/** Get one content section, falling back to the seed default. */
export async function getContent(key) {
  const db = await dbContent();
  return db[key] ?? seed[key] ?? null;
}

/** Get several sections at once (single DB round trip). */
export async function getSections(keys) {
  const db = await dbContent();
  const out = {};
  for (const key of keys) out[key] = db[key] ?? seed[key] ?? null;
  return out;
}

/** Every section, seed defaults merged with DB overrides. Used by the admin. */
export async function getAllContent() {
  const db = await dbContent();
  return { ...seed, ...db };
}

/** Upsert one section. Used by the admin. */
export async function saveContent(key, data) {
  if (!dbEnabled()) throw new Error('Database is not configured');
  await query(
    `INSERT INTO content (section_key, data) VALUES (?, ?)
     ON DUPLICATE KEY UPDATE data = VALUES(data), updated_at = CURRENT_TIMESTAMP`,
    [key, JSON.stringify(data)]
  );
  return data;
}

export const seedContent = seed;
