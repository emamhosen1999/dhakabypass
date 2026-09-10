// lib/corridor/toll-matrix.js
//
// The origin–destination fare matrix — reader, writer, and the pure helpers
// the renderer and the admin screen share.
//
// ---------------------------------------------------------------------------
// WHY A SECOND TABLE RATHER THAN A COLUMN ON toll_rates
// ---------------------------------------------------------------------------
// `toll_rates` cannot express an O–D fare and cannot be made to without
// breaking what is live today. Its `section` is a free-text label, not a
// from/to pair, and `UNIQUE KEY uq_class_effective (vehicle_class,
// effective_from)` means the table PHYSICALLY CANNOT HOLD two sections' rates
// for one vehicle class on one date. All nine seeded rates share a section for
// that reason, not by coincidence. Widening that key would change the meaning
// of every row /travel/toll, `toll-table` and `toll-preview` read today, so
// `toll_od_rates` is added alongside and the flat rates are left exactly
// as they are. Migrating them is a separate, later decision.
//
// ---------------------------------------------------------------------------
// HOW A TOLLING POINT IS IDENTIFIED — AND WHAT IS NOT DONE HERE
// ---------------------------------------------------------------------------
// `findings-block-catalogue.md` lists, as one of four gaps that must close,
// that "toll plazas and bridges are name-matched, not typed records —
// lib/corridor/map-labels.js:17 string-replaces ' Toll Plaza' and ' Bridge'
// out of feature names". That defect is real, but it is a DISPLAY shortcut
// for shortening a label on a crowded map. The RECORD has always been typed:
// `interchanges.kind` is an enum with a `toll_plaza` member.
//
// So `tollPoints()` reads `kind` and nothing else. Nothing in this module, in
// the block, or in the admin screen matches a plaza by its name. A bridge
// called "Toll Plaza Bridge" is not a plaza here, and a plaza recorded as
// "K34" is.
//
// The one place a human did read names was the seed, once: the corridor
// records nine `toll_plaza` rows, several of which are the two carriageways of
// one physical site ("Vogra Toll Plaza (RHS)" and "(LHS)"), and collapsing
// those into six sites was an editorial judgement. It is recorded as chainage
// literals and comments in db/sql/12-toll-od-matrix.sql, where an operator can
// see and correct it — not as a rule in code that would silently re-derive it
// on every request.
//
// ---------------------------------------------------------------------------
// PROVISIONAL IS A PROPERTY OF THE ROW
// ---------------------------------------------------------------------------
// `is_provisional` is a STORED GENERATED column over `sro_number` (see the
// DDL). No UPDATE can set it; a fare becomes authoritative only when somebody
// types the citation that makes it authoritative. `isProvisional()` below is
// the reader-side counterpart and FAILS TOWARDS THE WARNING: anything it
// cannot positively confirm is provisional.

import { query } from '../db.js';
import { validationError } from '../errors.js';
import { asJson, isPlainObject } from '../json.js';

const str = (v) => (typeof v === 'string' ? v.trim() : '');

/**
 * The corridor runs north to south — Naojor (K0, Gazipur) to Madanpur
 * (K47+611, Narayanganj), which is what `interchangeCaption` already
 * publishes. Increasing chainage is therefore southbound.
 *
 * The column is redundant with the two chainages and that is deliberate: it
 * makes "every southbound fare from Vogra" one indexed predicate instead of a
 * join back to `interchanges`, and it is what an operator picks from when
 * adding a fare, so a mistake shows up as a constraint violation rather than
 * as a silently mislabelled row.
 */
export const DIRECTIONS = ['southbound', 'northbound'];

export function directionFor(originChainageM, destChainageM) {
  const a = originChainageM;
  const b = destChainageM;
  if (typeof a !== 'number' || typeof b !== 'number') return null;
  if (!Number.isFinite(a) || !Number.isFinite(b) || a === b) return null;
  return b > a ? 'southbound' : 'northbound';
}

/**
 * The tolling points a fare may run between: `interchanges` rows typed
 * `toll_plaza`, in chainage order. Pure, so the admin screen's <select> and
 * the block's column headers cannot disagree about what a plaza is.
 */
export function tollPoints(interchanges) {
  if (!Array.isArray(interchanges)) return [];
  return interchanges
    .filter((r) => isPlainObject(r) && r.kind === 'toll_plaza'
      && typeof r.chainage_m === 'number' && Number.isFinite(r.chainage_m))
    .slice()
    .sort((a, b) => a.chainage_m - b.chainage_m || a.id - b.id);
}

/** A complete gazette citation: a number AND the date it was notified. */
export function hasCitation(row) {
  return Boolean(row && str(row.sro_number) && str(row.sro_date));
}

/**
 * FAILS TOWARDS THE WARNING, and every branch of it is deliberate.
 *
 * A fare is treated as confirmed only when the database's own generated column
 * says so AND the citation that generated it is still on the row. A row that
 * claims `is_provisional = 0` with no `sro_number` cannot exist in a database
 * that ran the DDL — but it can arrive from a fixture, a partial import or a
 * replication mishap, and the cost of getting this backwards is a computed
 * number published as though it were the gazetted charge.
 */
export function isProvisional(row) {
  if (!isPlainObject(row)) return true;
  return !(Number(row.is_provisional) === 0 && str(row.sro_number) !== '');
}

const shape = (row) => {
  const labels = asJson(row.class_labels, {});
  const names = (v) => {
    const n = asJson(v, {});
    return isPlainObject(n) ? n : {};
  };
  return {
    ...row,
    class_labels: isPlainObject(labels) ? labels : {},
    origin_names: names(row.origin_names),
    destination_names: names(row.destination_names),
  };
};

// The rate IN FORCE for each (origin, destination, class) on a date, and the
// published NAME of its vehicle class read live from `toll_rates` rather than
// stored twice. Bangladesh Standard Time is a fixed UTC+6 — see the note in
// lib/corridor/tolls.js for why `toISOString()` alone is wrong here.
const DHAKA_UTC_OFFSET_MINUTES = 360;
const isoDate = (d) =>
  new Date(new Date(d).getTime() + DHAKA_UTC_OFFSET_MINUTES * 60000).toISOString().slice(0, 10);

const SELECT = `
  SELECT m.id, m.origin_interchange_id, m.destination_interchange_id, m.direction,
         m.vehicle_class, m.distance_m, m.amount_bdt, m.effective_from,
         m.derivation, m.sro_number, m.sro_date, m.sro_link, m.is_provisional,
         o.chainage_m AS origin_chainage_m, o.names AS origin_names,
         d.chainage_m AS destination_chainage_m, d.names AS destination_names,
         r.class_labels, r.class_order
  FROM toll_od_rates m
  JOIN interchanges o ON o.id = m.origin_interchange_id
  JOIN interchanges d ON d.id = m.destination_interchange_id
  LEFT JOIN toll_rates r
    ON r.vehicle_class = m.vehicle_class
   AND r.effective_from = (
     SELECT MAX(r2.effective_from) FROM toll_rates r2
     WHERE r2.vehicle_class = m.vehicle_class
   )`;

/** Public reader: only the fare in force today for each pair and class. */
export async function listTollOdRates({ on = new Date() } = {}) {
  const cutoff = isoDate(on);
  const rows = (await query(
    `${SELECT}
     JOIN (
       SELECT origin_interchange_id AS o, destination_interchange_id AS d,
              vehicle_class AS vc, MAX(effective_from) AS eff
       FROM toll_od_rates WHERE effective_from <= ?
       GROUP BY origin_interchange_id, destination_interchange_id, vehicle_class
     ) cur ON cur.o = m.origin_interchange_id AND cur.d = m.destination_interchange_id
          AND cur.vc = m.vehicle_class AND cur.eff = m.effective_from
     WHERE m.effective_from <= ?
     ORDER BY r.class_order, m.vehicle_class, o.chainage_m, d.chainage_m`,
    [cutoff, cutoff]
  )) || [];
  return rows.map(shape);
}

/** Admin view: every row, superseded and future-dated included. */
export async function listAllTollOdRates() {
  const rows = (await query(
    `${SELECT}
     ORDER BY r.class_order, m.vehicle_class, o.chainage_m, d.chainage_m, m.effective_from DESC`
  )) || [];
  return rows.map(shape);
}

const intField = (value, label) => {
  const n = Number(value);
  if (!Number.isInteger(n) || n <= 0) throw validationError(label);
  return n;
};

/**
 * `is_provisional` IS NOT A PARAMETER, and cannot become one: it is a
 * generated column, so naming it in an INSERT or UPDATE is a server error.
 * The citation fields are the only route out of provisional, which is exactly
 * the property the seed depends on.
 */
export async function saveTollOdRate({
  id = null, origin_interchange_id, destination_interchange_id, direction = null,
  vehicle_class, distance_m, amount_bdt, effective_from,
  derivation = 'gazette', sro_number = '', sro_date = '', sro_link = '',
}) {
  const rowId = id === null || id === undefined || id === '' ? null : Number(id);
  if (rowId !== null && !Number.isFinite(rowId)) throw validationError('Invalid fare id');

  const origin = intField(origin_interchange_id, 'Choose an entry toll plaza');
  const destination = intField(destination_interchange_id, 'Choose an exit toll plaza');
  if (origin === destination) {
    throw validationError('A journey must start and end at different toll plazas');
  }

  const dist = Number(distance_m);
  if (!Number.isInteger(dist) || dist < 0) {
    throw validationError('The distance must be a whole number of metres');
  }
  const amount = Number(amount_bdt);
  if (!Number.isFinite(amount) || amount < 0) throw validationError('The fare must be zero or more');
  if (!str(vehicle_class)) throw validationError('A vehicle class is required');
  if (!effective_from) throw validationError('An effective date is required');

  const dir = str(direction);
  if (dir && !DIRECTIONS.includes(dir)) {
    throw validationError('Direction must be southbound or northbound');
  }

  // A citation is a number AND a date or it is not a citation. The database
  // enforces this too (chk_toll_od_citation); it is repeated here so the
  // operator gets a sentence rather than a constraint name.
  const number = str(sro_number);
  const date = str(sro_date);
  if (number && !date) {
    throw validationError('A gazette citation needs both the S.R.O. number and its date');
  }
  if (!number && date) {
    throw validationError('Enter the S.R.O. number as well as the notification date');
  }

  const params = [
    origin, destination, dir || null, str(vehicle_class), dist, amount,
    effective_from, str(derivation) || 'gazette', number, date, str(sro_link),
  ];

  if (rowId !== null) {
    const res = await query(
      `UPDATE toll_od_rates SET origin_interchange_id=?, destination_interchange_id=?,
       direction=COALESCE(?, direction), vehicle_class=?, distance_m=?, amount_bdt=?,
       effective_from=?, derivation=?, sro_number=?, sro_date=?, sro_link=? WHERE id=?`,
      [...params, rowId]
    );
    if (!res.affectedRows) {
      throw validationError('That fare no longer exists. It may have been deleted.');
    }
    return rowId;
  }

  // Direction is required on an insert. Deriving it here from the two
  // chainages would need a second query and would disagree with the operator
  // the moment a plaza's surveyed chainage were corrected.
  if (!dir) throw validationError('Choose which carriageway this fare applies to');
  const res = await query(
    `INSERT INTO toll_od_rates (origin_interchange_id, destination_interchange_id,
     direction, vehicle_class, distance_m, amount_bdt, effective_from, derivation,
     sro_number, sro_date, sro_link) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    params
  );
  return res.insertId;
}

export async function deleteTollOdRate(id) {
  await query('DELETE FROM toll_od_rates WHERE id = ?', [id]);
}

/**
 * The shape a matrix renderer needs: the plazas that appear, in road order,
 * and a lookup from an ORDERED pair to its fare.
 *
 * Pure, and separate from the component for the reason every block helper here
 * is: putting the wrong fare in a cell prints a wrong price on a card somebody
 * pins up in a transport office, and that is testable without a database.
 *
 * A row whose plaza record has gone is dropped rather than rendered against a
 * blank header — the matrix would still show a price, under no name.
 */
export function buildMatrix(rates, interchanges, data = {}) {
  const empty = { vehicleClass: '', points: [], rows: [], cell: () => null, anyProvisional: false };
  if (!Array.isArray(rates)) return empty;

  const byId = new Map();
  for (const p of tollPoints(interchanges)) byId.set(p.id, p);

  const usable = rates.filter((r) => isPlainObject(r)
    && typeof r.vehicle_class === 'string' && r.vehicle_class
    && byId.has(r.origin_interchange_id) && byId.has(r.destination_interchange_id)
    && r.origin_interchange_id !== r.destination_interchange_id);
  if (usable.length === 0) return empty;

  // No class named: the lowest class_order present, which is the order the
  // gazette schedule itself uses — a car before a trailer, not whichever row
  // the database happened to return first.
  const wanted = str(data.vehicleClass);
  const chosen = wanted || usable
    .slice()
    .sort((a, b) => (Number(a.class_order) || 999) - (Number(b.class_order) || 999)
      || a.vehicle_class.localeCompare(b.vehicle_class))[0].vehicle_class;

  const rows = usable.filter((r) => r.vehicle_class === chosen);
  if (rows.length === 0) return { ...empty, vehicleClass: chosen };

  const ids = new Set();
  for (const r of rows) { ids.add(r.origin_interchange_id); ids.add(r.destination_interchange_id); }
  const points = [...ids].map((id) => byId.get(id)).sort((a, b) => a.chainage_m - b.chainage_m);

  const cells = new Map();
  for (const r of rows) cells.set(`${r.origin_interchange_id}>${r.destination_interchange_id}`, r);

  return {
    vehicleClass: chosen,
    points,
    rows,
    cell: (originId, destId) => cells.get(`${originId}>${destId}`) || null,
    anyProvisional: rows.some(isProvisional),
  };
}
