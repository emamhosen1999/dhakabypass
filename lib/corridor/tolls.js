// lib/corridor/tolls.js
import { query } from '../db.js';

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
 * messages rather than a driver failure or a misconfiguration message. The
 * admin action layer allowlists on this `code` to decide what may reach the
 * browser unchanged — see `friendly()` in app/admin/(dash)/corridor/actions.js.
 */
function validationError(message) {
  const err = new Error(message);
  err.code = 'VALIDATION';
  return err;
}

const shape = (row) => {
  const labels = asJson(row.class_labels, {});
  const methods = asJson(row.payment_methods, []);
  return {
    ...row,
    class_labels: isPlainObject(labels) ? labels : {},
    payment_methods: Array.isArray(methods) ? methods : [],
  };
};

// The corridor is in Bangladesh. Bangladesh Standard Time is a fixed
// UTC+6 with no daylight saving (none observed since 2009), so a fixed
// offset is exact here — no Intl/timezone-database machinery needed.
// Computing "today" from `toISOString()` (UTC) instead would hide a rate
// change or a road closure for the first ~6 hours of every Dhaka day,
// because the UTC calendar hasn't rolled over yet when it's already
// tomorrow in Dhaka. Do not "simplify" this back to `toISOString()`.
const DHAKA_UTC_OFFSET_MINUTES = 360;

const isoDate = (d) => {
  const dhaka = new Date(new Date(d).getTime() + DHAKA_UTC_OFFSET_MINUTES * 60000);
  return dhaka.toISOString().slice(0, 10);
};

/**
 * The rate IN FORCE for each vehicle class on `on` — the most recent row whose
 * effective_from has arrived. Publishing every historical row would put a
 * superseded price beside the current one.
 */
export async function listTollRates({ on = new Date() } = {}) {
  const cutoff = isoDate(on);
  const rows = (await query(
    `SELECT t.id, t.vehicle_class, t.class_labels, t.class_order, t.section,
            t.amount_bdt, t.effective_from, t.payment_methods
     FROM toll_rates t
     JOIN (
       SELECT vehicle_class, MAX(effective_from) AS eff
       FROM toll_rates WHERE effective_from <= ? GROUP BY vehicle_class
     ) cur ON cur.vehicle_class = t.vehicle_class AND cur.eff = t.effective_from
     WHERE t.effective_from <= ?
     ORDER BY t.class_order, t.vehicle_class`,
    [cutoff, cutoff]
  )) || [];
  return rows.map(shape);
}

/** Admin view: every row, superseded and future-dated included. */
export async function listAllTollRates() {
  const rows = (await query(
    `SELECT id, vehicle_class, class_labels, class_order, section, amount_bdt,
            effective_from, payment_methods
     FROM toll_rates ORDER BY class_order, vehicle_class, effective_from DESC`
  )) || [];
  return rows.map(shape);
}

export async function saveTollRate({
  id = null, vehicle_class, class_labels = {}, class_order = 0,
  section = '', amount_bdt, effective_from,
}) {
  const rowId = id === null || id === undefined || id === '' ? null : Number(id);
  if (rowId !== null && !Number.isFinite(rowId)) {
    throw validationError('Invalid toll rate id');
  }

  const amount = Number(amount_bdt);
  if (!Number.isFinite(amount) || amount < 0) {
    throw validationError('The toll amount must be zero or more');
  }
  if (!vehicle_class) throw validationError('A vehicle class is required');
  if (!effective_from) throw validationError('An effective date is required');

  const params = [
    vehicle_class, JSON.stringify(class_labels || {}), Number(class_order) || 0,
    section, amount, effective_from,
  ];
  if (rowId !== null) {
    const res = await query(
      `UPDATE toll_rates SET vehicle_class=?, class_labels=?, class_order=?, section=?,
       amount_bdt=?, effective_from=? WHERE id=?`,
      [...params, rowId]
    );
    if (!res.affectedRows) {
      throw validationError('That toll rate no longer exists. It may have been deleted.');
    }
    return rowId;
  }
  const res = await query(
    `INSERT INTO toll_rates (vehicle_class, class_labels, class_order, section, amount_bdt, effective_from)
     VALUES (?, ?, ?, ?, ?, ?)`,
    params
  );
  return res.insertId;
}

export async function deleteTollRate(id) {
  await query('DELETE FROM toll_rates WHERE id = ?', [id]);
}

/**
 * Taka with thousands separators. Paisa shown only when non-zero.
 * `amount_bdt` is a DECIMAL column, which mysql2 returns as a string, so a
 * numeric string like '250.00' must format the same as the number 250.
 */
export function formatTaka(amount) {
  if (amount === null || amount === undefined || amount === '') return '';
  const n = Number(amount);
  if (!Number.isFinite(n)) return '';
  const hasPaisa = Math.round(n * 100) % 100 !== 0;
  return `৳ ${n.toLocaleString('en-US', {
    minimumFractionDigits: hasPaisa ? 2 : 0,
    maximumFractionDigits: 2,
  })}`;
}
