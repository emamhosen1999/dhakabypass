/**
 * The five traffic conditions, plus "not measured", in one place.
 *
 * WHY THIS FILE EXISTS. The condition ramp was declared inside
 * lib/corridor/view.js as a private constant, which was fine while the map was
 * the only thing that drew it. It no longer is: the `traffic-status` block
 * renders the same conditions as a table, and a second copy of the colour
 * table would drift — the map would call a section amber while the status
 * table beside it called the same section orange, and nothing in the suite
 * would notice. One table, two readers.
 *
 * COLOURS ARE TOKEN NAMES, never literals. Every value below is a variable
 * defined in app/design-tokens.css, where the measured contrast ratios are
 * recorded; a hex here would be a colour outside that system with no measured
 * ratio behind it.
 *
 * COLOUR IS NEVER THE ONLY CARRIER. `labelKey` is the word that goes with the
 * swatch — `traffic_free`, `traffic_heavy` — and both the map's section list
 * and the status table print it. A reader who cannot distinguish the ramp, or
 * is reading printed black and white, still gets the condition.
 *
 * No imports at all: this is a lookup table, and it is pulled in by both a
 * server component and lib/corridor/view.js.
 */

/** In ramp order, best to worst, with "not measured" last. */
export const CONDITIONS = ['free', 'moderate', 'slow', 'heavy', 'closed', 'unknown'];

/**
 * How bad each condition is, for sorting worst-first.
 *
 * `unknown` sorts LAST rather than worst. A section nobody has measured is not
 * a jam, and putting it at the top of a "worst first" list would report
 * congestion the road may not have.
 */
export const CONDITION_RANK = { closed: 0, heavy: 1, slow: 2, moderate: 3, free: 4, unknown: 5 };

export const CONDITION_COLOUR = {
  free: 'var(--db-open)',
  moderate: 'var(--db-traffic-moderate)',
  slow: 'var(--db-traffic-slow)',
  heavy: 'var(--db-alert)',
  closed: 'var(--db-ink-3)',
  unknown: 'var(--db-rule-2)',
};

/** The ui_strings key carrying this condition's word, in the reader's language. */
export const conditionLabelKey = (condition) => `traffic_${conditionKey(condition)}`;

/**
 * Whatever is in `corridor_sections.condition_key`, reduced to one of the six.
 *
 * The column is a varchar(16) with a default of 'unknown', so an operator's
 * hand-edited row, an import, or a future feed can put anything in it. An
 * unrecognised value becomes 'unknown' — "we do not know" is the only honest
 * reading of a condition nobody can interpret, and it is what the map has
 * always rendered for one (CONDITION_COLOUR's `|| unknown` fallback).
 */
export function conditionKey(value) {
  return typeof value === 'string' && Object.hasOwn(CONDITION_COLOUR, value) ? value : 'unknown';
}

export function conditionColour(value) {
  return CONDITION_COLOUR[conditionKey(value)];
}
