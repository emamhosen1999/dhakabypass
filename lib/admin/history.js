import { query, withTransaction, dbEnabled } from '../db.js';
import { validationError } from '../errors.js';
import { logError } from '../log.js';
import { entityDef, keyWhere, describe, diffRows, redactDetail, safeParse } from './entities.js';
import { currentActor, markAudited } from './context.js';

/**
 * History, trash and the activity log for every admin record (W7.4, W7.5).
 *
 * HISTORY. Before an operator's change lands, `recordHistory` copies the record
 * (and the rows that belong to it) as it stands into `record_history`. The
 * History panel compares each copy with the record now and puts one back with
 * `restoreHistory`, which first records the current state, so a restore can
 * itself be undone.
 *
 * TRASH. `trashEntity` copies the record and everything that goes with it into
 * `trash` and deletes them in one transaction. `restoreTrash` inserts them
 * again with their original ids. Entries older than TRASH_DAYS are purged.
 *
 * ACTIVITY. Every change through here writes `audit_log`: who, what, which
 * record, and a sentence naming it. runAction writes a plain row for actions
 * that do not come through here.
 *
 * Values are normalised when copied — dates as the local wall-clock strings
 * MySQL and MariaDB both accept back, JSON left as the driver returned it — so
 * a copy can be written back on either database.
 */
export const HISTORY_KEEP = 50;
export const TRASH_DAYS = 30;

const columnCache = new Map();

async function columns(q, table) {
  if (columnCache.has(table)) return columnCache.get(table);
  const rows = await q(
    `SELECT COLUMN_NAME AS name, DATA_TYPE AS type, EXTRA AS extra
       FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?
      ORDER BY ORDINAL_POSITION`,
    [table],
  );
  const meta = (rows || []).map((r) => ({
    name: r.name,
    type: String(r.type).toLowerCase(),
    generated: /\b(virtual|stored|persistent) generated\b|^(virtual|persistent|stored)$/i.test(String(r.extra || '')),
  }));
  columnCache.set(table, meta);
  return meta;
}

const pad = (n) => String(n).padStart(2, '0');

export function formatDbDate(d, type = 'timestamp') {
  if (!(d instanceof Date) || Number.isNaN(d.getTime())) return d;
  const day = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  if (type === 'date') return day;
  return `${day} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

export function normaliseRow(row, meta) {
  const types = new Map(meta.map((c) => [c.name, c.type]));
  const out = {};
  for (const [k, v] of Object.entries(row)) {
    if (v instanceof Date) out[k] = formatDbDate(v, types.get(k));
    else if (Buffer.isBuffer(v)) out[k] = v.toString('utf8');
    else out[k] = v;
  }
  return out;
}

async function selectRows(q, table, where, params) {
  const meta = await columns(q, table);
  const rows = (await q(`SELECT * FROM \`${table}\` WHERE ${where}`, params)) || [];
  return rows.map((r) => normaliseRow(r, meta));
}

/** The record and the rows that belong to it, or null when it is gone. */
export async function snapshotEntity(q, type, id) {
  const def = entityDef(type);
  const [w, p] = keyWhere(def, id);
  const own = await selectRows(q, def.table, w, p);
  if (!own.length) return null;
  const snap = { type, id: String(id), table: def.table, rows: { [def.table]: own } };
  for (const child of def.children || []) {
    const [cw, cp] = child.where(id, own[0]);
    const rows = await selectRows(q, child.table, cw, cp);
    const have = snap.rows[child.table] || [];
    const seen = new Set(have.map((r) => JSON.stringify(r)));
    snap.rows[child.table] = [...have, ...rows.filter((r) => !seen.has(JSON.stringify(r)))];
  }
  return snap;
}

function redactSnapshot(type, snap) {
  const def = entityDef(type);
  if (!def.redact?.length) return snap;
  const own = snap.rows[def.table].map((r) => {
    const copy = { ...r };
    for (const c of def.redact) delete copy[c];
    return copy;
  });
  return { ...snap, rows: { ...snap.rows, [def.table]: own } };
}

function toSqlValue(v) {
  if (v === undefined) return null;
  if (v !== null && typeof v === 'object') return JSON.stringify(v);
  return v;
}

async function writeRows(q, table, rows, { upsert = false } = {}) {
  if (!rows?.length) return;
  const meta = await columns(q, table);
  const writable = new Set(meta.filter((c) => !c.generated).map((c) => c.name));
  for (const row of rows) {
    const cols = Object.keys(row).filter((c) => writable.has(c));
    if (!cols.length) continue;
    const list = cols.map((c) => `\`${c}\``).join(', ');
    const marks = cols.map(() => '?').join(', ');
    const update = upsert ? ` ON DUPLICATE KEY UPDATE ${cols.map((c) => `\`${c}\` = VALUES(\`${c}\`)`).join(', ')}` : '';
    await q(`INSERT INTO \`${table}\` (${list}) VALUES (${marks})${update}`, cols.map((c) => toSqlValue(row[c])));
  }
}

export async function logAudit({ action, type = '', id = '', label = '', detail = null, actor } = {}) {
  if (!dbEnabled()) return;
  try {
    await query(
      'INSERT INTO audit_log (actor, action, target, label, detail) VALUES (?, ?, ?, ?, ?)',
      [
        String(actor ?? currentActor()).slice(0, 191),
        String(action).slice(0, 64),
        (type ? `${type}:${id}` : String(id)).slice(0, 191),
        String(label).slice(0, 255),
        detail ? JSON.stringify(redactDetail(detail)) : null,
      ],
    );
    markAudited();
  } catch (err) {
    logError('admin.audit_failed', err, { action });
  }
}

/**
 * Copy the record as it stands before a change. Returns the copy (or null when
 * the record does not exist yet, which is a create: nothing to go back to).
 */
export async function recordHistory(type, id, { action = 'update', q = null } = {}) {
  if (!dbEnabled() || id === null || id === undefined || id === '') return null;
  const run = async (qq) => {
    const snap = await snapshotEntity(qq, type, id);
    if (!snap) return null;
    const { label } = describe(type, snap);
    await qq(
      'INSERT INTO record_history (entity_type, entity_id, action, label, snapshot, actor) VALUES (?, ?, ?, ?, ?, ?)',
      [type, String(id), action, label.slice(0, 255), JSON.stringify(redactSnapshot(type, snap)), currentActor().slice(0, 191)],
    );
    const stale = await qq(
      `SELECT id FROM record_history WHERE entity_type = ? AND entity_id = ?
        ORDER BY created_at DESC, id DESC LIMIT 1000 OFFSET ${HISTORY_KEEP}`,
      [type, String(id)],
    );
    if (stale?.length) await qq(`DELETE FROM record_history WHERE id IN (${stale.map(() => '?').join(',')})`, stale.map((r) => r.id));
    return snap;
  };
  return q ? run(q) : run(query);
}

/**
 * Record, then change, then log — the shape of every admin save.
 * `mutate()` does the write; it runs after the copy is taken.
 */
export async function withHistory(type, id, mutate, { action = 'update', detail = null } = {}) {
  const before = await recordHistory(type, id, { action });
  const result = await mutate();
  const newId = id ?? (typeof result === 'number' || typeof result === 'string' ? result : null);
  let label = '';
  if (before) label = describe(type, before).label;
  else if (newId !== null && dbEnabled()) {
    try { const s = await snapshotEntity(query, type, newId); if (s) label = describe(type, s).label; } catch { label = ''; }
  }
  await logAudit({ action: `${type}.${before ? action : 'create'}`, type, id: newId ?? '', label, detail });
  return result;
}

/**
 * Move a record, and every row that belongs to it, to the trash.
 * `remove(q, snap)` may perform a record's own delete (a waypoint rebuilds its
 * sections, a picture moves its file); without it the rows are deleted
 * children-first.
 */
export async function trashEntity(type, id, { remove = null, detail = null } = {}) {
  const def = entityDef(type);
  const entry = await withTransaction(async (q) => {
    const snap = await snapshotEntity(q, type, id);
    if (!snap) throw validationError(`That ${def.noun} no longer exists. It may already have been deleted.`);
    const { label, summary } = describe(type, snap);
    const res = await q(
      'INSERT INTO trash (entity_type, entity_id, label, summary, payload, actor) VALUES (?, ?, ?, ?, ?, ?)',
      [type, String(id), label.slice(0, 255), summary.slice(0, 500), JSON.stringify(snap), currentActor().slice(0, 191)],
    );
    if (remove) {
      await remove(q, snap);
    } else {
      for (const child of [...(def.children || [])].reverse()) {
        if (def.restoreSkip?.includes(child.table)) continue;
        const [cw, cp] = child.where(id, snap.rows[def.table][0]);
        await q(`DELETE FROM \`${child.table}\` WHERE ${cw}`, cp);
      }
      const [w, p] = keyWhere(def, id);
      await q(`DELETE FROM \`${def.table}\` WHERE ${w}`, p);
    }
    return { trashId: res.insertId, label, summary, snap };
  });
  await logAudit({ action: `${type}.delete`, type, id, label: entry.label, detail });
  return entry;
}

const DUPLICATE = 'ER_DUP_ENTRY';

/** Put a trashed record back with its original ids. */
export async function restoreTrash(trashId, { after = null } = {}) {
  const entry = await withTransaction(async (q) => {
    const rows = await q('SELECT * FROM trash WHERE id = ? LIMIT 1', [Number(trashId)]);
    const row = rows?.[0];
    if (!row) throw validationError('That item is no longer in the trash.');
    const def = entityDef(row.entity_type);
    const snap = safeParse(row.payload);
    try {
      for (const [table, tableRows] of Object.entries(snap.rows || {})) {
        if (def.restoreSkip?.includes(table)) continue;
        await writeRows(q, table, tableRows);
      }
    } catch (err) {
      if (err?.code === DUPLICATE) {
        throw validationError(`${row.label} cannot be restored: something created since uses the same address or key. Rename or remove that first.`);
      }
      if (err?.code === 'ER_NO_REFERENCED_ROW_2' || err?.code === 'ER_NO_REFERENCED_ROW') {
        throw validationError(`${row.label} cannot be restored: something it belongs to has been deleted. Restore that first.`);
      }
      throw err;
    }
    if (after) await after(q, { type: row.entity_type, id: row.entity_id, snap });
    await q('DELETE FROM trash WHERE id = ?', [row.id]);
    return { type: row.entity_type, id: row.entity_id, label: row.label, href: def.href(row.entity_id, snap.rows?.[def.table]?.[0]) };
  });
  await logAudit({ action: `${entry.type}.restore`, type: entry.type, id: entry.id, label: entry.label });
  return entry;
}

/** Put a record back as it was in one history entry. The present state is recorded first. */
export async function restoreHistory(historyId, { after = null } = {}) {
  const found = await query('SELECT * FROM record_history WHERE id = ? LIMIT 1', [Number(historyId)]);
  const h = found?.[0];
  if (!h) throw validationError('That version is no longer kept.');
  const def = entityDef(h.entity_type);
  const snap = safeParse(h.snapshot);
  const result = await withTransaction(async (q) => {
    const now = await snapshotEntity(q, h.entity_type, h.entity_id);
    if (now) {
      await q(
        'INSERT INTO record_history (entity_type, entity_id, action, label, snapshot, actor) VALUES (?, ?, ?, ?, ?, ?)',
        [h.entity_type, h.entity_id, 'restore', describe(h.entity_type, now).label.slice(0, 255), JSON.stringify(redactSnapshot(h.entity_type, now)), currentActor().slice(0, 191)],
      );
    }
    try {
      for (const [table, rows] of Object.entries(snap.rows || {})) {
        if (def.restoreSkip?.includes(table)) continue;
        if (def.replaceChildren?.includes(table)) await q(`DELETE FROM \`${table}\``);
        await writeRows(q, table, rows, { upsert: true });
      }
    } catch (err) {
      if (err?.code === DUPLICATE) throw validationError('That version cannot be put back: its address or key is now used by another record.');
      throw err;
    }
    if (after) await after(q, { type: h.entity_type, id: h.entity_id, snap });
    return { type: h.entity_type, id: h.entity_id, label: h.label, createdAt: h.created_at, href: def.href(h.entity_id, snap.rows?.[def.table]?.[0]) };
  });
  await logAudit({ action: `${result.type}.restore_version`, type: result.type, id: result.id, label: result.label });
  return result;
}

/** Newest first, each with the fields that differ from the record now. */
export async function listHistory(type, id, { limit = 20 } = {}) {
  if (!dbEnabled()) return [];
  const def = entityDef(type);
  const rows = await query(
    `SELECT id, action, label, snapshot, actor, created_at FROM record_history
      WHERE entity_type = ? AND entity_id = ? ORDER BY created_at DESC, id DESC LIMIT ${Number(limit) || 20}`,
    [type, String(id)],
  );
  if (!rows?.length) return [];
  const now = await snapshotEntity(query, type, id);
  const current = now?.rows?.[def.table]?.[0] || {};
  return rows.map((r) => {
    const snap = safeParse(r.snapshot);
    const then = snap?.rows?.[def.table]?.[0] || {};
    return { id: r.id, action: r.action, label: r.label, actor: r.actor, createdAt: r.created_at, changes: diffRows(type, then, current) };
  });
}

export async function historyCounts(type, ids) {
  if (!dbEnabled() || !ids.length) return {};
  const rows = await query(
    `SELECT entity_id, COUNT(*) AS n FROM record_history WHERE entity_type = ? AND entity_id IN (${ids.map(() => '?').join(',')}) GROUP BY entity_id`,
    [type, ...ids.map(String)],
  );
  return Object.fromEntries((rows || []).map((r) => [r.entity_id, Number(r.n)]));
}

export async function listTrash({ limit = 100, offset = 0, type = '' } = {}) {
  if (!dbEnabled()) return { rows: [], total: 0 };
  const where = type ? 'WHERE entity_type = ?' : '';
  const params = type ? [type] : [];
  const rows = await query(
    `SELECT id, entity_type, entity_id, label, summary, actor, deleted_at FROM trash ${where}
      ORDER BY deleted_at DESC, id DESC LIMIT ${Number(limit) || 100} OFFSET ${Number(offset) || 0}`,
    params,
  );
  const total = await query(`SELECT COUNT(*) AS n FROM trash ${where}`, params);
  return { rows: rows || [], total: Number(total?.[0]?.n || 0) };
}

export async function getTrashEntry(id) {
  const rows = await query('SELECT * FROM trash WHERE id = ? LIMIT 1', [Number(id)]);
  const r = rows?.[0];
  return r ? { ...r, payload: safeParse(r.payload) } : null;
}

/** Remove trash entries for good. Returns them so a caller can remove files. */
export async function purgeTrash({ id = null, olderThanDays = TRASH_DAYS } = {}) {
  if (!dbEnabled()) return [];
  const where = id !== null ? 'id = ?' : `deleted_at < (NOW() - INTERVAL ${Number(olderThanDays)} DAY)`;
  const params = id !== null ? [Number(id)] : [];
  const rows = (await query(`SELECT id, entity_type, entity_id, label, payload FROM trash WHERE ${where}`, params)) || [];
  if (rows.length) await query(`DELETE FROM trash WHERE id IN (${rows.map(() => '?').join(',')})`, rows.map((r) => r.id));
  return rows.map((r) => ({ ...r, payload: safeParse(r.payload) }));
}

/**
 * Refuse a save over a change someone else made after the form was opened.
 * `stamp` is the record's `updated_at` as the form saw it (see stampOf).
 */
export async function assertUnchanged(type, id, stamp) {
  if (!stamp || !dbEnabled() || id === null || id === undefined || id === '') return;
  const def = entityDef(type);
  const [w, p] = keyWhere(def, id);
  const rows = await query(`SELECT updated_at FROM \`${def.table}\` WHERE ${w} LIMIT 1`, p);
  if (!rows?.length) return;
  const now = stampOf(rows[0].updated_at);
  if (!now || now === stamp) return;
  const last = await query(
    `SELECT actor, created_at FROM audit_log WHERE target = ? ORDER BY id DESC LIMIT 1`,
    [`${type}:${id}`],
  );
  const who = last?.[0]?.actor || 'someone else';
  const when = stampOf(rows[0].updated_at).slice(11, 16);
  throw validationError(`${who} changed this ${def.noun} at ${when}, after you opened it. Your edits are kept below: check them against the saved version and save again.`);
}

export function stampOf(value) {
  if (value instanceof Date) return formatDbDate(value);
  return value ? String(value).replace('T', ' ').slice(0, 19) : '';
}

export async function listActivity({ actor = '', type = '', q = '', limit = 50, offset = 0 } = {}) {
  if (!dbEnabled()) return { rows: [], total: 0 };
  const where = [];
  const params = [];
  if (actor) { where.push('actor = ?'); params.push(actor); }
  if (type) { where.push('target LIKE ?'); params.push(`${type}:%`); }
  if (q) { where.push('(label LIKE ? OR action LIKE ? OR target LIKE ?)'); params.push(`%${q}%`, `%${q}%`, `%${q}%`); }
  const clause = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const rows = await query(
    `SELECT id, actor, action, target, label, detail, created_at FROM audit_log ${clause}
      ORDER BY id DESC LIMIT ${Number(limit) || 50} OFFSET ${Number(offset) || 0}`,
    params,
  );
  const total = await query(`SELECT COUNT(*) AS n FROM audit_log ${clause}`, params);
  const actors = await query('SELECT DISTINCT actor FROM audit_log WHERE actor <> \'\' ORDER BY actor');
  return { rows: rows || [], total: Number(total?.[0]?.n || 0), actors: (actors || []).map((r) => r.actor) };
}
