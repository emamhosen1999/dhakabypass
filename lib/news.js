import { query, dbEnabled } from './db';
import seed from '../content/news.json';

/**
 * News / Latest Updates.
 * Stored in `news_updates` table; falls back to content/news.json when DB is offline.
 */

export async function getNewsUpdates(onlyPublished = true) {
  if (!dbEnabled()) {
    return onlyPublished ? seed.filter((n) => n.is_published) : seed;
  }
  try {
    const sql = onlyPublished
      ? 'SELECT * FROM news_updates WHERE is_published = 1 ORDER BY published_at DESC, id DESC'
      : 'SELECT * FROM news_updates ORDER BY published_at DESC, id DESC';
    const rows = await query(sql);
    if (!rows || rows.length === 0) {
      return onlyPublished ? seed.filter((n) => n.is_published) : seed;
    }
    return rows;
  } catch {
    return onlyPublished ? seed.filter((n) => n.is_published) : seed;
  }
}

export async function getNewsPost(idOrSlug) {
  const isId = /^\d+$/.test(String(idOrSlug));
  if (!dbEnabled()) {
    return seed.find((n) => (isId ? n.id === Number(idOrSlug) : n.slug === String(idOrSlug))) || null;
  }
  try {
    const sql = isId
      ? 'SELECT * FROM news_updates WHERE id = ? LIMIT 1'
      : 'SELECT * FROM news_updates WHERE slug = ? LIMIT 1';
    const rows = await query(sql, [idOrSlug]);
    if (!rows || rows.length === 0) {
      return seed.find((n) => (isId ? n.id === Number(idOrSlug) : n.slug === String(idOrSlug))) || null;
    }
    return rows[0];
  } catch {
    return seed.find((n) => (isId ? n.id === Number(idOrSlug) : n.slug === String(idOrSlug))) || null;
  }
}

export const newsSeed = seed;
