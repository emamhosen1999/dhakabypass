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

const shape = (row) => {
  const labels = asJson(row.class_labels, {});
  const methods = asJson(row.payment_methods, []);
  return {
    ...row,
    class_labels: isPlainObject(labels) ? labels : {},
    payment_methods: Array.isArray(methods) ? methods : [],
  };
};

const isoDate = (d) => new Date(d).toISOString().slice(0, 10);

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
    throw new Error('Invalid toll rate id');
  }

  const amount = Number(amount_bdt);
  if (!Number.isFinite(amount) || amount < 0) {
    throw new Error('The toll amount must be zero or more');
  }
  if (!vehicle_class) throw new Error('A vehicle class is required');
  if (!effective_from) throw new Error('An effective date is required');

  const params = [
    vehicle_class, JSON.stringify(class_labels || {}), Number(class_order) || 0,
    section, amount, effective_from,
  ];
  if (rowId !== null) {
    await query(
      `UPDATE toll_rates SET vehicle_class=?, class_labels=?, class_order=?, section=?,
       amount_bdt=?, effective_from=? WHERE id=?`,
      [...params, rowId]
    );
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
