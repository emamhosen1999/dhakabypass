// lib/corridor/segments.js
import { query, withTransaction } from '../db.js';
import { corridorExtent, openLength, percentOpen, overlaps } from './geometry.js';

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

/**
 * Marks an error as one of our own deliberate, user-facing validation
 * messages (bad input, an overlap, a row that's gone) rather than a driver
 * failure or a misconfiguration message. The admin action layer allowlists
 * on this `code` to decide what may reach the browser unchanged — see
 * `friendly()` in app/admin/(dash)/corridor/actions.js.
 */
function validationError(message) {
  const err = new Error(message);
  err.code = 'VALIDATION';
  return err;
}

const shape = (row) => {
  const labels = asJson(row.labels, {});
  return {
    ...row,
    labels: isPlainObject(labels) ? labels : {},
  };
};

export async function listSegments() {
  const rows = (await query(
    'SELECT id, from_m, to_m, status, opened_on, labels, sort_order FROM segments ORDER BY from_m, id'
  )) || [];
  return rows.map(shape);
}

/**
 * Insert or update one segment. Validation happens INSIDE the transaction with
 * the existing rows locked, so two concurrent saves cannot both pass an overlap
 * check and then both write.
 */
export async function saveSegment({ id = null, from_m, to_m, status, opened_on = null, labels = {} }) {
  // Normalise id to a number up front — form data hands it over as a string,
  // and a strict `===` against the numeric ids mysql2 returns would never
  // match, making a segment collide with its own stored row on every edit.
  const rowId = id === null || id === undefined || id === '' ? null : Number(id);
  if (rowId !== null && !Number.isFinite(rowId)) {
    throw validationError('Invalid segment id');
  }

  const from = Number(from_m);
  const to = Number(to_m);
  if (!Number.isFinite(from) || !Number.isFinite(to)) {
    throw validationError('Chainage must be a number of metres');
  }
  if (to <= from) {
    throw validationError('A segment must end after it starts');
  }

  return withTransaction(async (q) => {
    const existing = await q('SELECT id, from_m, to_m FROM segments FOR UPDATE');
    for (const row of existing) {
      if (rowId !== null && Number(row.id) === rowId) continue;
      if (overlaps({ from_m: from, to_m: to }, row)) {
        throw validationError('That range overlaps an existing segment');
      }
    }

    if (rowId !== null) {
      const res = await q(
        'UPDATE segments SET from_m=?, to_m=?, status=?, opened_on=?, labels=? WHERE id=?',
        [from, to, status, opened_on || null, JSON.stringify(labels || {}), rowId]
      );
      if (!res.affectedRows) {
        throw validationError('That segment no longer exists. It may have been deleted.');
      }
      return rowId;
    }
    const res = await q(
      'INSERT INTO segments (from_m, to_m, status, opened_on, labels) VALUES (?, ?, ?, ?, ?)',
      [from, to, status, opened_on || null, JSON.stringify(labels || {})]
    );
    return res.insertId;
  });
}

export async function deleteSegment(id) {
  await query('DELETE FROM segments WHERE id = ?', [id]);
}

/** The single source of the published progress figure. */
export async function corridorSummary() {
  const segments = await listSegments();
  return {
    extent: corridorExtent(segments),
    openLength: openLength(segments),
    percentOpen: percentOpen(segments),
    segments,
  };
}
