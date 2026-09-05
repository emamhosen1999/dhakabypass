/**
 * The `menus` / `menu_items` tables, which have existed since the schema was
 * written and never had a reader.
 *
 * ---------------------------------------------------------------------------
 * An OVERRIDE, never the source of truth
 * ---------------------------------------------------------------------------
 * The navigation labels live in `lib/i18n/ui.js`, and the comment there says
 * why: a link label is chrome, and a nav built from a database read would empty
 * itself during an outage. On a host where every reader is deliberately written
 * to degrade rather than throw, a navigation bar that disappears is one of the
 * few degradations a visitor cannot work around.
 *
 * That reasoning still stands, so this does not replace it. A menu in the
 * database OVERRIDES the built-in list when it has items; when it is absent,
 * empty, or unreadable, the components fall back to the code default and the
 * site navigates exactly as it does today. An operator gains the ability to
 * reorder, rename or add a link without a deploy, and gives up no resilience.
 *
 * ---------------------------------------------------------------------------
 * Shape
 * ---------------------------------------------------------------------------
 * `menu_items.parent_id` is what makes one table serve both menus. The header
 * uses a flat list; the footer's items nest one level, where a parent is a
 * column heading and its children are the links under it. Anything deeper is
 * flattened away rather than rendered, because neither the header nor the
 * footer has a third level to put it in and silently dropping it is better than
 * emitting markup no stylesheet covers.
 *
 * `labels` is a per-locale JSON object, the same shape as `media.alt`.
 */

import { query, dbEnabled } from '../db.js';
import { DEFAULT_LOCALE } from '../i18n/locales.js';

/** A label for one locale, falling back to English, then to nothing. */
export function menuLabel(labels, locale) {
  let obj = labels;
  if (typeof obj === 'string') {
    const raw = obj.trim();
    try {
      obj = JSON.parse(raw);
    } catch {
      // Same rule as the gallery's alt text: a string that opens like JSON and
      // will not parse is corrupt, not a legacy plain label. Rendering it would
      // put `{oops` in the navigation bar.
      return /^[[{]/.test(raw) ? '' : raw;
    }
  }
  if (!obj || typeof obj !== 'object') return '';
  const exact = obj[locale];
  if (typeof exact === 'string' && exact.trim()) return exact.trim();
  const base = obj[DEFAULT_LOCALE];
  return typeof base === 'string' ? base.trim() : '';
}

/**
 * Build the nested item list from flat rows.
 *
 * Pure, so the nesting and ordering rules are testable without a database.
 * An item whose parent is missing is treated as top level rather than dropped:
 * losing a link silently is worse than showing it in the wrong place, and the
 * operator can see and fix the latter.
 */
export function nestMenuItems(rows, locale) {
  const items = (rows || []).map((r) => ({
    id: r.id,
    parentId: r.parent_id == null ? null : Number(r.parent_id),
    href: String(r.href || '').trim(),
    label: menuLabel(r.labels, locale),
    sortOrder: Number(r.sort_order) || 0,
  }));

  const byId = new Map(items.map((i) => [i.id, i]));
  const bySort = (a, b) => a.sortOrder - b.sortOrder || a.id - b.id;

  const top = [];
  for (const item of items) {
    // A label is required. An item with none would render as an empty link —
    // a tab stop that announces nothing to a screen reader and looks like a
    // rendering fault to everyone else.
    if (!item.label) continue;
    const parent = item.parentId != null ? byId.get(item.parentId) : null;
    if (!parent || parent === item) {
      top.push(item);
    } else {
      (parent.children ||= []).push(item);
    }
  }

  top.sort(bySort);
  for (const item of top) if (item.children) item.children.sort(bySort);
  return top;
}

/**
 * One menu by slug, or `[]`.
 *
 * `[]` is the signal to use the built-in navigation, and it is returned for
 * every failure mode — no such menu, no items, no database — because they all
 * mean the same thing to the caller: nothing here overrides the default.
 */
export async function getMenu(slug, locale = DEFAULT_LOCALE) {
  if (!dbEnabled()) return [];
  let rows;
  try {
    rows = await query(
      `SELECT i.id, i.parent_id, i.href, i.labels, i.sort_order
         FROM menu_items i
         JOIN menus m ON m.id = i.menu_id
        WHERE m.slug = ?
        ORDER BY i.sort_order, i.id`,
      [String(slug)],
    );
  } catch {
    // The navigation must never be the thing that takes a page down.
    return [];
  }
  return nestMenuItems(rows, locale);
}
