import { query } from './db.js';

const asJson = (v) => (typeof v === 'string' ? JSON.parse(v) : v);

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
