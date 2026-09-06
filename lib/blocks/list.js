/**
 * The shape of one row of a `list` field.
 *
 * Before W1.2 a `list` field said only "this is an array" and the operator
 * hand-wrote JSON into a textarea. A block type may now declare either:
 *
 *   itemFields: [{ name, type, label }]   — rows are objects
 *   itemType: 'text'                      — rows are plain scalars
 *
 * Neither is required: a list field that declares no shape keeps the old
 * JSON textarea, so any block type written before this task still works and
 * any row key a block type has not (yet) declared is preserved on save
 * rather than silently dropped.
 *
 * Kept free of any other import: this module is pulled into the client
 * bundle by components/admin/ListField.jsx.
 */

/**
 * The sub-field types a list row may use.
 *
 * `richtext` was excluded until W1.22 to avoid a second sanitising path. It
 * is here now because there is still only one: row-level rich text is passed
 * through the same single `sanitizeHtml()` call in lib/blocks/form.js that
 * every top-level richtext field goes through, keyed off the sub-field type
 * declared here. Four blocks render row HTML — person.bio, faq.answer,
 * timeline.description, tabs.body — and all four are fed from that one call.
 *
 * `list` is a nested list of plain strings: the amenity tags on a rest-area
 * pin, and the cells of one data-table row. A table row is a variable-width
 * array of cells, which a flat object of scalars cannot express.
 */
export const ITEM_FIELD_TYPES = ['text', 'textarea', 'richtext', 'image', 'number', 'list'];

export function listItemFields(field) {
  if (!field || field.type !== 'list') return null;
  return Array.isArray(field.itemFields) && field.itemFields.length > 0 ? field.itemFields : null;
}

/** The scalar type of a list whose rows are not objects, or null. */
export function listItemType(field) {
  if (!field || field.type !== 'list') return null;
  if (listItemFields(field)) return null;
  return typeof field.itemType === 'string' && field.itemType ? field.itemType : null;
}

/** True when the admin can render a repeater rather than a JSON textarea. */
export function hasItemShape(field) {
  return Boolean(listItemFields(field) || listItemType(field));
}

export function emptyListItem(field) {
  const fields = listItemFields(field);
  if (!fields) return '';
  const row = {};
  for (const f of fields) row[f.name] = f.type === 'number' ? 0 : f.type === 'list' ? [] : '';
  return row;
}

const blankNested = (value) =>
  !Array.isArray(value) || value.every((entry) => String(entry ?? '').trim() === '');

const isBlank = (row, fields) => fields.every((f) => {
  if (f.type === 'number') return !row[f.name];
  if (f.type === 'list') return blankNested(row[f.name]);
  return row[f.name] === '';
});

/**
 * A nested list of plain strings inside one row.
 *
 * Every entry is kept — a blank one included — and anything unprintable
 * becomes an empty string rather than being dropped. Dropping would change
 * the LENGTH of the row, and for a data-table row that shifts every cell
 * after the gap into the wrong column: the exact failure lib/blocks/table.js
 * pads and truncates to prevent, which would be pointless if the value had
 * already been corrupted on save.
 */
function nestedList(value) {
  if (!Array.isArray(value)) return [];
  return value.map((entry) => (
    typeof entry === 'string' ? entry
      : typeof entry === 'number' && Number.isFinite(entry) ? String(entry)
        : ''
  ));
}

/**
 * Applied on save, after the JSON has been parsed. Coerces the declared
 * sub-fields, drops rows the operator added and never filled in, and leaves
 * undeclared keys exactly as they were.
 */
export function normalizeListItems(field, value) {
  if (!Array.isArray(value)) return [];

  const fields = listItemFields(field);
  if (fields) {
    // A row shape that is one nested list — a data-table row — also accepts
    // the bare array lib/blocks/table.js renders and the seed files write.
    // Without this the row is not an object, so the filter below drops it,
    // and the operator's first save of a seeded toll table would empty it.
    const cellsOnly = fields.length === 1 && fields[0].type === 'list' ? fields[0].name : null;
    return value
      .map((row) => (cellsOnly && Array.isArray(row) ? { [cellsOnly]: row } : row))
      .filter((row) => row && typeof row === 'object' && !Array.isArray(row))
      .map((row) => {
        const out = { ...row };
        for (const f of fields) {
          const raw = out[f.name];
          if (f.type === 'number') out[f.name] = Number(raw ?? 0) || 0;
          else if (f.type === 'list') out[f.name] = nestedList(raw);
          else if (raw === undefined || raw === null) out[f.name] = '';
          else if (typeof raw !== 'string') out[f.name] = String(raw);
        }
        return out;
      })
      .filter((row) => !isBlank(row, fields));
  }

  if (listItemType(field)) {
    return value
      .filter((v) => v !== null && v !== undefined && typeof v !== 'object')
      .map((v) => String(v).trim())
      .filter(Boolean);
  }

  // No declared shape: this list is still hand-authored JSON. Touching it
  // here would be the one way to lose data we cannot describe.
  return value;
}
