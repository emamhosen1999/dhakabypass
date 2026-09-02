import { query } from './db.js';
import { DEFAULT_LOCALE } from './i18n/locales.js';

const asJson = (v) => (typeof v === 'string' ? JSON.parse(v) : v);

const isPlainObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);

export async function getSetting(key, fallback = null) {
  let rows;
  try {
    rows = await query('SELECT value FROM site_settings WHERE setting_key = ? LIMIT 1', [key]);
  } catch {
    // A settings read must never be able to take a page down. A transient
    // failure here (network blip, rejected credentials, pool exhaustion) is
    // indistinguishable from "we don't know" as far as the caller is
    // concerned, so it degrades the same way a missing row does: the
    // fallback. For isDataIllustrative() specifically, the fallback is
    // true — the safe direction is the site saying the data is
    // provisional, not crashing or silently presenting it as confirmed.
    return fallback;
  }
  if (!rows || rows.length === 0) return fallback;
  try {
    return asJson(rows[0].value);
  } catch {
    return fallback;
  }
}

export async function setSetting(key, value) {
  await query(
    `INSERT INTO site_settings (setting_key, value) VALUES (?, ?)
     ON DUPLICATE KEY UPDATE value = VALUES(value)`,
    [key, JSON.stringify(value)]
  );
}

/**
 * Whether operational figures are still awaiting official confirmation.
 *
 * DEFAULTS TO TRUE. If the setting is missing or unreadable the site says the
 * data is provisional. Wrongly labelling real data as provisional costs a
 * little authority; presenting unverified toll rates as official fact on the
 * operator's own site is far worse.
 */
export async function isDataIllustrative() {
  const value = await getSetting('corridor.illustrative', true);
  return value !== false;
}

/**
 * Prohibited vehicle classes for `locale`, English fallback, `[]` if the
 * setting is absent or unreadable.
 *
 * `getSetting` already parses the JSON column, so the normal shape here is a
 * plain per-locale object. But this is an exported reader a future caller
 * may hand a value straight from a raw row (still a JSON string) rather than
 * through `getSetting` — parse defensively the same way `getSetting`/
 * `localeMessage` do rather than trusting the shape. `Object.hasOwn` on a
 * boxed string checks index/length keys, not locale keys, so an un-parsed
 * string would otherwise silently resolve to `[]` instead of the real list.
 */
export async function getProhibitedVehicles(locale) {
  const raw = await getSetting('corridor.prohibited_vehicles', {});
  let map = raw;
  if (!isPlainObject(map)) {
    try {
      map = typeof map === 'string' ? JSON.parse(map) : {};
    } catch {
      map = {};
    }
  }
  if (!isPlainObject(map)) map = {};

  if (Object.hasOwn(map, locale) && Array.isArray(map[locale])) return map[locale];
  if (Object.hasOwn(map, DEFAULT_LOCALE) && Array.isArray(map[DEFAULT_LOCALE])) return map[DEFAULT_LOCALE];
  return [];
}

/**
 * The official published corridor length in kilometres (48), as distinct
 * from the measured road-network length (47.611 km) that all stored
 * chainages are relative to. The two are both correct for different
 * purposes: 48 km is the design figure used by the gazette, ADB and the
 * press; 47.611 km is what the road actually measures because the pavement
 * ends short of the nominal start. Kept as a setting rather than a computed
 * value so it can be shown alongside the measured figure — NOT in place of
 * it. Read via `getPublishedLengthKmCached()` (lib/corridor/cache.js) and
 * passed into `<ProgressBar>` as `publishedLengthKm` by the home page and
 * /travel/status, which use it as the note text's denominator; the
 * percentage stays derived from the measured extent, since that is what is
 * arithmetically correct.
 *
 * Falls back to `null` if the setting is absent or unreadable, so a caller
 * can distinguish "no published figure on record" from an actual 0.
 */
export async function getPublishedLengthKm() {
  const value = await getSetting('corridor.published_length_km', null);
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}
