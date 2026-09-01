// lib/corridor/interchanges.js
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
  const names = asJson(row.names, {});
  const facilities = asJson(row.facilities, []);
  return {
    ...row,
    names: isPlainObject(names) ? names : {},
    facilities: Array.isArray(facilities) ? facilities : [],
    lat: row.lat === null ? null : Number(row.lat),
    lng: row.lng === null ? null : Number(row.lng),
  };
};

export async function listInterchanges() {
  const rows = (await query(
    `SELECT id, chainage_m, names, kind, status, connects_to, facilities, lat, lng
     FROM interchanges ORDER BY chainage_m, id`
  )) || [];
  return rows.map(shape);
}

/** Own-property read with English fallback — a locale map is data, so a key
 *  like "constructor" must not resolve up the prototype chain. Shared by
 *  localeName() below and the segment-label lookup in lib/corridor/strip.js
 *  so the two lookups cannot drift apart. */
export function localeText(map, locale) {
  const m = map || {};
  if (Object.hasOwn(m, locale) && m[locale]) return m[locale];
  if (Object.hasOwn(m, DEFAULT_LOCALE) && m[DEFAULT_LOCALE]) return m[DEFAULT_LOCALE];
  return '';
}

export function localeName(row, locale) {
  return localeText(row?.names, locale);
}

export async function saveInterchange({
  id = null, chainage_m, names = {}, kind = 'interchange',
  status = 'planned', connects_to = '', facilities = [], lat = null, lng = null,
}) {
  const rowId = id === null || id === undefined || id === '' ? null : Number(id);
  if (rowId !== null && !Number.isFinite(rowId)) {
    throw new Error('Invalid interchange id');
  }

  const ch = Number(chainage_m);
  if (!Number.isFinite(ch) || ch < 0) throw new Error('Chainage must be a number of metres');
  if (!names || !names.en) throw new Error('An English name is required');

  const params = [
    ch, JSON.stringify(names), kind, status, connects_to,
    JSON.stringify(facilities || []),
    lat === null || lat === '' ? null : Number(lat),
    lng === null || lng === '' ? null : Number(lng),
  ];

  if (rowId !== null) {
    const res = await query(
      `UPDATE interchanges SET chainage_m=?, names=?, kind=?, status=?, connects_to=?,
       facilities=?, lat=?, lng=? WHERE id=?`,
      [...params, rowId]
    );
    if (!res.affectedRows) {
      throw new Error('That interchange no longer exists. It may have been deleted.');
    }
    return rowId;
  }
  const res = await query(
    `INSERT INTO interchanges (chainage_m, names, kind, status, connects_to, facilities, lat, lng)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    params
  );
  return res.insertId;
}

export async function deleteInterchange(id) {
  await query('DELETE FROM interchanges WHERE id = ?', [id]);
}
