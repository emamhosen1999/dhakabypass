import { isPlainObject } from '../json.js';

/**
 * Shape an authored `data-table` into something that can be rendered as a
 * real table with real headers.
 *
 * Two authoring shapes are accepted for a row because both are natural in a
 * JSON editor and neither is worth telling an operator off for: an array of
 * cells, and `{ cells: [...] }`. Every row is then padded or truncated to the
 * declared column count, because a row with a missing cell silently shifts
 * every value after it into the wrong column — on a toll table that means
 * publishing the wrong price against the wrong vehicle.
 *
 * With no column headers declared the whole table is dropped rather than
 * rendered headerless: a table without `<th>` is unreadable to a screen
 * reader, and half a toll schedule is worse than none.
 */
export function normaliseTable(data) {
  const source = isPlainObject(data) ? data : {};
  const columns = Array.isArray(source.columns)
    ? source.columns.map(column)
    : [];
  if (columns.length === 0) return { columns: [], rows: [] };

  const raw = Array.isArray(source.rows) ? source.rows : [];
  const rows = [];
  for (const entry of raw) {
    const cells = Array.isArray(entry) ? entry
      : isPlainObject(entry) && Array.isArray(entry.cells) ? entry.cells
      : null;
    if (!cells) continue;
    rows.push(Array.from({ length: columns.length }, (_, i) => cell(cells[i])));
  }
  return { columns, rows };
}

function column(entry) {
  if (typeof entry === 'string') return { label: entry, numeric: false };
  if (isPlainObject(entry)) {
    return { label: cell(entry.label), numeric: flag(entry.numeric) };
  }
  return { label: '', numeric: false };
}

/**
 * The `numeric` flag as authored. The admin has no boolean control and posts
 * every field as text, so the declared sub-field is a number and arrives as
 * 1 or '1'; hand-written SQL and the seed files write a real `true`. All of
 * them mean the same thing, and anything else means "not a number column".
 */
const flag = (value) => value === true || value === 1 || value === '1' || value === 'true';

/** Anything that is not printable text becomes an empty cell, never "[object Object]". */
function cell(value) {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return '';
}
