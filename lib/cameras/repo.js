import { query } from '../db.js';
import { asJson, isPlainObject } from '../json.js';
import { validationError } from '../errors.js';
import { sealSecret, openSecret } from './secret.js';

/**
 * Corridor CCTV cameras — the records behind /admin/corridor/cameras and the
 * `camera-grid` block.
 *
 * A camera publishes a SNAPSHOT (a JPEG URL the camera or NVR refreshes) and,
 * optionally, a LIVE STREAM (an HLS playlist, the format browsers play). Both
 * are fetched by this server and passed through /api/cameras/<id>/…, so a
 * camera on a private address or behind a password is never exposed to a
 * visitor, and the site's content-security policy stays 'self'. A camera whose
 * stream is already public HTTPS may be delivered directly instead.
 *
 * `is_sample` marks a placeholder camera (a still photograph standing in for a
 * feed): the public tile says so, and replacing it with the real URL clears it.
 */
const COLUMNS = `id, names, chainage_m, direction, lat, lng, snapshot_url, stream_url, delivery,
  username, password_sealed, refresh_seconds, is_active, is_sample, sort_order, last_ok_at, last_error, updated_at`;

const shape = (row, { withSecrets = false } = {}) => {
  const names = asJson(row.names, {});
  const out = {
    id: Number(row.id),
    names: isPlainObject(names) ? names : {},
    chainage_m: row.chainage_m === null ? null : Number(row.chainage_m),
    direction: row.direction || '',
    lat: row.lat === null ? null : Number(row.lat),
    lng: row.lng === null ? null : Number(row.lng),
    snapshot_url: row.snapshot_url || '',
    stream_url: row.stream_url || '',
    delivery: row.delivery === 'direct' ? 'direct' : 'proxy',
    refresh_seconds: Number(row.refresh_seconds) || 30,
    is_active: Boolean(Number(row.is_active)),
    is_sample: Boolean(Number(row.is_sample)),
    sort_order: Number(row.sort_order) || 0,
    last_ok_at: row.last_ok_at || null,
    last_error: row.last_error || '',
    has_password: Boolean(row.password_sealed),
    username: row.username || '',
  };
  if (withSecrets) out.password = openSecret(row.password_sealed);
  return out;
};

export async function listCameras({ activeOnly = false } = {}) {
  const rows = (await query(
    `SELECT ${COLUMNS} FROM cameras ${activeOnly ? 'WHERE is_active = 1' : ''} ORDER BY sort_order, chainage_m, id`,
  )) || [];
  return rows.map((r) => shape(r));
}

/** The public view: no credentials, no upstream addresses. */
export function publicCamera(camera) {
  return {
    id: camera.id, names: camera.names, chainage_m: camera.chainage_m, direction: camera.direction,
    hasSnapshot: Boolean(camera.snapshot_url), hasStream: Boolean(camera.stream_url),
    streamSrc: camera.stream_url ? (camera.delivery === 'direct' ? camera.stream_url : `/api/cameras/${camera.id}/hls/index.m3u8`) : '',
    snapshotSrc: camera.snapshot_url ? (camera.snapshot_url.startsWith('/') ? camera.snapshot_url : `/api/cameras/${camera.id}/snapshot`) : '',
    refreshSeconds: camera.refresh_seconds, isSample: camera.is_sample, lastOkAt: camera.last_ok_at,
  };
}

export async function getCamera(id, { withSecrets = false } = {}) {
  const rows = await query(`SELECT ${COLUMNS} FROM cameras WHERE id = ? LIMIT 1`, [Number(id)]);
  return rows?.[0] ? shape(rows[0], { withSecrets }) : null;
}

const URL_RE = /^(https?:\/\/[^\s]+|\/[^\s]*)$/i;

export function parseCameraForm(form) {
  const text = (k) => String(form.get(k) ?? '').trim();
  const names = {};
  for (const l of ['en', 'bn', 'zh']) { const v = text(`name.${l}`); if (v) names[l] = v; }
  if (!names.en) throw validationError('Give the camera an English name, for example “Vogra Toll Plaza — northbound”.');
  const snapshot = text('snapshot_url');
  const stream = text('stream_url');
  for (const [label, v] of [['Snapshot address', snapshot], ['Stream address', stream]]) {
    if (v && !URL_RE.test(v)) throw validationError(`${label} must start with http://, https:// or / .`);
  }
  if (stream && !/\.m3u8(\?|$)/i.test(stream)) {
    throw validationError('The live stream must be an HLS playlist address ending in .m3u8. Ask the NVR supplier for its HLS output.');
  }
  const num = (k, lo, hi) => {
    const v = text(k);
    if (v === '') return null;
    const n = Number(v);
    if (!Number.isFinite(n) || n < lo || n > hi) throw validationError(`${k} must be a number between ${lo} and ${hi}.`);
    return n;
  };
  const delivery = text('delivery') === 'direct' ? 'direct' : 'proxy';
  if (delivery === 'direct' && stream && !/^https:\/\//i.test(stream)) {
    throw validationError('Direct delivery needs a public https:// stream; otherwise choose “through this website”.');
  }
  return {
    id: Number(text('id')) || null,
    names, chainage_m: num('chainage_m', 0, 100000), direction: text('direction').slice(0, 32),
    lat: num('lat', -90, 90), lng: num('lng', -180, 180),
    snapshot_url: snapshot, stream_url: stream, delivery,
    username: text('username').slice(0, 64), password: String(form.get('password') ?? ''),
    refresh_seconds: num('refresh_seconds', 5, 600) ?? 30,
    is_active: form.get('is_active') === 'on', is_sample: form.get('is_sample') === 'on',
    sort_order: num('sort_order', 0, 9999) ?? 0,
  };
}

export async function saveCamera(c) {
  const params = [JSON.stringify(c.names), c.chainage_m, c.direction, c.lat, c.lng, c.snapshot_url, c.stream_url,
    c.delivery, c.username, c.refresh_seconds, c.is_active ? 1 : 0, c.is_sample ? 1 : 0, c.sort_order];
  if (c.id) {
    const res = await query(
      `UPDATE cameras SET names=?, chainage_m=?, direction=?, lat=?, lng=?, snapshot_url=?, stream_url=?, delivery=?,
        username=?, refresh_seconds=?, is_active=?, is_sample=?, sort_order=? WHERE id=?`,
      [...params, c.id],
    );
    if (!res?.affectedRows) throw validationError('That camera no longer exists. Reload the page.');
    // A blank password field keeps the stored one; typing one replaces it.
    if (c.password) await query('UPDATE cameras SET password_sealed = ? WHERE id = ?', [sealSecret(c.password), c.id]);
    return c.id;
  }
  const res = await query(
    `INSERT INTO cameras (names, chainage_m, direction, lat, lng, snapshot_url, stream_url, delivery, username,
      refresh_seconds, is_active, is_sample, sort_order, password_sealed) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    [...params, sealSecret(c.password)],
  );
  return res.insertId;
}

export async function deleteCamera(id) {
  await query('DELETE FROM cameras WHERE id = ?', [Number(id)]);
}

export async function recordCameraHealth(id, ok, error = '') {
  await query(
    ok ? 'UPDATE cameras SET last_ok_at = CURRENT_TIMESTAMP, last_error = \'\' WHERE id = ?'
      : 'UPDATE cameras SET last_error = ? WHERE id = ?',
    ok ? [Number(id)] : [String(error).slice(0, 255), Number(id)],
  );
}
