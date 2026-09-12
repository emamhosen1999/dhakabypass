/**
 * Helpers for the shared list filter (INT.5). Pure.
 *
 * `filterText` flattens whatever a row shows into one lower-cased string for
 * `data-filter-text`; tags are HTML-stripped and whitespace-collapsed so a
 * search for "toll" finds "Toll plaza" inside an answer's markup.
 */
export function filterText(...parts) {
  return parts
    .map((p) => (typeof p === 'string' ? p : ''))
    .join(' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[a-z#0-9]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLocaleLowerCase();
}

/** A tag value: trimmed, lower-cased, safe to join with `|`. */
export const tagValue = (s) => String(s || '').trim().toLocaleLowerCase().replace(/\|/g, ' ');

/** The union of tags across rows, in first-seen order, as {value,label}. */
export function tagUnion(rowsTags) {
  const seen = new Map();
  for (const tags of rowsTags) {
    for (const raw of tags || []) {
      const v = tagValue(raw);
      if (v && !seen.has(v)) seen.set(v, String(raw).trim());
    }
  }
  return [...seen].map(([value, label]) => ({ value, label }));
}

/** The `showFilter` select every filterable block declares. */
export const SHOW_FILTER_FIELD = {
  name: 'showFilter', type: 'select', label: 'Search box above the list', default: 'no',
  options: [{ value: 'no', label: 'No' }, { value: 'yes', label: 'Yes (appears when JavaScript is on; the full list always renders)' }],
};
export const wantsFilter = (data) => data?.showFilter === 'yes';
