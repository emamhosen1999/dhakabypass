import { getBlock } from './registry.js';
import { normalizeListItems, listItemFields } from './list.js';
import { sanitizeHtml } from '../html/sanitize.js';

/**
 * Reads only the fields the block type declares — anything else posted is
 * ignored. Form keys are prefixed `f.`.
 * Pure and synchronous, so it cannot live in the 'use server' module.
 *
 * This is the chokepoint every block save passes through, so it is also
 * where the two W1 guarantees are enforced:
 *
 *  - `richtext` is sanitised here, not in the editor. The editor is a
 *    contenteditable surface and a client component; anything it produces
 *    is a request body by the time it arrives, so trusting it would be
 *    trusting the browser.
 *  - `list` rows are normalised against the block type's declared row shape
 *    (`itemFields` / `itemType`), which is what lets the admin submit the
 *    repeater as one JSON payload without a second server contract.
 *  - a `richtext` sub-field INSIDE a row is sanitised by the same call. Four
 *    components render row-level HTML through dangerouslySetInnerHTML
 *    (person.bio, faq.answer, timeline.description, tabs.body); before W1.22
 *    only top-level rich text was cleaned, so a row was the one way editor
 *    HTML reached a page unsanitised. There is still exactly one sanitiser
 *    and one place it is called from.
 */
export function parseBlockForm(type, formData) {
  const def = getBlock(type);
  if (!def) return {};
  const out = {};
  for (const field of def.fields) {
    const raw = formData.get(`f.${field.name}`);
    if (field.type === 'number') {
      out[field.name] = Number(raw ?? 0) || 0;
    } else if (field.type === 'list') {
      let parsed;
      try {
        const value = JSON.parse(String(raw ?? '[]'));
        parsed = Array.isArray(value) ? value : [];
      } catch {
        parsed = [];
      }
      out[field.name] = sanitizeRows(field, normalizeListItems(field, parsed));
    } else if (field.type === 'richtext') {
      out[field.name] = sanitizeHtml(String(raw ?? ''));
    } else {
      out[field.name] = String(raw ?? '');
    }
  }
  return out;
}

/**
 * Runs `sanitizeHtml` over every sub-field the block type declared as
 * `richtext`, per row. Driven by the declaration rather than by key names, so
 * a new block type gets this by declaring its field and nothing else, and a
 * row key nobody declared is left exactly as it was found.
 */
function sanitizeRows(field, rows) {
  const rich = (listItemFields(field) || []).filter((f) => f.type === 'richtext');
  if (rich.length === 0) return rows;
  return rows.map((row) => {
    const out = { ...row };
    for (const f of rich) {
      out[f.name] = sanitizeHtml(typeof out[f.name] === 'string' ? out[f.name] : '');
    }
    return out;
  });
}
