/**
 * Reads and writes for the `ui_strings` table.
 *
 * ---------------------------------------------------------------------------
 * The read NEVER throws
 * ---------------------------------------------------------------------------
 * `loadUiStrings()` is on the critical path of every page: the header, the
 * footer and the language switcher all read strings, so a throw here is a blank
 * site, not a blank label. It degrades to `{}` — which means "no overrides",
 * which means the site renders the code tables in lib/i18n/ui.js and
 * lib/i18n/map-ui.js, i.e. exactly what it rendered before W1.6.
 *
 * That is not a theoretical path. `db/sql/09-ui-strings.sql` is a hand-import
 * through phpMyAdmin (there is no migration runner — see db/sql/README.md), so
 * EVERY existing database is missing this table until somebody runs that file,
 * and a deploy that ships the code before the SQL is imported is the normal
 * order of events rather than a mistake. `ER_NO_SUCH_TABLE` therefore has to be
 * as survivable as a dropped connection, and it is: both land in the same
 * catch, and the site is fully in English, Bangla and Chinese throughout.
 *
 * The writes DO throw. An editor pressing Save has to be told that it did not
 * save; the action layer turns the error into a sentence with `friendly()`.
 */

import { query } from '../db.js';
import { LOCALES } from './locales.js';
import { normalizeUiStringRows } from './overrides.js';

const SELECT = 'SELECT string_key, locale, value FROM ui_strings';

/** `{ locale: { fullKey: value } }` — `{}` if the table or the database is gone. */
export async function loadUiStrings() {
  let rows;
  try {
    rows = await query(SELECT);
  } catch {
    // A missing table, a refused connection, an exhausted pool and a rejected
    // credential are indistinguishable from "no overrides" as far as every
    // caller is concerned, and "no overrides" is a fully working site.
    return {};
  }
  // `query()` returns null when no database is configured at all (the local
  // no-DB mode in lib/db.js), which normalizeUiStringRows already treats as {}.
  return normalizeUiStringRows(rows);
}

/**
 * The same rows for the admin screen, uncached and unforgiving.
 *
 * Separate from `loadUiStrings()` on purpose: the editor must be able to tell
 * "nothing is overridden" from "the table is missing", because those need
 * different words on screen. The caller catches and decides.
 */
export async function listUiStringRows() {
  const rows = await query(`${SELECT} ORDER BY string_key, locale`);
  return rows || [];
}

/** True when `ui_strings` exists and can be read. */
export async function uiStringsTableReady() {
  try {
    await query('SELECT 1 FROM ui_strings LIMIT 1');
    return true;
  } catch {
    return false;
  }
}

function assertLocale(locale) {
  if (!LOCALES.includes(locale)) throw new Error(`Unknown locale: ${locale}`);
}

/** Store one override. An empty value removes it instead — see the action. */
export async function setUiString(fullKey, locale, value) {
  assertLocale(locale);
  await query(
    `INSERT INTO ui_strings (string_key, locale, value) VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE value = VALUES(value)`,
    [fullKey, locale, value],
  );
}

/**
 * Remove an override so the string falls back to its code value.
 *
 * Deleting the row rather than storing '' is what makes "reset" mean reset:
 * an empty string in the column would be ignored by the reader anyway, but it
 * would also make the admin screen unable to show whether the string is
 * overridden, and it would survive a later edit to the code value.
 */
export async function deleteUiString(fullKey, locale = null) {
  if (locale) {
    assertLocale(locale);
    await query('DELETE FROM ui_strings WHERE string_key = ? AND locale = ?', [fullKey, locale]);
    return;
  }
  await query('DELETE FROM ui_strings WHERE string_key = ?', [fullKey]);
}
