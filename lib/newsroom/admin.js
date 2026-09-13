/**
 * Uncached newsroom reads and writes for the admin.
 *
 * Separate from lib/newsroom/cache.js on purpose: an editor must see their own
 * save immediately, and a cached read would show them the version from up to
 * five minutes ago and make them think the save failed.
 *
 * Also separate from lib/newsroom/repo.js's public readers, which only ever
 * return PUBLISHED translations. The admin has to see drafts — that is the
 * whole point of a draft — so these read every row regardless of status.
 */

import { query, dbEnabled } from '../db.js';

/** Every translation row for one article, drafts included. */
export async function getNewsTranslations(newsId) {
  if (!dbEnabled()) return [];
  const rows = await query(
    `SELECT news_id, locale, title, excerpt, body, status, updated_at
       FROM news_translations WHERE news_id = ?`,
    [Number(newsId)],
  );
  return rows || [];
}

/**
 * Create or replace one locale's translation.
 *
 * An upsert rather than a select-then-branch: `news_translations` is keyed on
 * (news_id, locale) with no surrogate id, so there is nothing to select an id
 * from — the same shape as `page_translations`, and the same reason.
 */
export async function saveNewsTranslation({ newsId, locale, title, excerpt, body, status }) {
  await query(
    `INSERT INTO news_translations (news_id, locale, title, excerpt, body, status)
     VALUES (?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       title = VALUES(title), excerpt = VALUES(excerpt),
       body = VALUES(body), status = VALUES(status)`,
    [Number(newsId), locale, title, excerpt, body, status],
  );
}

/** Remove one locale's translation, so the article falls back to English. */
export async function deleteNewsTranslation(newsId, locale) {
  await query('DELETE FROM news_translations WHERE news_id = ? AND locale = ?', [
    Number(newsId),
    locale,
  ]);
}

/**
 * Every article, draft and published, newest first — the admin's list and
 * dashboard (W6.3, replacing lib/news.js). No seed fallback, on purpose: an
 * admin screen that shows seed rows while the database is down tells its
 * operator that articles exist which it cannot open or edit. An outage reads
 * as an empty list here, and the dashboard's database check says why.
 */
export async function listNewsForAdmin() {
  if (!dbEnabled()) return [];
  return (await query('SELECT * FROM news_updates ORDER BY published_at DESC, id DESC')) || [];
}

/** One article by numeric id or slug, or null. */
export async function getNewsForAdmin(idOrSlug) {
  if (!dbEnabled()) return null;
  const isId = /^\d+$/.test(String(idOrSlug));
  const rows = await query(
    `SELECT * FROM news_updates WHERE ${isId ? 'id' : 'slug'} = ? LIMIT 1`,
    [isId ? Number(idOrSlug) : String(idOrSlug)],
  );
  return rows?.[0] || null;
}
