import { DEFAULT_LOCALE } from '../i18n/locales.js';

function published(rows, locale) {
  return (rows || []).find((r) => r.locale === locale && r.status === 'published') || null;
}

/**
 * Pick the content to render for `locale`, falling back to English.
 * Returns null when nothing is publishable — the caller must skip the block
 * rather than render an empty one.
 */
export function resolveTranslation(rows, locale) {
  const exact = published(rows, locale);
  if (exact) return { data: exact.data, locale, fallback: false };

  const base = published(rows, DEFAULT_LOCALE);
  if (base) return { data: base.data, locale: DEFAULT_LOCALE, fallback: locale !== DEFAULT_LOCALE };

  return null;
}

export function translationStatus(rows, locale) {
  const row = (rows || []).find((r) => r.locale === locale);
  return row ? row.status : 'missing';
}

/** How many blocks still need work in `locale`. Drives the admin dashboard. */
export function countMissing(rowsByBlock, locale) {
  return (rowsByBlock || []).reduce(
    (n, rows) => (translationStatus(rows, locale) === 'published' ? n : n + 1),
    0
  );
}
