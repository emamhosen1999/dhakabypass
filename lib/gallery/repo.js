/**
 * Reading the public gallery.
 *
 * Separate from `lib/gallery.js`, which serves the legacy site from the
 * `gallery_images` table and is on the do-not-modify list. This one reads the
 * audited `media` library instead, which is where the localised alt text lives.
 *
 * Two things this deliberately does NOT do:
 *
 *   - It does not publish the whole media library. `in_gallery` decides, and it
 *     defaults to 0, so a logo or a diagram uploaded for a page block never
 *     appears here by accident. See scripts/db-setup-v8.mjs.
 *   - It does not filter the audit's rejected images. It cannot reach them:
 *     scripts/import-legacy-media.mjs refuses to register them at all, so they
 *     are absent from `media` rather than hidden within it. A filter here would
 *     imply the rows exist and suggest the real guard is this one.
 */

import { query, dbEnabled } from '../db.js';
import { DEFAULT_LOCALE } from '../i18n/locales.js';

/**
 * Alt text for one locale, falling back to English.
 *
 * `media.alt` is a JSON object keyed by locale, and mysql2 hands a MariaDB
 * LONGTEXT-backed JSON column back as a string — so it may arrive parsed or
 * unparsed depending on the column's declared type and the driver version.
 * Both are handled, because getting it wrong renders "[object Object]" into an
 * alt attribute, which is worse than no alt at all: a screen reader announces
 * it as though it were a description.
 */
export function altFor(alt, locale = DEFAULT_LOCALE) {
  let obj = alt;
  if (typeof obj === 'string') {
    const raw = obj.trim();
    try {
      obj = JSON.parse(raw);
    } catch {
      // Two different things arrive here and they must not be treated alike.
      //
      // A string that does not look like JSON is a pre-localisation alt — rows
      // written before `alt` became per-locale hold a bare sentence — and it is
      // the correct alt text to use.
      //
      // A string that opens with { or [ and fails to parse is CORRUPT JSON, and
      // returning it would render `{oops` into an alt attribute, where a screen
      // reader reads it aloud as the description of the photograph. Empty alt
      // marks the image decorative and skips it, which is the better failure.
      return /^[[{]/.test(raw) ? '' : raw;
    }
  }
  if (!obj || typeof obj !== 'object') return '';
  const value = obj[locale] || obj[DEFAULT_LOCALE] || '';
  return typeof value === 'string' ? value.trim() : '';
}

/**
 * The part of `media.credit` that belongs on a public page.
 *
 * `credit` doubles as a provenance record. `docs/source-data/2026-09-03-client-decisions.md`
 * §1 documents that photograph consent was recorded per image by writing
 * "DBEDC — consent confirmed 2026-09-03" into this column — an internal audit
 * note, appended to the actual credit with an em dash.
 *
 * Rendering the whole string publishes that note under the photograph, where it
 * reads to a visitor as a strange legal disclaimer and, worse, advertises which
 * specific images of identifiable people someone thought needed a consent check.
 * The credit is the part before the dash; the audit trail stays in the database
 * where it was put.
 *
 * Split on an em dash surrounded by spaces, so a credit that legitimately
 * contains a hyphen ("Roads and Highways Department - Zone 3") is untouched.
 */
export function publicCredit(credit) {
  const raw = String(credit || '').trim();
  if (!raw) return '';
  return raw.split(/\s+—\s+/)[0].trim();
}

/**
 * Images for the gallery, newest first.
 *
 * `limit` is clamped rather than trusted — this is a public page on a
 * memory-limited host, and an unbounded LIMIT reachable from a URL is how a
 * crawler turns a listing into an incident.
 */
export async function listGallery({ locale = DEFAULT_LOCALE, limit = 60 } = {}) {
  if (!dbEnabled()) return [];
  const take = Math.min(Math.max(Number(limit) || 60, 1), 200);

  // LIMIT takes no placeholder in a prepared statement; `take` is a bounded
  // integer by the line above, so no caller text reaches the SQL.
  const rows = await query(
    `SELECT id, path, width, height, alt, credit
       FROM media
      WHERE in_gallery = 1
      ORDER BY created_at DESC, id DESC
      LIMIT ${take}`,
  );
  if (!rows) return [];

  return rows.map((r) => ({
    id: r.id,
    path: r.path,
    // Width and height are carried through so the grid can reserve the right
    // box before the image loads. Without them every image lands at its
    // intrinsic size and the page reflows as each one arrives.
    width: Number(r.width) || null,
    height: Number(r.height) || null,
    alt: altFor(r.alt, locale),
    credit: publicCredit(r.credit),
  }));
}
