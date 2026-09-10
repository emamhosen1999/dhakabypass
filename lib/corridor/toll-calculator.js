// lib/corridor/toll-calculator.js
//
// INT.2 — one journey, one answer.
//
// ---------------------------------------------------------------------------
// WHY THIS IS A MODULE AND NOT PART OF THE COMPONENT
// ---------------------------------------------------------------------------
// `TollMatrixBlock` prints thirty prices and lets the reader find their own.
// This prints ONE, which is the whole point — every peer operator in the
// benchmark asks for entry, exit and vehicle and returns a single figure — and
// a single figure is also the more dangerous shape: there is no surrounding
// grid for a driver to notice a wrong answer against. So the arithmetic and,
// more importantly, the REFUSALS live here, where they are testable without a
// database, a browser or a bundle.
//
// ---------------------------------------------------------------------------
// FOUR REFUSALS, EACH ONE A WAY A NUMBER COULD MISLEAD
// ---------------------------------------------------------------------------
//   * Direction is DERIVED from the two chainages and never read from the
//     request. `toll_od_rates` is keyed on the ordered pair AND a direction
//     column; a query string that could name the direction would let a link
//     quote the northbound fare for a southbound journey.
//   * The same plaza twice is not a journey. It is answered as such rather
//     than falling through to "no fare published", which would be a different
//     and untrue statement.
//   * A pair the matrix does not price is reported as unpriced. It is never
//     interpolated, never rounded off a neighbouring pair and never answered
//     with another class's fare. An honest gap is recoverable; a plausible
//     wrong price is what a driver budgets against.
//   * Journey time is derived from measured section speeds or it is omitted.
//     See `journeyMinutes` for the six conditions it insists on.
//
// ---------------------------------------------------------------------------
// PROVISIONAL DEFAULTS TO TRUE IN EVERY BRANCH
// ---------------------------------------------------------------------------
// `provisional` is set on the result even when there is no fare to qualify, so
// a caller that renders the warning from it cannot reach a state where the
// field is missing and the notice silently disappears. `isProvisional()` in
// ./toll-matrix.js is the single reader, and it fails towards the warning.
//
// This module is imported by the SERVER component only. The client enhancement
// is handed answers this module already computed rather than a copy of it —
// see components/blocks/TollCalculatorResult.jsx.

import { directionFor, isProvisional, tollPoints } from './toll-matrix.js';
import { isPlainObject } from '../json.js';

/**
 * The query-string keys, named once.
 *
 * The form's `name` attributes, the reader below and the client enhancement's
 * URL rewrite all read from here. Three separate string literals would work
 * until somebody renamed one of them, at which point a shared link would
 * silently answer for a different journey than the one it names.
 */
export const CALC_KEYS = Object.freeze({ from: 'from', to: 'to', vehicle: 'class' });

/** `searchParams` hands back a string, an array of strings, or nothing. */
const first = (value) => {
  if (Array.isArray(value)) return typeof value[0] === 'string' ? value[0] : '';
  return typeof value === 'string' ? value : '';
};

const own = (obj, key) => (isPlainObject(obj) && Object.hasOwn(obj, key) ? obj[key] : undefined);

/**
 * A plaza id, or null.
 *
 * `Number('')` is 0 and `Number(' 89 ')` is 89 — both are wrong here, so the
 * shape is checked before it is converted. An id that is not a positive
 * integer is not "plaza zero", it is a mangled link, and the difference
 * decides whether the reader gets an answer for the wrong journey or no
 * answer at all.
 */
const plazaId = (raw) => {
  const s = first(raw).trim();
  if (!/^[1-9][0-9]*$/.test(s)) return null;
  const n = Number(s);
  return Number.isSafeInteger(n) ? n : null;
};

/**
 * What the visitor chose, read off a plain query object.
 *
 * `chosen` is true the moment ANY of the three keys is present, including a
 * half-filled one: a form that was submitted and answered with the resting
 * state looks broken, so the caller needs to tell "not asked yet" from "asked
 * badly".
 */
export function readSelection(search) {
  const from = own(search, CALC_KEYS.from);
  const to = own(search, CALC_KEYS.to);
  const vehicle = own(search, CALC_KEYS.vehicle);
  return {
    originId: plazaId(from),
    destinationId: plazaId(to),
    vehicleClass: first(vehicle).trim(),
    chosen: from !== undefined || to !== undefined || vehicle !== undefined,
  };
}

const speed = (span) => {
  const n = Number(span && span.avg_speed_kmh);
  return Number.isFinite(n) && n > 0 ? n : null;
};

/**
 * Minutes for a journey between two chainages, or null.
 *
 * IT RETURNS NULL FAR MORE OFTEN THAN IT RETURNS A NUMBER, and that is the
 * design. There is no design-speed record anywhere in this schema: the only
 * speed the corridor stores is `corridor_sections.avg_speed_kmh`, which is a
 * MEASUREMENT — written by the TomTom refresh or typed by an operator, with
 * `measured_at` beside it — and it is NULL on all seven sections today. The
 * "design speed 80 km/h" sentence on the legacy site is marketing copy in a
 * `content` blob, not a record, and deriving a published journey time from a
 * sentence would be inventing one.
 *
 * So a time is produced only when all six of these hold, and null otherwise:
 * the journey has length; sections are supplied; every section the journey
 * crosses carries a positive speed; each of those carries a measurement time;
 * those sections cover the WHOLE journey with no gap; and the total is finite.
 * A partly-measured corridor yields no time at all rather than a time for the
 * measured part presented as the time for the journey.
 */
export function journeyMinutes(sections, fromM, toM) {
  if (!Array.isArray(sections) || sections.length === 0) return null;
  if (!Number.isFinite(fromM) || !Number.isFinite(toM)) return null;
  const lo = Math.min(fromM, toM);
  const hi = Math.max(fromM, toM);
  if (hi <= lo) return null;

  let covered = 0;
  let minutes = 0;
  for (const span of sections) {
    if (!isPlainObject(span)) continue;
    const a = Number(span.from_m);
    const b = Number(span.to_m);
    if (!Number.isFinite(a) || !Number.isFinite(b)) continue;
    const overlap = Math.min(hi, Math.max(a, b)) - Math.max(lo, Math.min(a, b));
    if (overlap <= 0) continue;

    // A section on the route with no usable measurement ends the whole
    // derivation. Skipping it would silently shorten the journey.
    const kmh = speed(span);
    if (kmh === null || !span.measured_at) return null;
    covered += overlap;
    minutes += (overlap / 1000) / kmh * 60;
  }

  // Sections tile the corridor, so anything short of full coverage means the
  // journey runs off the measured stretch.
  if (covered !== hi - lo) return null;
  if (!Number.isFinite(minutes) || minutes <= 0) return null;
  return Math.round(minutes);
}

const EMPTY = Object.freeze({
  origin: null, destination: null, direction: null, row: null,
  distanceM: null, amountBdt: null, minutes: null,
  // Never absent. A renderer reading this field cannot reach a state where the
  // provisional warning is skipped because the property was undefined.
  provisional: true,
});

/**
 * The one answer, or the reason there isn't one.
 *
 * `status` is the whole vocabulary of this module:
 *
 *   idle          nothing asked yet — the resting state of the form.
 *   incomplete    asked, but one of the three is still blank.
 *   same-point    entry and exit are the same plaza. Not a journey.
 *   unknown-point a chosen id is not a tolling point in this matrix.
 *   unpriced      a real journey the matrix does not price. An honest gap.
 *   priced        a fare, from one row, for the derived direction.
 *
 * `points` and `classes` are returned in every state because the form has to
 * be drawn in every state, and drawing it from the same call that answers it
 * means the options and the answer cannot come from different reads.
 */
export function calculate({ rates, interchanges, sections = [], selection } = {}) {
  const rows = Array.isArray(rates) ? rates.filter(isPlainObject) : [];
  const plazas = tollPoints(interchanges);
  const byId = new Map(plazas.map((p) => [p.id, p]));

  // Only plazas the matrix actually prices are offered. A plaza in
  // `interchanges` with no fare row would be a choice that can only ever
  // answer "not priced" — the corridor records nine `toll_plaza` rows and the
  // seed prices six sites, so this is the live case, not a hypothetical.
  const priced = new Set();
  const classes = [];
  for (const r of rows) {
    if (byId.has(r.origin_interchange_id)) priced.add(r.origin_interchange_id);
    if (byId.has(r.destination_interchange_id)) priced.add(r.destination_interchange_id);
    if (typeof r.vehicle_class === 'string' && r.vehicle_class
      && !classes.some((c) => c.vehicle_class === r.vehicle_class)) {
      classes.push(r);
    }
  }
  const points = plazas.filter((p) => priced.has(p.id));
  classes.sort((a, b) => (Number(a.class_order) || 999) - (Number(b.class_order) || 999)
    || a.vehicle_class.localeCompare(b.vehicle_class));

  const chose = readSelection(selection);
  const base = { ...EMPTY, ...chose, points, classes };

  if (!chose.chosen) return { ...base, status: 'idle' };
  if (chose.originId === null || chose.destinationId === null || !chose.vehicleClass) {
    return { ...base, status: 'incomplete' };
  }
  if (chose.originId === chose.destinationId) return { ...base, status: 'same-point' };

  const origin = byId.get(chose.originId) || null;
  const destination = byId.get(chose.destinationId) || null;
  if (!origin || !destination || !priced.has(origin.id) || !priced.has(destination.id)) {
    return { ...base, status: 'unknown-point' };
  }

  // THE ONE PLACE DIRECTION IS DECIDED. Increasing chainage is southbound —
  // the corridor runs Naojor (K0) to Madanpur (K47+611), which is what
  // `interchangeCaption` already publishes.
  const direction = directionFor(origin.chainage_m, destination.chainage_m);
  const found = rows.find((r) => r.origin_interchange_id === origin.id
    && r.destination_interchange_id === destination.id
    && r.vehicle_class === chose.vehicleClass);

  // A row whose stored direction contradicts the geometry is not quoted. The
  // column is redundant with the two chainages by design, so a disagreement
  // means one of them is wrong and there is no way to tell which — an honest
  // gap, not a coin toss between two fares.
  if (!found || (found.direction && found.direction !== direction)) {
    return { ...base, status: 'unpriced', origin, destination, direction };
  }

  const distanceM = Number.isInteger(found.distance_m) ? found.distance_m : null;
  return {
    ...base,
    status: 'priced',
    origin,
    destination,
    direction,
    row: found,
    distanceM,
    amountBdt: found.amount_bdt ?? null,
    // Read off the row, by the reader that fails towards the warning.
    provisional: isProvisional(found),
    minutes: distanceM === null
      ? null
      : journeyMinutes(sections, origin.chainage_m, destination.chainage_m),
  };
}
