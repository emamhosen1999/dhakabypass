/**
 * The list of every editable UI string, built from the two code tables.
 *
 * Derived, never hand-maintained. /admin/translations iterates this, so a key
 * added to lib/i18n/ui.js or lib/i18n/map-ui.js becomes editable with no
 * further step — the alternative, a parallel list, would drift the first time
 * someone added a key and the drift would show up as a string nobody can edit,
 * which is the exact problem W1.6 exists to fix.
 *
 * English defines the key set. A key present only in `bn` or `zh` would have no
 * English fallback, which `tests/unit/ui-strings.test.js` already forbids.
 *
 * No database and no `next/*` imports, so it is safe in both a server and a
 * client bundle and is testable without either.
 */

import { LOCALES, DEFAULT_LOCALE } from './locales.js';
import { UI } from './ui.js';
import { MAP_UI } from './map-ui.js';
import { UI_NS, MAP_NS, stringKey } from './overrides.js';
import { groupForKey } from './groups.js';

const TABLES = { [UI_NS]: UI, [MAP_NS]: MAP_UI };

function entriesFor(ns) {
  const table = TABLES[ns];
  return Object.keys(table[DEFAULT_LOCALE]).map((base) => {
    const key = stringKey(ns, base);
    const values = {};
    for (const locale of LOCALES) values[locale] = table[locale]?.[base] ?? '';
    return { key, ns, base, group: groupForKey(key), values };
  });
}

/** `[{ key: 'ui.navTravel', ns, base, group, values: { en, bn, zh } }, …]` */
export const UI_STRING_CATALOGUE = [...entriesFor(UI_NS), ...entriesFor(MAP_NS)];

const BY_KEY = new Map(UI_STRING_CATALOGUE.map((entry) => [entry.key, entry]));

export function findUiString(fullKey) {
  return BY_KEY.get(fullKey);
}

/** The shipped value for a full key in a locale, or undefined if there is none. */
export function codeValue(fullKey, locale) {
  return BY_KEY.get(fullKey)?.values?.[locale] || undefined;
}

/** The catalogue in render order, grouped. `[[group, entries], …]` */
export function catalogueByGroup(entries = UI_STRING_CATALOGUE) {
  const groups = new Map();
  for (const entry of entries) {
    if (!groups.has(entry.group)) groups.set(entry.group, []);
    groups.get(entry.group).push(entry);
  }
  return groups;
}
