import { cache } from 'react';
import { DEFAULT_LOCALE, isLocale } from './locales.js';

/**
 * The locale of the request being rendered, for the one component Next does
 * not tell: `not-found.jsx`.
 *
 * A layout receives its own `params`; a page receives the whole path; a
 * not-found boundary receives NOTHING — no params, no pathname. Middleware
 * could stamp a header, but middleware.js runs on the edge on every request
 * including static assets and is on the do-not-modify list. So the locale
 * layout, which does know, writes it here, and the 404 reads it back.
 *
 * `cache()` gives one object per request on the server — the same mechanism
 * every cached reader in the lib cache modules relies on for request-level dedup —
 * so nothing leaks between two visitors rendering at once. The layout is
 * rendered before its subtree (it awaits primeUiStrings), which is what makes
 * the write visible to the read.
 */
const store = cache(() => ({ locale: null }));

export function setRequestLocale(locale) {
  if (isLocale(locale)) store().locale = locale;
}

/** The current locale, or English when nothing set it — a 404 under a
 *  non-locale first segment (`/nope`) renders bare, in English. */
export function getRequestLocale() {
  return store().locale || DEFAULT_LOCALE;
}
