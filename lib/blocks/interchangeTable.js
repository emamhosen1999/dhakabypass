/**
 * Which interchange records the `interchange-table` block prints, in what
 * order, and which columns the operator asked for.
 *
 * Pure, so the ordering and the column set are testable without a database or
 * a renderer — the same split as lib/blocks/tollTable.js.
 */

const str = (value) => (typeof value === 'string' ? value.trim() : '');

export const INTERCHANGE_SORTS = ['chainage', 'chainage-desc', 'name'];

/**
 * The optional columns, in the order they are rendered.
 *
 * Location is not in this list because it is not optional: it is the row's
 * <th scope="row">, and a table whose rows have no identifying header is one
 * a screen-reader user reads as a grid of bare values. Every other column can
 * be switched off.
 *
 * Each is a `select` over yes/no on the block type rather than one list of
 * column names, because a list would be free text: an operator typing
 * "chainge" would lose a column with no error anywhere, which is exactly the
 * failure the `select` field type was added to lib/blocks/registry.js to
 * prevent.
 */
export const OPTIONAL_COLUMNS = ['chainage', 'type', 'connects', 'status', 'facilities'];

/** 'no' hides the column; anything else — including an absent value on a block
 *  saved before the field existed — shows it. Defaulting an unrecognised value
 *  to VISIBLE keeps a published table from silently losing a column. */
export function visibleColumns(data = {}) {
  const shown = {};
  for (const key of OPTIONAL_COLUMNS) {
    const field = `show${key.charAt(0).toUpperCase()}${key.slice(1)}`;
    shown[key] = data[field] !== 'no';
  }
  return shown;
}

/**
 * `limit` as the operator typed it, or 0 for "all of them". The home page
 * shows the first five and links to the route page for the rest; a number
 * below 1, blank, or not a number at all means no cut.
 */
export function rowLimit(data = {}) {
  const n = Math.floor(Number(data.limit));
  return Number.isFinite(n) && n > 0 ? n : 0;
}

/**
 * @param rows    rows from listInterchanges()
 * @param data    the block's config: `sort`, `limit`
 * @param nameOf  `(row) => localised name`, supplied by the component
 *
 * SURVEY WAYPOINTS ARE FILTERED OUT, by kind and never by name. They carry
 * coordinates so the corridor map can draw the polyline; a driver cannot use
 * one and "Waypoint 4" tells them nothing. lib/corridor/strip.js filters the
 * same records the same way for the same reason — a name-based filter would
 * start publishing these the moment DBEDC supplies a real name for one.
 *
 * A row with no name in any locale is dropped rather than rendered as an empty
 * row header: a nameless line in a wayfinding table is a line a driver cannot
 * act on, and it would be announced as a blank row header.
 */
export function selectInterchanges(rows, data = {}, nameOf = () => '', connectsOf = (r) => r.connects_to) {
  if (!Array.isArray(rows)) return [];
  const placed = rows
    .filter((r) => r && typeof r === 'object' && r.kind !== 'waypoint')
    .map((r) => ({
      id: r.id,
      name: str(nameOf(r)),
      kind: str(r.kind),
      status: str(r.status),
      connectsTo: str(connectsOf(r)),
      chainageM: Number.isFinite(Number(r.chainage_m)) ? Number(r.chainage_m) : 0,
      facilities: Array.isArray(r.facilities) ? r.facilities.map(str).filter(Boolean) : [],
    }))
    .filter((r) => r.name !== '');

  const sort = INTERCHANGE_SORTS.includes(data.sort) ? data.sort : 'chainage';
  const out = [...placed];
  if (sort === 'name') {
    // localeCompare with no locale argument: the names are Bangla, Chinese and
    // English in the same column depending on the reader, and the runtime's
    // default collation is the closest thing available to "the reader's own
    // alphabetical order" without shipping a collation table.
    out.sort((a, b) => a.name.localeCompare(b.name) || a.chainageM - b.chainageM);
  } else if (sort === 'chainage-desc') {
    out.sort((a, b) => b.chainageM - a.chainageM || Number(a.id) - Number(b.id));
  } else {
    out.sort((a, b) => a.chainageM - b.chainageM || Number(a.id) - Number(b.id));
  }
  // Cut AFTER sorting, so "the first five" means the first five in the order
  // the operator chose, not the first five rows the database happened to return.
  const limit = rowLimit(data);
  return limit ? out.slice(0, limit) : out;
}
