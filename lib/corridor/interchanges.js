// lib/corridor/interchanges.js
import { query } from '../db.js';
import { DEFAULT_LOCALE } from '../i18n/locales.js';

const asJson = (v) => (typeof v === 'string' ? JSON.parse(v) : v);

const shape = (row) => ({
  ...row,
  names: row.names ? asJson(row.names) : {},
  facilities: row.facilities ? asJson(row.facilities) : [],
  lat: row.lat === null ? null : Number(row.lat),
  lng: row.lng === null ? null : Number(row.lng),
});

export async function listInterchanges() {
  const rows = (await query(
    `SELECT id, chainage_m, names, kind, status, connects_to, facilities, lat, lng
     FROM interchanges ORDER BY chainage_m, id`
  )) || [];
  return rows.map(shape);
}

/** Own-property read with English fallback — the names map is data, so a key
 *  like "constructor" must not resolve up the prototype chain. */
export function localeName(row, locale) {
  const names = row?.names || {};
  if (Object.hasOwn(names, locale) && names[locale]) return names[locale];
  if (Object.hasOwn(names, DEFAULT_LOCALE) && names[DEFAULT_LOCALE]) return names[DEFAULT_LOCALE];
  return '';
}

export async function saveInterchange({
  id = null, chainage_m, names = {}, kind = 'interchange',
  status = 'planned', connects_to = '', facilities = [], lat = null, lng = null,
}) {
  const ch = Number(chainage_m);
  if (!Number.isFinite(ch) || ch < 0) throw new Error('Chainage must be a number of metres');
  if (!names || !names.en) throw new Error('An English name is required');

  const params = [
    ch, JSON.stringify(names), kind, status, connects_to,
    JSON.stringify(facilities || []),
    lat === null || lat === '' ? null : Number(lat),
    lng === null || lng === '' ? null : Number(lng),
  ];

  if (id) {
    await query(
      `UPDATE interchanges SET chainage_m=?, names=?, kind=?, status=?, connects_to=?,
       facilities=?, lat=?, lng=? WHERE id=?`,
      [...params, id]
    );
    return id;
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
