// lib/corridor/tolls.js
import { query } from '../db.js';
import { asJson, isPlainObject } from '../json.js';
import { validationError } from '../errors.js';

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

/**
 * The published name of a vehicle class, in the reader's language.
 *
 * class_labels is DATA, not UI chrome — it lives per toll_rates row and is
 * authored in the admin, so there is no i18n key for it. Own-property reads
 * guard against a hand-edited row whose JSON object inherits from Object
 * prototype ('constructor', 'toString'), which a bare lookup would resolve up
 * the chain and render to a visitor.
 *
 * Falls back to the raw vehicle_class rather than to empty: an untranslated
 * identifier is ugly, but a nameless row beside a price is unreadable.
 *
 * A LABEL MUST BE A STRING, and that is checked rather than assumed. The
 * container being an object says nothing about the values inside it, and
 * {"en": {"text": "Car"}} — a plausible shape for an import or a hand-edited
 * row — used to be returned as-is straight into JSX, where React throws
 * "Objects are not valid as a React child" and takes down BOTH
 * /[locale]/travel/toll and the home page's toll preview. A non-string value
 * is treated as no label at all and falls through the same chain as a missing
 * one. This is the check mediaAlt() in lib/media/repo.js already makes.
 *
 * Shared by the toll page and the home page's toll preview. It must stay one
 * function: two copies of this fallback chain drifting apart would show a
 * different vehicle name for the same rate on two pages of the same site.
 */
export function classLabel(row, locale, defaultLocale = 'en') {
  const labels = row && row.class_labels;
  if (!labels || typeof labels !== 'object' || Array.isArray(labels)) {
    return (row && row.vehicle_class) || '';
  }
  const pick = (key) => {
    if (!Object.hasOwn(labels, key)) return '';
    const value = labels[key];
    return typeof value === 'string' ? value : '';
  };
  return pick(locale) || pick(defaultLocale) || row.vehicle_class || '';
}
