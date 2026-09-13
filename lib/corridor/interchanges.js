// lib/corridor/interchanges.js
import { query } from '../db.js';
import { DEFAULT_LOCALE } from '../i18n/locales.js';
import { asJson, isPlainObject } from '../json.js';
import { validationError } from '../errors.js';

const shape = (row) => {
  const names = asJson(row.names, {});
  const facilities = asJson(row.facilities, []);
  const connects = asJson(row.connects_to_labels, {});
  return {
    ...row,
    names: isPlainObject(names) ? names : {},
    connects_to_labels: isPlainObject(connects) ? connects : {},
    facilities: Array.isArray(facilities) ? facilities : [],
    lat: row.lat === null ? null : Number(row.lat),
    lng: row.lng === null ? null : Number(row.lng),
  };
};

export async function listInterchanges() {
  // `connects_to_labels` (per-locale, audit 4.13) arrived in
  // 31-cms-consistency.sql; before that file the list still reads, in English.
  let rows;
  try {
    rows = await query(
      `SELECT id, chainage_m, names, kind, status, connects_to, connects_to_labels, facilities, lat, lng
       FROM interchanges ORDER BY chainage_m, id`
    );
  } catch (err) {
    if (err?.code !== 'ER_BAD_FIELD_ERROR') throw err;
    rows = await query(
      `SELECT id, chainage_m, names, kind, status, connects_to, facilities, lat, lng
       FROM interchanges ORDER BY chainage_m, id`
    );
  }
  return (rows || []).map(shape);
}

/** What an interchange connects to, in the reader's language, English fallback. */
export function localeConnectsTo(row, locale) {
  return localeText(row?.connects_to_labels, locale) || String(row?.connects_to || '');
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
  status = 'planned', connects_to = '', connects_to_labels = null, facilities = [], lat = null, lng = null,
}) {
  const rowId = id === null || id === undefined || id === '' ? null : Number(id);
  if (rowId !== null && !Number.isFinite(rowId)) {
    throw validationError('Invalid interchange id');
  }

  const ch = Number(chainage_m);
  if (!Number.isFinite(ch) || ch < 0) throw validationError('Chainage must be a number of metres');
  if (!names || !names.en) throw validationError('An English name is required');

  // The per-locale map is the record; the plain column keeps the English
  // value so an older reader still has something to show.
  const connectsLabels = isPlainObject(connects_to_labels) ? connects_to_labels : (connects_to ? { en: connects_to } : {});
  const connectsEn = String(connectsLabels.en || connects_to || '').slice(0, 191);
  const params = [
    ch, JSON.stringify(names), kind, status, connectsEn, JSON.stringify(connectsLabels),
    JSON.stringify(facilities || []),
    lat === null || lat === '' ? null : Number(lat),
    lng === null || lng === '' ? null : Number(lng),
  ];

  if (rowId !== null) {
    const res = await query(
      `UPDATE interchanges SET chainage_m=?, names=?, kind=?, status=?, connects_to=?, connects_to_labels=?,
       facilities=?, lat=?, lng=? WHERE id=?`,
      [...params, rowId]
    );
    if (!res.affectedRows) {
      throw validationError('That interchange no longer exists. It may have been deleted.');
    }
    return rowId;
  }
  const res = await query(
    `INSERT INTO interchanges (chainage_m, names, kind, status, connects_to, connects_to_labels, facilities, lat, lng)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    params
  );
  return res.insertId;
}

export async function deleteInterchange(id) {
  await query('DELETE FROM interchanges WHERE id = ?', [id]);
}
