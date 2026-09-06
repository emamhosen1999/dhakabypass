'use client';

import { useEffect, useRef, useState } from 'react';
import { listItemFields, listItemType, emptyListItem } from '../../lib/blocks/list';
import ImageField from './ImageField';
import RichTextField from './RichTextField';

/**
 * W1.2 — the repeater for `list` fields.
 *
 * Before this, a list was a textarea holding raw JSON: one misplaced comma
 * and `parseBlockForm` caught the parse error, substituted `[]`, and the save
 * succeeded with the whole list gone. Rows are now typed controls driven by
 * the block type's declared `itemFields` / `itemType`, and the JSON is
 * generated rather than typed.
 *
 * The server contract is unchanged on purpose: the whole list still posts as
 * one JSON string under `f.<name>`, which is exactly what `parseBlockForm`
 * already reads and what `normalizeListItems` already coerces. No second
 * save path, no per-row form keys, and a list field that declares no shape
 * still gets the old textarea (BlockFields decides that, not this file).
 *
 * Ordering is ↑ / ↓ buttons, not drag-and-drop. Drag-only reordering is
 * unusable from a keyboard or a switch, and the ICTD Inclusive Accessibility
 * Guideline 2022 (WCAG 2.1 AA aligned) is treated here as a legal
 * expectation rather than a nicety. The buttons are the primary control,
 * they are real `<button>`s, and focus follows the row that moved so a
 * keyboard user can press ↑ repeatedly without hunting for it again.
 *
 * Blank values are never dropped. A blank cell in a data-table row is the
 * difference between a column of figures and a column of figures shifted one
 * place left; `lib/blocks/list.js` pads rather than filters for that reason,
 * and this editor must not undo it upstream.
 */

/** "Cells" → "cell", "Amenities" → "amenity". Used for the ↑/↓ labels. */
function singular(label) {
  const s = String(label || '').trim().toLowerCase();
  if (!s) return 'item';
  if (s.endsWith('ies')) return `${s.slice(0, -3)}y`;
  if (s.endsWith('ses')) return s.slice(0, -2);
  if (s.endsWith('s')) return s.slice(0, -1);
  return s;
}

const rowLabel = (field) => field.itemLabel || singular(field.label);

const asText = (v) => (typeof v === 'string' ? v : v === null || v === undefined ? '' : String(v));

/** Every entry survives, blanks included — see the header. */
const asStrings = (v) => (Array.isArray(v) ? v.map(asText) : []);

/**
 * A row shape that is one nested list — a data-table row — also has to accept
 * the bare array the seed files write, because that is what is in the
 * database today. `normalizeListItems` makes the same allowance on save.
 */
const cellsOnlyKey = (fields) => (
  fields && fields.length === 1 && fields[0].type === 'list' ? fields[0].name : null
);

function seedRows(field, value) {
  const list = Array.isArray(value) ? value : [];
  const fields = listItemFields(field);

  if (!fields) {
    return list
      .filter((v) => v !== null && v !== undefined && typeof v !== 'object')
      .map((v) => String(v));
  }

  const cellsOnly = cellsOnlyKey(fields);
  return list.map((raw) => {
    const row = cellsOnly && Array.isArray(raw) ? { [cellsOnly]: raw } : raw;
    if (!row || typeof row !== 'object' || Array.isArray(row)) return emptyListItem(field);
    const out = { ...row };
    for (const f of fields) {
      if (f.type === 'list') out[f.name] = asStrings(out[f.name]);
      else if (f.type === 'number') out[f.name] = Number(out[f.name] ?? 0) || 0;
      else out[f.name] = asText(out[f.name]);
    }
    return out;
  });
}

const MOVE_BTN = 'px-2 py-1 border rounded text-xs bg-white hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed';

/** ↑ / ↓ / Remove for one row, at either nesting level. */
function RowControls({ index, total, itemLabel, onMove, onRemove, register }) {
  return (
    <div className="ml-auto flex gap-1 shrink-0">
      <button
        type="button"
        ref={(el) => register(`${index}:up`, el)}
        disabled={index === 0}
        aria-label={`Move ${itemLabel} ${index + 1} up`}
        title={`Move ${itemLabel} ${index + 1} up`}
        onClick={() => onMove(index, -1)}
        className={MOVE_BTN}
      >
        <span aria-hidden="true">↑</span>
      </button>
      <button
        type="button"
        ref={(el) => register(`${index}:down`, el)}
        disabled={index === total - 1}
        aria-label={`Move ${itemLabel} ${index + 1} down`}
        title={`Move ${itemLabel} ${index + 1} down`}
        onClick={() => onMove(index, 1)}
        className={MOVE_BTN}
      >
        <span aria-hidden="true">↓</span>
      </button>
      <button
        type="button"
        aria-label={`Remove ${itemLabel} ${index + 1}`}
        onClick={() => onRemove(index)}
        className="px-2 py-1 border rounded text-xs text-red-700 bg-white hover:bg-red-50"
      >
        Remove
      </button>
    </div>
  );
}

/** Focus follows the row that just moved, so ↑ can be pressed repeatedly. */
function useMoveFocus() {
  const refs = useRef(new Map());
  const [pending, setPending] = useState(null);

  useEffect(() => {
    if (!pending) return;
    refs.current.get(pending)?.focus();
    setPending(null);
  }, [pending]);

  const register = (key, el) => {
    if (el) refs.current.set(key, el);
    else refs.current.delete(key);
  };
  return { register, follow: setPending };
}

function move(list, index, delta) {
  const to = index + delta;
  if (to < 0 || to >= list.length) return list;
  const next = [...list];
  [next[index], next[to]] = [next[to], next[index]];
  return next;
}

/**
 * A row's React key has to be its identity, not its position.
 *
 * RichTextField seeds its contenteditable surface once and never re-renders
 * it (that is what keeps the caret alive). Keyed by index, moving row 2 above
 * row 1 would hand the same component instance a different row's HTML while
 * the surface still showed the old one — the editor would silently display
 * one answer and submit another. These ids move with the rows instead.
 */
let rowSeq = 0;
const nextId = () => { rowSeq += 1; return `row-${rowSeq}`; };
const idsFor = (rows) => rows.map(nextId);

/**
 * A list of plain strings: the vehicle-class keys on a toll preview, the
 * amenity tags on a rest area, the cells of one table row.
 */
function ScalarList({ label, itemLabel, values, onChange }) {
  const { register, follow } = useMoveFocus();

  const setAt = (i, v) => onChange(values.map((x, n) => (n === i ? v : x)));
  const onMove = (i, delta) => {
    onChange(move(values, i, delta));
    follow(`${i + delta}:${delta < 0 ? 'up' : 'down'}`);
  };

  return (
    <fieldset className="border rounded p-2 bg-white">
      <legend className="px-1 text-xs font-medium text-gray-600">{label}</legend>
      {values.length === 0 ? (
        <p className="text-xs text-gray-500 py-1">None yet.</p>
      ) : (
        <ol className="flex flex-col gap-1">
          {values.map((v, i) => (
            // eslint-disable-next-line react/no-array-index-key
            <li key={i} className="flex items-center gap-2">
              <span className="w-6 shrink-0 text-xs tabular-nums text-gray-400">{i + 1}</span>
              <input
                type="text"
                data-cell-input="true"
                value={v}
                aria-label={`${itemLabel} ${i + 1}`}
                onChange={(e) => setAt(i, e.target.value)}
                className="flex-1 min-w-0 border rounded px-2 py-1 text-sm"
              />
              <RowControls
                index={i}
                total={values.length}
                itemLabel={itemLabel}
                onMove={onMove}
                onRemove={(n) => onChange(values.filter((_, x) => x !== n))}
                register={register}
              />
            </li>
          ))}
        </ol>
      )}
      <button
        type="button"
        onClick={() => onChange([...values, ''])}
        className="mt-2 px-2 py-1 border rounded text-xs bg-white hover:bg-gray-100"
      >
        Add {itemLabel}
      </button>
    </fieldset>
  );
}

/**
 * One declared sub-field of one row.
 *
 * `textarea` opens as a single-line box for a short value and as a real
 * textarea for a long or multi-line one, with an explicit toggle either way.
 * The choice is made when the control mounts rather than on every keystroke:
 * swapping the element mid-typing would move focus out from under the
 * operator's hands. It is the same heuristic FieldInput.jsx already applies
 * on the legacy screens.
 */
function RowField({ field, value, onChange }) {
  const long = typeof value === 'string' && (value.length > 90 || value.includes('\n'));
  const [expanded, setExpanded] = useState(long);

  if (field.type === 'image') {
    return <ImageField label={field.label} value={value} onChange={onChange} />;
  }
  if (field.type === 'richtext') {
    return <RichTextField label={field.label} value={value} onChange={onChange} rows={5} />;
  }
  if (field.type === 'list') {
    return (
      <ScalarList
        label={field.label}
        itemLabel={rowLabel(field)}
        values={Array.isArray(value) ? value : []}
        onChange={onChange}
      />
    );
  }
  if (field.type === 'number') {
    return (
      <label className="flex flex-col text-xs font-medium gap-1">
        {field.label}
        <input
          type="number"
          value={value ?? 0}
          onChange={(e) => onChange(Number(e.target.value) || 0)}
          className="border rounded px-2 py-1 text-sm font-normal"
        />
      </label>
    );
  }
  if (field.type === 'textarea' && expanded) {
    return (
      <label className="flex flex-col text-xs font-medium gap-1">
        <span className="flex items-center gap-2">
          {field.label}
          <button
            type="button"
            onClick={() => setExpanded(false)}
            className="font-normal text-gray-500 underline"
          >
            Collapse
          </button>
        </span>
        <textarea
          value={value ?? ''}
          rows={4}
          onChange={(e) => onChange(e.target.value)}
          className="border rounded px-2 py-1 text-sm font-normal"
        />
      </label>
    );
  }
  return (
    <label className="flex flex-col text-xs font-medium gap-1">
      <span className="flex items-center gap-2">
        {field.label}
        {field.type === 'textarea' ? (
          <button
            type="button"
            onClick={() => setExpanded(true)}
            className="font-normal text-gray-500 underline"
          >
            Expand
          </button>
        ) : null}
      </span>
      <input
        type="text"
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        className="border rounded px-2 py-1 text-sm font-normal"
      />
    </label>
  );
}

export default function ListField({ name, field, value }) {
  const itemFields = listItemFields(field);
  const scalarType = listItemType(field);
  const itemLabel = rowLabel(field);

  const [state, setState] = useState(() => {
    const rows = seedRows(field, value);
    return { rows, ids: idsFor(rows) };
  });

  // The server re-renders this form after every save, and after a locale
  // switch. Adopt what it sent rather than keeping stale local rows — the
  // "adjust state during render" pattern, as in BlockSortableList.
  const incoming = JSON.stringify(value ?? []);
  const [seen, setSeen] = useState(incoming);
  if (seen !== incoming) {
    setSeen(incoming);
    const rows = seedRows(field, value);
    setState({ rows, ids: idsFor(rows) });
  }

  const { rows, ids } = state;
  const { register, follow } = useMoveFocus();

  const setRow = (i, next) => setState((s) => ({
    ...s, rows: s.rows.map((r, n) => (n === i ? next : r)),
  }));
  // Functional, not `{ ...rows[i] }` off the render closure: two sub-fields of
  // the same row can settle in one batch (an image picked while a rich-text
  // blur flushes), and the second write must not be built on a stale row.
  const setCell = (i, key, next) => setState((s) => ({
    ...s, rows: s.rows.map((r, n) => (n === i ? { ...r, [key]: next } : r)),
  }));
  const onMove = (i, delta) => {
    setState((s) => ({ rows: move(s.rows, i, delta), ids: move(s.ids, i, delta) }));
    follow(`${i + delta}:${delta < 0 ? 'up' : 'down'}`);
  };
  const onRemove = (i) => setState((s) => ({
    rows: s.rows.filter((_, n) => n !== i),
    ids: s.ids.filter((_, n) => n !== i),
  }));
  const onAdd = () => setState((s) => ({
    rows: [...s.rows, scalarType ? '' : emptyListItem(field)],
    ids: [...s.ids, nextId()],
  }));

  const cellsOnly = cellsOnlyKey(itemFields);

  return (
    <fieldset className="border rounded p-3">
      <legend className="px-1 text-sm font-medium">{field.label}</legend>
      {/* The one thing the server reads. Generated, never typed. */}
      <input type="hidden" name={name} value={JSON.stringify(rows)} readOnly />

      {rows.length === 0 ? (
        <p className="text-sm text-gray-500">
          No {itemLabel}s yet.
        </p>
      ) : (
        <ol className="flex flex-col gap-3">
          {rows.map((row, i) => (
            <li key={ids[i]} className="border rounded bg-gray-50 p-3 flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase tracking-wide text-gray-500">
                  {itemLabel} {i + 1} of {rows.length}
                </span>
                <RowControls
                  index={i}
                  total={rows.length}
                  itemLabel={itemLabel}
                  onMove={onMove}
                  onRemove={onRemove}
                  register={register}
                />
              </div>

              {scalarType ? (
                <input
                  type="text"
                  data-cell-input="true"
                  value={row}
                  aria-label={`${itemLabel} ${i + 1}`}
                  onChange={(e) => setRow(i, e.target.value)}
                  className="border rounded px-2 py-1 text-sm"
                />
              ) : cellsOnly ? (
                <ScalarList
                  label={itemFields[0].label}
                  itemLabel={rowLabel(itemFields[0])}
                  values={Array.isArray(row[cellsOnly]) ? row[cellsOnly] : []}
                  onChange={(next) => setCell(i, cellsOnly, next)}
                />
              ) : (
                <div className="grid gap-2 sm:grid-cols-2">
                  {itemFields.map((sub) => (
                    <div
                      key={sub.name}
                      className={sub.type === 'richtext' || sub.type === 'list' ? 'sm:col-span-2' : ''}
                    >
                      <RowField
                        field={sub}
                        value={row[sub.name]}
                        onChange={(next) => setCell(i, sub.name, next)}
                      />
                    </div>
                  ))}
                </div>
              )}
            </li>
          ))}
        </ol>
      )}

      <button
        type="button"
        onClick={onAdd}
        className="mt-3 px-3 py-1 border rounded text-sm bg-white hover:bg-gray-100"
      >
        Add {itemLabel}
      </button>
    </fieldset>
  );
}
