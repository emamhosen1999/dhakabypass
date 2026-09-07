/**
 * The ui_strings keys that name an interchange's kind and its status.
 *
 * Extracted from components/corridor/InterchangeTable.jsx when the
 * `interchange-table` BLOCK arrived, because both now render the same rows:
 * two copies of these maps would eventually show "Toll plaza" on one page and
 * the raw `toll_plaza` on another for the same record, and the drift would be
 * invisible in tests that render one component at a time.
 *
 * `kind` and `status` are varchar columns, so an import or a hand-edited row
 * can hold a value neither map names. Both lookups therefore fall back rather
 * than resolving to `undefined` and rendering an empty cell: an unknown kind
 * reads as an interchange, an unknown status as planned. Own-property reads,
 * because a value like "constructor" would otherwise walk the prototype chain
 * and hand a function name to `t()`.
 */

const KIND_KEY = {
  interchange: 'kindInterchange',
  toll_plaza: 'kindTollPlaza',
  service_area: 'kindServiceArea',
  u_loop: 'kindULoop',
  pedestrian_overpass: 'kindPedestrianOverpass',
  bridge: 'kindBridge',
};

const STATUS_KEY = { open: 'statusOpen', construction: 'statusConstruction', planned: 'statusPlanned' };

/** planned is a real, expected status — it must not visually collapse onto the
 *  same tag as construction just because both are "not yet open". */
const TAG_CLASS = { open: 'open', construction: 'build', planned: 'planned' };

const pick = (table, key, fallback) =>
  (typeof key === 'string' && Object.hasOwn(table, key) ? table[key] : fallback);

export const kindKey = (kind) => pick(KIND_KEY, kind, 'kindInterchange');
export const statusKey = (status) => pick(STATUS_KEY, status, 'statusPlanned');
export const statusTagClass = (status) => pick(TAG_CLASS, status, 'planned');
