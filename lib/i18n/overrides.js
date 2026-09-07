/**
 * Database overrides for the UI strings in lib/i18n/ui.js and lib/i18n/map-ui.js.
 *
 * ---------------------------------------------------------------------------
 * An OVERRIDE, never the source of truth — the same bargain as lib/menus/repo.js
 * ---------------------------------------------------------------------------
 * `t()` and `mapUi()` are called around 240 times, including in the header, the
 * footer, the language switcher and the contact form. Every one of those call
 * sites is synchronous and cannot await anything, and a label that came back
 * empty because a query failed would be a navigation bar with blank links and a
 * form with unlabelled fields — a page a reader cannot use and cannot work
 * around. So the code tables stay, and stay authoritative when nothing else
 * answers: the database can only REPLACE a string, never remove one.
 *
 * ---------------------------------------------------------------------------
 * Why a module-level store and not a request-scoped one
 * ---------------------------------------------------------------------------
 * The public API of `t(locale, key)` is fixed — changing it would mean touching
 * ~240 call sites — so the overrides have to be readable synchronously. That
 * rules out React's `cache()` here, which is also unavailable in the three
 * client components that call `t()` (ContactForm, ConsentBanner, TravelSubnav)
 * and the one that calls `mapUi()` (CorridorExplorer).
 *
 * A module-level store is safe for this data specifically, because it holds
 * NOTHING request-specific: the strings are the same for every visitor of a
 * given locale. There is no cross-request leak to have. Staleness is the only
 * risk, and it is bounded from both ends — `primeUiStrings()` runs in the
 * locale layout on every request, and the cached reader behind it carries the
 * usual tag plus a 300-second recovery floor (lib/i18n/strings-cache.js).
 *
 * On the browser the same store is filled once by <UiStringsBridge>, which the
 * locale layout renders above `children` so it runs before any client component
 * that reads a string.
 *
 * This module is imported by client components. It must never import `next/*`,
 * `react`, or anything that touches the database.
 */

import { LOCALES } from './locales.js';

/** Namespaces. Prefixing keeps `map.title` apart from a future `ui.title`. */
export const UI_NS = 'ui';
export const MAP_NS = 'map';

export function stringKey(ns, key) {
  return `${ns}.${key}`;
}

/** locale -> { 'ui.navTravel': 'Travel Info', … }. Replaced wholesale, never merged. */
const store = new Map();

/** A usable string, or '' — the single definition of "the database answered". */
function usable(value) {
  return typeof value === 'string' && value.trim() ? value.trim() : '';
}

/**
 * Install the override table for one locale.
 *
 * REPLACES the locale's table rather than merging into it. Merging would make
 * "reset this string to the code value" impossible to express: the deleted row
 * simply would not appear in the next load, and a merge would keep serving the
 * value it had.
 */
export function applyUiOverrides(locale, table) {
  const clean = {};
  if (table && typeof table === 'object') {
    for (const [key, value] of Object.entries(table)) {
      const v = usable(value);
      if (key && v) clean[key] = v;
    }
  }
  store.set(locale, clean);
}

/** The stored value for a full key, or '' — never undefined, never blank. */
export function readUiOverride(locale, fullKey) {
  const table = store.get(locale);
  return table ? table[fullKey] || '' : '';
}

/** The whole table for a locale, as a plain serialisable object. */
export function getUiOverrides(locale) {
  return { ...(store.get(locale) || {}) };
}

/** Every locale's table, for handing to the client in one prop. */
export function getAllUiOverrides() {
  const out = {};
  for (const locale of LOCALES) out[locale] = getUiOverrides(locale);
  return out;
}

/** Back to code-only. Used by tests, and by a reset in a long-lived process. */
export function clearUiOverrides() {
  store.clear();
}

/**
 * Database rows -> { locale: { fullKey: value } }.
 *
 * Pure, so the shape the site depends on is testable without a database.
 * A row is dropped rather than trusted when its locale is not one the site
 * serves, its key is empty, or its value is blank — an empty `value` column
 * must never be able to blank out a label that has a perfectly good code value
 * behind it.
 */
export function normalizeUiStringRows(rows) {
  const out = {};
  if (!Array.isArray(rows)) return out;
  for (const row of rows) {
    const locale = row?.locale;
    if (!LOCALES.includes(locale)) continue;
    const key = typeof row.string_key === 'string' ? row.string_key.trim() : '';
    const value = usable(row.value);
    if (!key || !value) continue;
    (out[locale] ||= {})[key] = value;
  }
  return out;
}
