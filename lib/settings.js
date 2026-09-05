import { query } from './db.js';
import { DEFAULT_LOCALE } from './i18n/locales.js';
import { isPlainObject } from './json.js';

const asJson = (v) => (typeof v === 'string' ? JSON.parse(v) : v);

export async function getSetting(key, fallback = null) {
  let rows;
  try {
    // MySQL decodes native JSON scalars while MariaDB returns JSON text.
    // Read text consistently so strings such as "operator" round-trip on both.
    rows = await query('SELECT CAST(value AS CHAR) AS value FROM site_settings WHERE setting_key = ? LIMIT 1', [key]);
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

/* ---------------------------------------------------------------------------
 * Contact and identity settings
 *
 * Every value here is something docs/source-data/2026-09-03-client-decisions.md
 * lists as outstanding from DBEDC — the phone number, the address, the
 * emergency hotline. The pages that need them currently show an explicit
 * "not yet published" callout, and the point of putting them in `site_settings`
 * rather than in code is that filling one in is an admin edit rather than a
 * deploy: the callout disappears and the real detail appears the moment
 * somebody types it.
 *
 * NOTHING HAS A PLAUSIBLE DEFAULT. Every reader below falls back to empty, not
 * to a placeholder. A default phone number on a road operator's contact page is
 * a wrong number published by the road operator, and the caller has no way to
 * know it was never real.
 * ------------------------------------------------------------------------- */

/** Keys this module owns, so the admin and the readers cannot drift apart. */
export const CONTACT_KEYS = {
  phone: 'contact.phone',
  email: 'contact.email',
  emergency: 'contact.emergency_phone',
  address: 'contact.address',
  hours: 'contact.hours',
};

export const SOCIAL_KEYS = {
  facebook: 'social.facebook',
  youtube: 'social.youtube',
  linkedin: 'social.linkedin',
  x: 'social.x',
};

function asString(value) {
  return typeof value === 'string' ? value.trim() : '';
}

/**
 * Pick a per-locale string out of a settings value, falling back to English.
 *
 * Accepts a plain string as well as a per-locale object: an operator who typed
 * one address before the field became translatable should not have their entry
 * silently disappear.
 */
export function localeString(value, locale) {
  if (typeof value === 'string') return value.trim();
  if (!isPlainObject(value)) return '';
  const exact = value[locale];
  if (typeof exact === 'string' && exact.trim()) return exact.trim();
  const base = value[DEFAULT_LOCALE];
  return typeof base === 'string' ? base.trim() : '';
}

/**
 * Everything the contact and safety pages need, in one read.
 *
 * One call rather than six: these render together on a page that also loads the
 * corridor, on a pool of five connections. `Promise.all` of six `getSetting`
 * calls would issue six queries for what is one small table.
 */
export async function getContactDetails(locale = DEFAULT_LOCALE) {
  let rows;
  try {
    rows = await query(
      `SELECT setting_key, value FROM site_settings WHERE setting_key IN (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        ...Object.values(CONTACT_KEYS),
        ...Object.values(SOCIAL_KEYS),
      ],
    );
  } catch {
    // Same rule as getSetting: a settings read must never take a page down.
    rows = null;
  }

  const raw = new Map();
  for (const row of rows || []) {
    try {
      raw.set(row.setting_key, asJson(row.value));
    } catch {
      // One malformed row degrades that field, never the whole page.
    }
  }

  const social = {};
  for (const [name, key] of Object.entries(SOCIAL_KEYS)) {
    const url = asString(raw.get(key));
    // Only https links are published. A social URL is an identity claim, and a
    // link typed without a scheme would resolve as a relative path on this site.
    if (/^https:\/\//i.test(url)) social[name] = url;
  }

  const details = {
    phone: asString(raw.get(CONTACT_KEYS.phone)),
    email: asString(raw.get(CONTACT_KEYS.email)),
    emergency: asString(raw.get(CONTACT_KEYS.emergency)),
    address: localeString(raw.get(CONTACT_KEYS.address), locale),
    hours: localeString(raw.get(CONTACT_KEYS.hours), locale),
    social,
  };

  // A PLAIN BOOLEAN, not a getter. This object is returned through
  // `unstable_cache`, which serialises what it stores — a getter does not
  // survive that round trip, so on every cached read `isEmpty` would come back
  // undefined. Falsy means "we have details", so the contact page would render
  // an empty list of contact details instead of the honest "not yet published"
  // notice: the exact failure this whole field is meant to prevent, and one that
  // only appears on the SECOND request, after the entry is warm.
  details.isEmpty = !details.phone && !details.email && !details.emergency
    && !details.address && !details.hours;

  return details;
}
