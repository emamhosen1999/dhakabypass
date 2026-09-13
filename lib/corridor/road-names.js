/**
 * Pure helpers for the corridor map's road names (audit 2.5/2.6): how a road
 * is keyed, which roads the map draws, and what name a reader sees. No
 * database here, so lib/corridor/view.js stays importable anywhere. The
 * record itself is read and written by ./roads.js.
 */
import { DEFAULT_LOCALE } from '../i18n/locales.js';
import context from './data/map-context.json';

/** Own-property read with English fallback (same rule as interchanges.localeText). */
function localeText(map, locale) {
  const m = map && typeof map === 'object' ? map : {};
  if (Object.hasOwn(m, locale) && m[locale]) return String(m[locale]);
  if (Object.hasOwn(m, DEFAULT_LOCALE) && m[DEFAULT_LOCALE]) return String(m[DEFAULT_LOCALE]);
  return '';
}

export const roadKey = (road) => String(road?.ref || road?.name || road?.id || '');

/** Every distinct road the map draws, in first-seen order, for the admin. */
export function mapRoads() {
  const seen = new Map();
  for (const road of context.highlights || []) {
    const key = roadKey(road);
    if (!key || seen.has(key)) continue;
    seen.set(key, { key, ref: road.ref || '', osmName: road.name || '', osmId: String(road.id || ''), kind: road.kind || '' });
  }
  return [...seen.values()];
}

/**
 * The name and reference a visitor sees for one road: the record in the
 * reader's language, English fallback, then OpenStreetMap's own name.
 */
export function resolveRoad(road, records, locale) {
  const rec = (records || []).find((r) => r.key === roadKey(road)) || null;
  return {
    name: localeText(rec?.names, locale) || road?.name || '',
    source: rec?.source || (road?.id ? `https://www.openstreetmap.org/way/${road.id}` : ''),
  };
}
