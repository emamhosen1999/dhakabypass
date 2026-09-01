// lib/corridor/advisories.js
import { query } from '../db.js';
import { DEFAULT_LOCALE } from '../i18n/locales.js';

/**
 * Parse a JSON column defensively. MySQL auto-parses JSON columns, so a
 * scalar value comes back already unwrapped (e.g. the string `cafe`) and
 * re-parsing it throws; MariaDB never auto-parses, so a malformed value
 * comes back as a plain string that parses but isn't the shape we need.
 * Either way a bad row must degrade to `fallback`, never crash the list.
 */
const asJson = (v, fallback) => {
  if (v == null) return fallback;
  if (typeof v !== 'string') return v;
  try {
    return JSON.parse(v);
  } catch {
    return fallback;
  }
};

const isPlainObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);

const shape = (row) => {
  const messages = asJson(row.messages, {});
  return {
    ...row,
    messages: isPlainObject(messages) ? messages : {},
  };
};

// Most severe first: a closure must never sit below an information notice.
const SEVERITY_RANK = { closure: 0, warning: 1, info: 2 };

// The corridor is in Bangladesh. Bangladesh Standard Time is a fixed
// UTC+6 with no daylight saving (none observed since 2009), so a fixed
// offset is exact here — no Intl/timezone-database machinery needed.
// starts_at/ends_at are stored as naive Dhaka wall-clock DATETIMEs, so
// comparing them against a UTC `at` (via `toISOString()`) would hide a
// closure scheduled for local midnight for the first ~6 hours of every
// Dhaka day, because the UTC calendar hasn't rolled over yet. Do not
// "simplify" this back to `toISOString()`.
const DHAKA_UTC_OFFSET_MINUTES = 360;

function sqlDateTime(d) {
  const dhaka = new Date(new Date(d).getTime() + DHAKA_UTC_OFFSET_MINUTES * 60000);
  return dhaka.toISOString().slice(0, 19).replace('T', ' ');
}

/** Active advisories whose window covers `at`, most severe first. */
export async function activeAdvisories({ at = new Date() } = {}) {
  const now = sqlDateTime(at);
  const rows = (await query(
    `SELECT id, severity, messages, starts_at, ends_at, is_active
     FROM advisories
     WHERE is_active = 1
       AND (starts_at IS NULL OR starts_at <= ?)
       AND (ends_at   IS NULL OR ends_at   >= ?)
     ORDER BY created_at DESC, id DESC`,
    [now, now]
  )) || [];
  return rows
    .map(shape)
    .sort((a, b) => (SEVERITY_RANK[a.severity] ?? 9) - (SEVERITY_RANK[b.severity] ?? 9));
}

/** Admin view: every advisory, active and inactive. */
export async function listAllAdvisories() {
  const rows = (await query(
    `SELECT id, severity, messages, starts_at, ends_at, is_active
     FROM advisories ORDER BY is_active DESC, created_at DESC`
  )) || [];
  return rows.map(shape);
}

export async function saveAdvisory({
  id = null, severity = 'info', messages = {},
  starts_at = null, ends_at = null, is_active = 1,
}) {
  const rowId = id === null || id === undefined || id === '' ? null : Number(id);
  if (rowId !== null && !Number.isFinite(rowId)) {
    throw new Error('Invalid advisory id');
  }
  if (!messages || !messages.en) throw new Error('An English message is required');

  const params = [
    severity, JSON.stringify(messages),
    starts_at || null, ends_at || null, is_active ? 1 : 0,
  ];
  if (rowId !== null) {
    await query(
      'UPDATE advisories SET severity=?, messages=?, starts_at=?, ends_at=?, is_active=? WHERE id=?',
      [...params, rowId]
    );
    return rowId;
  }
  const res = await query(
    'INSERT INTO advisories (severity, messages, starts_at, ends_at, is_active) VALUES (?, ?, ?, ?, ?)',
    params
  );
  return res.insertId;
}

export async function deleteAdvisory(id) {
  await query('DELETE FROM advisories WHERE id = ?', [id]);
}

/**
 * Own-property read with English fallback — the messages map is data, so a
 * key like "constructor" must not resolve up the prototype chain.
 *
 * `row.messages` is usually already the shaped object `activeAdvisories`/
 * `listAllAdvisories` produce, but this is an exported utility a future
 * caller may hand a raw, unshaped row (still a JSON string). Parse it
 * defensively the same way `shape()` does rather than trusting the shape —
 * `Object.hasOwn` on a boxed string checks index/length keys, not message
 * keys, so an un-parsed string would otherwise silently resolve to ''.
 */
export function localeMessage(row, locale) {
  const raw = row?.messages;
  const m = isPlainObject(raw) ? raw : asJson(raw, {});
  const messages = isPlainObject(m) ? m : {};
  if (Object.hasOwn(messages, locale) && messages[locale]) return messages[locale];
  if (Object.hasOwn(messages, DEFAULT_LOCALE) && messages[DEFAULT_LOCALE]) return messages[DEFAULT_LOCALE];
  return '';
}
