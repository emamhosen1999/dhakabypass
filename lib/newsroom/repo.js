/**
 * Reading the newsroom for the localised site.
 *
 * Deliberately separate from `lib/news.js`, which serves the legacy site and is
 * on the do-not-modify list. The two read the same `news_updates` table; this
 * one joins `news_translations` and applies the same fallback rule the rest of
 * the localised site uses, so a Bangla reader gets Bangla where it exists and
 * English where it does not — never an empty article.
 *
 * Every function here degrades rather than throwing. That is the house rule for
 * public readers on this host and it is load-bearing: `lib/db.js` returns null
 * when the database is unreachable, and a newsroom that threw on that would
 * take the page down instead of showing "no items yet".
 */

import { query, dbEnabled } from '../db.js';
import { DEFAULT_LOCALE } from '../i18n/locales.js';

/**
 * Apply one locale's translation over the English base row.
 *
 * Field by field rather than row by row, on purpose. A translation with a title
 * but no body is common — someone translates the headline first — and taking
 * the whole row or none would either lose the English body or ignore the Bangla
 * title. `translated` reports what actually happened, so a page can say so.
 */
export function applyTranslation(article, rows, locale) {
  const t = (rows || []).find((r) => r.locale === locale && r.status === 'published');
  if (!t || locale === DEFAULT_LOCALE) {
    return { ...article, locale: DEFAULT_LOCALE, translated: locale === DEFAULT_LOCALE };
  }
  return {
    ...article,
    title: t.title || article.title,
    excerpt: t.excerpt || article.excerpt,
    // An empty string is a real editorial choice ("no body, the excerpt is the
    // whole item"), so only null/undefined falls through to English.
    body: t.body == null ? article.body : t.body,
    locale,
    translated: true,
  };
}

const LIST_COLUMNS =
  'id, title, slug, category, source, url, excerpt, image, published_at, is_published';

/**
 * Published articles, newest first.
 *
 * `limit` is clamped rather than trusted: this runs on a shared host, and an
 * unbounded LIMIT reachable from a URL is how one crawler turns a listing page
 * into a memory incident.
 */
export async function listNews({ locale = DEFAULT_LOCALE, limit = 24, offset = 0 } = {}) {
  if (!dbEnabled()) return [];
  const take = Math.min(Math.max(Number(limit) || 24, 1), 100);
  const skip = Math.max(Number(offset) || 0, 0);

  // LIMIT/OFFSET are interpolated because MySQL will not accept placeholders
  // there in a prepared statement; both are coerced to bounded integers above,
  // so no caller-supplied text reaches the SQL.
  const rows = await query(
    `SELECT ${LIST_COLUMNS} FROM news_updates
      WHERE is_published = 1
      ORDER BY published_at DESC, id DESC
      LIMIT ${take} OFFSET ${skip}`,
  );
  if (!rows || !rows.length) return [];

  if (locale === DEFAULT_LOCALE) {
    return rows.map((r) => ({ ...r, locale: DEFAULT_LOCALE, translated: true }));
  }

  // One query for every translation rather than one per article: a listing of
  // 24 items would otherwise issue 25 queries against a pool of 5 connections.
  const ids = rows.map((r) => r.id);
  const translations = await query(
    `SELECT news_id, locale, title, excerpt, body, status FROM news_translations
      WHERE locale = ? AND status = 'published' AND news_id IN (${ids.map(() => '?').join(',')})`,
    [locale, ...ids],
  );
  const byId = new Map();
  for (const t of translations || []) byId.set(t.news_id, [t]);

  return rows.map((r) => applyTranslation(r, byId.get(r.id), locale));
}

/** One article by slug, or null. */
export async function getNewsBySlug(slug, locale = DEFAULT_LOCALE) {
  if (!dbEnabled()) return null;
  const clean = String(slug || '').trim();
  if (!clean) return null;

  const rows = await query(
    `SELECT ${LIST_COLUMNS}, body FROM news_updates
      WHERE slug = ? AND is_published = 1 LIMIT 1`,
    [clean],
  );
  if (!rows || !rows.length) return null;
  const article = rows[0];

  if (locale === DEFAULT_LOCALE) {
    return { ...article, locale: DEFAULT_LOCALE, translated: true };
  }
  const translations = await query(
    `SELECT news_id, locale, title, excerpt, body, status FROM news_translations
      WHERE news_id = ? AND locale = ?`,
    [article.id, locale],
  );
  return applyTranslation(article, translations, locale);
}

/** Slugs for generateStaticParams and the sitemap. */
export async function listNewsSlugs() {
  if (!dbEnabled()) return [];
  const rows = await query(
    'SELECT slug, published_at FROM news_updates WHERE is_published = 1 ORDER BY published_at DESC',
  );
  return rows || [];
}
