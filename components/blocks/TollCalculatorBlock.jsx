import { getTollMatrixCached, getInterchangesCached } from '../../lib/corridor/cache';
import { getCorridorSectionSpansCached } from '../../lib/corridor/traffic-cache';
import { formatTaka, classLabel } from '../../lib/corridor/tolls';
import { localeName } from '../../lib/corridor/interchanges';
import { formatKm } from '../../lib/corridor/chainage';
import { CALC_KEYS, calculate, journeyMinutes } from '../../lib/corridor/toll-calculator';
import { isProvisional } from '../../lib/corridor/toll-matrix';
import { text } from '../../lib/blocks/items.js';
import { t } from '../../lib/i18n/ui';
import TollCalculatorResult from './TollCalculatorResult.jsx';

/**
 * INT.2 — the origin–destination toll calculator.
 *
 * Three inputs, one fare. Every operator in the 18-strong benchmark that has
 * a calculator asks the same three questions and returns a single answer;
 * PLUS Malaysia puts them on its home page and 407 ETR makes "Calculate Your
 * Trip" top-level navigation. Nobody leads with a matrix. `TollMatrixBlock`
 * (INT.1) prints the whole grid and stays — this is the tool a driver
 * actually uses, and it sits over the same rows.
 *
 * ---------------------------------------------------------------------------
 * IT IS A FORM, NOT A WIDGET
 * ---------------------------------------------------------------------------
 * A driver checking what they will pay must not depend on a bundle loading.
 * Many readers of this site are on a low-end Android over mobile data, and the
 * house pattern — CorridorExplorer, TabsBlock, FaqBlock, ContactForm — is
 * server-first with the script layered on top.
 *
 * So this is a real `<form method="get">` with three native `<select>`s and a
 * submit button. The selection lands in the query string, the SERVER computes
 * the answer from it, and the answer is in the HTML of the response. That is
 * the no-JS path, and it is also what makes a result LINKABLE: `?from=89&
 * to=97&class=microbus` is an address a driver can send to a colleague, which
 * a widget holding its state in memory can never be.
 *
 * The enhancement is `TollCalculatorResult`, a client component. It is
 * rendered on the server too, so the fallback and the enhancement are the
 * same markup rather than two copies that drift; hydration only adds
 * answering on `change` without a round trip, and rewriting the address bar so
 * the URL still names the journey on screen. `required` on each <select> means
 * a browser blocks a half-filled submit with no script at all, in the reader's
 * own language.
 *
 * ---------------------------------------------------------------------------
 * FIVE WAYS THIS COULD MISLEAD A DRIVER, AND WHERE EACH IS STOPPED
 * ---------------------------------------------------------------------------
 * 1. DIRECTION IS NEVER ASKED. `toll_od_rates` is keyed on the ordered pair
 *    plus a direction column, so a form field naming the direction would let
 *    a link quote the northbound fare for a southbound journey. It is derived
 *    from the two chainages in lib/corridor/toll-calculator.js and nowhere
 *    else, and a row whose stored direction contradicts the geometry is not
 *    quoted at all.
 * 2. THE SAME PLAZA TWICE IS NOT A JOURNEY. It is answered as such — with
 *    `aria-invalid` on both pickers — rather than falling through to "no fare
 *    published", which would be a different and untrue statement.
 * 3. A MISSING PAIR IS A GAP, NOT A NEIGHBOUR'S PRICE. Nothing here
 *    interpolates. The pickers offer only plazas the matrix actually prices
 *    (the corridor records nine `toll_plaza` rows; the seed prices six sites),
 *    and a pair or class with no row says so.
 * 4. THE PROVISIONAL WARNING HAS NO OFF SWITCH. It is driven by
 *    `is_provisional` — a STORED GENERATED column over `sro_number` that no
 *    UPDATE can write — read off the row that produced the figure on screen.
 *    There is no block field that reaches it and no `if (data.…)` guarding
 *    it; the field list is asserted against /provisional|notice|confirm|warn|
 *    disclaim/ in tests/unit/blocks-toll-calculator.test.jsx, and the block is
 *    rendered under eight hostile configurations to prove it survives them.
 *    It is bound to the answer with `aria-describedby`, so it is announced on
 *    reaching the figure rather than sitting above it to be scrolled past.
 * 5. JOURNEY TIME IS DERIVED OR OMITTED. See `journeyMinutes`. Today it is
 *    omitted on every journey, because all seven corridor sections read
 *    `avg_speed_kmh = NULL`, and the block says so in the reader's language
 *    using the string the map already uses for an unmeasured section.
 *
 * ---------------------------------------------------------------------------
 * NO NEW VISITOR-FACING COPY
 * ---------------------------------------------------------------------------
 * Plaza names come from `interchanges`, class names from
 * `toll_rates.class_labels` — both data, in the reader's language. Every label
 * is either an authored block field or an existing editable UI string:
 * `mapStartPoint`, `mapEndPoint`, `colVehicle`, `colToll`,
 * `mapMeasuredLength`, `mapKm`, `traffic_unknown`, `noTollRates`,
 * `provisional`, `provisionalBody`. Nothing was added to lib/i18n/ui.js.
 */
export default async function TollCalculatorBlock({ data = {}, locale, searchParams, blockId }) {
  // Both readers dead is a degraded block, never a stack trace in a browser —
  // the rule TollTableBlock and TollMatrixBlock already follow.
  let rates = [];
  let points = [];
  let sections = [];
  try {
    [rates, points, sections] = await Promise.all([
      getTollMatrixCached(), getInterchangesCached(), getCorridorSectionSpansCached(),
    ]);
  } catch { rates = []; points = []; sections = []; }

  // `searchParams` is a promise in Next 15 and a plain object in a test.
  // Awaiting it is what makes a route carrying this block render per request;
  // a page without the block never awaits and stays statically generated.
  let search = null;
  try { search = searchParams ? await searchParams : null; } catch { search = null; }

  const result = calculate({ rates, interchanges: points, sections, selection: search || {} });

  const heading = text(data.heading);
  const intro = text(data.intro);
  const empty = text(data.emptyMessage) || t(locale, 'noTollRates');

  const head = (
    <>
      {heading ? <h2 className="db-h2">{heading}</h2> : null}
      {intro ? <p className="db-lede">{intro}</p> : null}
    </>
  );

  // Nothing to ask about. A form whose every dropdown is empty is worse than
  // the authored message that says why.
  if (result.points.length < 2 || result.classes.length === 0) {
    return (
      <section className="db-block db-tollcalc">
        {head}
        <p className="db-empty-inline">{empty}</p>
      </section>
    );
  }

  const base = `db-tollcalc-${blockId ?? 'block'}`;
  const formId = `${base}-form`;
  const noticeId = `${base}-provisional`;

  // Authored first, then the editable UI string. Falling back rather than
  // requiring the field is the rule toll-table's caption already follows: it
  // guarantees the accessibility outcome instead of blocking a save on it.
  const label = {
    entry: text(data.entryLabel) || t(locale, 'mapStartPoint'),
    exit: text(data.exitLabel) || t(locale, 'mapEndPoint'),
    vehicle: text(data.vehicleLabel) || t(locale, 'colVehicle'),
    submit: text(data.submitLabel) || t(locale, 'colToll'),
    fare: text(data.fareLabel) || t(locale, 'colToll'),
    distance: text(data.distanceLabel) || t(locale, 'mapMeasuredLength'),
  };

  // The journey time is shown only when the operator has authored a name AND a
  // unit for it. There is no editable string for either, and "43" beside an
  // unlabelled figure, or "43 min" in a Bengali page, is worse than no row.
  const timeLabel = text(data.timeLabel);
  const timeUnit = text(data.timeUnit);
  const showTime = Boolean(timeLabel && timeUnit);

  const strings = {
    locale,
    fare: label.fare,
    distance: label.distance,
    km: t(locale, 'mapKm'),
    time: showTime ? timeLabel : '',
    timeUnit,
    notMeasured: t(locale, 'traffic_unknown'),
    provisionalTag: t(locale, 'provisional'),
    provisionalBody: t(locale, 'provisionalBody'),
    samePoint: text(data.samePointMessage) || empty,
    unpriced: text(data.unpricedMessage) || empty,
  };

  /**
   * Every answer, already computed and already formatted, for the client to
   * pick one out of. The enhancement does a Map lookup and no arithmetic —
   * it cannot produce a figure the server did not.
   *
   * Trailing empties are dropped: nearly every row has no gazette citation
   * yet, and 270 rows carrying three empty strings each is payload for
   * nothing.
   */
  const offered = new Set(result.points.map((p) => p.id));
  const byId = new Map(result.points.map((p) => [p.id, p]));
  const answers = [];
  for (const r of rates) {
    if (!offered.has(r.origin_interchange_id) || !offered.has(r.destination_interchange_id)) continue;
    const o = byId.get(r.origin_interchange_id);
    const d = byId.get(r.destination_interchange_id);
    const tuple = [
      r.origin_interchange_id, r.destination_interchange_id, r.vehicle_class,
      formatTaka(r.amount_bdt), formatKm(r.distance_m),
      // The SAME reader the server answer used, not a second opinion about
      // the same row. It fails towards the warning, so 1 means "warn" and 0
      // is only reachable with a citation the database itself verified.
      isProvisional(r) ? 1 : 0,
      showTime ? journeyMinutes(sections, o.chainage_m, d.chainage_m) : null,
      r.sro_number || '', r.sro_date || '', r.sro_link || '',
    ];
    while (tuple.length > 6 && (tuple[tuple.length - 1] === '' || tuple[tuple.length - 1] === null)) tuple.pop();
    answers.push(tuple);
  }

  const initial = result.status === 'priced'
    ? {
      status: 'priced',
      fare: formatTaka(result.amountBdt),
      km: formatKm(result.distanceM),
      provisional: result.provisional,
      minutes: showTime ? result.minutes : null,
      sroNumber: result.row.sro_number || '',
      sroDate: result.row.sro_date || '',
      sroLink: result.row.sro_link || '',
    }
    : { status: result.status, provisional: true };

  const samePoint = result.status === 'same-point';
  const selected = {
    from: result.originId === null ? '' : String(result.originId),
    to: result.destinationId === null ? '' : String(result.destinationId),
    vehicle: result.vehicleClass,
  };

  const plazaOptions = result.points.map((p) => (
    <option key={p.id} value={String(p.id)}>{localeName(p, locale) || p.names?.en || ''}</option>
  ));

  return (
    <section className="db-block db-tollcalc">
      {head}

      <form className="db-form db-tollcalc-form" method="get" id={formId}>
        <div className="db-tollcalc-fields">
          <div className="db-field">
            <label className="db-label" htmlFor={`${formId}-from`}>{label.entry}</label>
            <select
              className="db-input"
              id={`${formId}-from`}
              name={CALC_KEYS.from}
              defaultValue={selected.from}
              required
              aria-invalid={samePoint ? 'true' : undefined}
            >
              {/* An em dash, not a sentence: a placeholder option would be
                  visitor-facing copy with no editable string behind it, and
                  `required` already makes the browser insist on a choice. */}
              <option value="">—</option>
              {plazaOptions}
            </select>
          </div>

          <div className="db-field">
            <label className="db-label" htmlFor={`${formId}-to`}>{label.exit}</label>
            <select
              className="db-input"
              id={`${formId}-to`}
              name={CALC_KEYS.to}
              defaultValue={selected.to}
              required
              aria-invalid={samePoint ? 'true' : undefined}
            >
              <option value="">—</option>
              {plazaOptions}
            </select>
          </div>

          <div className="db-field">
            <label className="db-label" htmlFor={`${formId}-class`}>{label.vehicle}</label>
            <select
              className="db-input"
              id={`${formId}-class`}
              name={CALC_KEYS.vehicle}
              defaultValue={selected.vehicle}
              required
            >
              <option value="">—</option>
              {result.classes.map((c) => (
                <option key={c.vehicle_class} value={c.vehicle_class}>{classLabel(c, locale)}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Kept even once the panel answers on `change`: it is the only path
            with scripting off, and it is what a keyboard reader expects to
            reach at the end of three controls. */}
        <button type="submit" className="db-btn db-btn-primary">{label.submit}</button>
      </form>

      <TollCalculatorResult
        formId={formId}
        keys={CALC_KEYS}
        initial={initial}
        answers={answers}
        strings={strings}
        noticeId={noticeId}
      />
    </section>
  );
}
