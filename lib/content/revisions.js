import { query, dbEnabled } from '../db.js';

/**
 * Block-translation history (W1.13).
 *
 * The `revisions` table has existed since the schema was written and was
 * never written to. It is now written on every save of a block translation:
 * BEFORE the new data lands, the row that is about to be overwritten is
 * copied here, so what the operator can get back is exactly what they had.
 * A first save (no prior row) records nothing — there is nothing to return
 * to.
 *
 * entity_type `block_translation`, entity_id = block id; the locale is in
 * the snapshot, because the table has no column for it and the snapshot is
 * self-describing anyway. Kept to the newest KEEP per block+locale so a
 * page edited fifty times a day does not grow without bound.
 */
export const ENTITY = 'block_translation';
export const KEEP = 20;

export async function recordRevision(q, { blockId, locale, data, status, userId = null }) {
  await q(
    'INSERT INTO revisions (entity_type, entity_id, snapshot, created_by) VALUES (?, ?, ?, ?)',
    [ENTITY, blockId, JSON.stringify({ locale, status, data }), userId],
  );
  // Trim beyond KEEP for this block+locale. Two statements because MySQL
  // will not DELETE with a LIMIT/OFFSET inside a subquery on the same table.
  const stale = await q(
    `SELECT id FROM revisions
      WHERE entity_type = ? AND entity_id = ? AND JSON_UNQUOTE(JSON_EXTRACT(snapshot, '$.locale')) = ?
      ORDER BY created_at DESC, id DESC LIMIT 1000 OFFSET ?`,
    [ENTITY, blockId, locale, KEEP],
  );
  if (stale?.length) await q(`DELETE FROM revisions WHERE id IN (${stale.map(() => '?').join(',')})`, stale.map((r) => r.id));
}

/** Newest first, for one block and locale. */
export async function listRevisions(blockId, locale, limit = KEEP) {
  if (!dbEnabled()) return [];
  const rows = await query(
    `SELECT r.id, r.snapshot, r.created_at, u.email AS created_by_email
       FROM revisions r LEFT JOIN users u ON u.id = r.created_by
      WHERE r.entity_type = ? AND r.entity_id = ? AND JSON_UNQUOTE(JSON_EXTRACT(r.snapshot, '$.locale')) = ?
      ORDER BY r.created_at DESC, r.id DESC LIMIT ?`,
    [ENTITY, blockId, locale, Number(limit)],
  );
  return (rows || []).map((r) => {
    const s = typeof r.snapshot === 'string' ? JSON.parse(r.snapshot) : r.snapshot;
    return { id: r.id, createdAt: r.created_at, by: r.created_by_email || '', status: s?.status || 'draft', data: s?.data || {} };
  });
}

export async function getRevision(id) {
  if (!dbEnabled()) return null;
  const rows = await query('SELECT id, entity_id, snapshot FROM revisions WHERE id = ? AND entity_type = ? LIMIT 1', [id, ENTITY]);
  const r = rows?.[0];
  if (!r) return null;
  const s = typeof r.snapshot === 'string' ? JSON.parse(r.snapshot) : r.snapshot;
  return { id: r.id, blockId: r.entity_id, locale: s?.locale, status: s?.status || 'draft', data: s?.data || {} };
}
