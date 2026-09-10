import TollCalculatorBlock from '../../../components/blocks/TollCalculatorBlock.jsx';

/**
 * INT.2 — the origin–destination toll calculator. A PURELY LIVE block.
 *
 * THERE IS NO FARE FIELD HERE, NO DISTANCE FIELD, NO PLAZA FIELD AND NO SPEED
 * FIELD, and there must never be one. Every fare, distance, plaza name, class
 * name and journey time is read from `toll_od_rates`, `interchanges`,
 * `toll_rates` and `corridor_sections` at render time. This block owns
 * presentation only — which is the records-vs-blocks rule the client locked on
 * 2026-09-06: change the fact in its record screen, change how it looks in the
 * page.
 *
 * NOTHING HERE CAN SWITCH OFF THE PROVISIONAL NOTICE, and the absence of such
 * a field is asserted rather than assumed: tests/unit/blocks-toll-calculator
 * .test.jsx fails if any field name matches /provisional|notice|confirm|warn|
 * disclaim/, fails if any field is a checkbox, and renders the block under
 * eight hostile configurations. The notice itself comes off `is_provisional`,
 * a generated column no UPDATE can write (db/sql/12-toll-od-matrix.sql).
 *
 * ---------------------------------------------------------------------------
 * WHY SO MANY LABEL FIELDS
 * ---------------------------------------------------------------------------
 * Because the alternative is hardcoded English in a component. This site is
 * trilingual and every visitor-facing word must come from `ui_strings` or from
 * an authored, translatable block field — and `ui_strings` has no key for
 * "calculate", "estimated journey time" or "minutes", nor can one be added:
 * lib/i18n/ui.js is fallback-only and on the do-not-modify list for this task.
 *
 * So every label is a field, and every field that HAS a sensible existing
 * string behind it falls back to that string rather than to nothing — an
 * unlabelled <select> is an accessibility defect, and guaranteeing the outcome
 * beats blocking a save on it. The fallbacks are `mapStartPoint`,
 * `mapEndPoint`, `colVehicle`, `colToll` and `mapMeasuredLength`, all editable
 * at /admin/translations.
 *
 * The two time fields are the exception and have NO fallback: the journey-time
 * row appears only when an operator has authored both a name and a unit for
 * it. "43" beside an unlabelled figure, or "43 min" in the middle of a Bengali
 * page, is worse than no row at all.
 */
export default {
  type: 'toll-calculator',
  label: 'Toll calculator (live)',
  fields: [
    { name: 'heading', type: 'text', label: 'Heading' },
    { name: 'intro', type: 'text', label: 'Intro' },

    // ---- the three questions ----
    { name: 'entryLabel', type: 'text', label: 'Label for the entry toll plaza (blank = "Start")' },
    { name: 'exitLabel', type: 'text', label: 'Label for the exit toll plaza (blank = "End")' },
    { name: 'vehicleLabel', type: 'text', label: 'Label for the vehicle class (blank = "Vehicle class")' },
    { name: 'submitLabel', type: 'text', label: 'Text on the button (blank = "Toll")' },

    // ---- the one answer ----
    { name: 'fareLabel', type: 'text', label: 'Label above the fare (blank = "Toll")' },
    { name: 'distanceLabel', type: 'text', label: 'Label above the distance (blank = "Measured length")' },
    // Both required together or the row does not appear. See the note above.
    { name: 'timeLabel', type: 'text', label: 'Label above the journey time (blank = no journey time shown)' },
    { name: 'timeUnit', type: 'text', label: 'Unit for the journey time, e.g. min (blank = no journey time shown)' },

    // ---- when there is no answer ----
    // Never a number, and never silence. Each falls back to the editable
    // `noTollRates` string, which is also what `emptyMessage` overrides.
    {
      name: 'samePointMessage', type: 'text',
      label: 'Message when the same toll plaza is chosen twice',
    },
    {
      name: 'unpricedMessage', type: 'text',
      label: 'Message when no fare is published for the journey chosen',
    },
    { name: 'emptyMessage', type: 'text', label: 'Message when no fares are published at all' },
  ],
  Component: TollCalculatorBlock,
};
