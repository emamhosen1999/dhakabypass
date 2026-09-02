import { query } from '../db.js';

const COLS = 'id, path, width, height, bytes, mime, focal_x, focal_y, alt, origin, credit';

/**
 * Same defensive shape as lib/corridor's repositories: a malformed JSON value
 * in one row degrades that row, it never throws and takes down a page that
 * renders many rows.
 */
function shape(row) {
  let alt = null;
  try {
    alt = typeof row.alt === 'string' ? JSON.parse(row.alt) : row.alt;
  } catch { alt = null; }
  if (!alt || typeof alt !== 'object' || Array.isArray(alt)) alt = {};
  return { ...row, alt, width: Number(row.width) || 0, height: Number(row.height) || 0 };
}

export function mediaAlt(row, locale) {
  const alt = row && row.alt;
  if (!alt || typeof alt !== 'object' || Array.isArray(alt)) return '';
  const want = alt[locale];
  if (typeof want === 'string' && want) return want;
  return typeof alt.en === 'string' ? alt.en : '';
}

export async function listMedia({ origin } = {}) {
  const rows = origin
    ? await query(`SELECT ${COLS} FROM media WHERE origin = ? ORDER BY path`, [origin])
    : await query(`SELECT ${COLS} FROM media ORDER BY origin DESC, path`);
  return (rows || []).map(shape);
}

export async function getMediaByPath(path) {
  const rows = await query(`SELECT ${COLS} FROM media WHERE path = ? LIMIT 1`, [path]);
  return rows && rows.length ? shape(rows[0]) : null;
}
