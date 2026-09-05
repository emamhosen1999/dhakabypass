/**
 * Navigation menus.
 *
 * These OVERRIDE the built-in navigation, so the failure that matters is a menu
 * that half-applies: an item with no label, a child whose heading was deleted,
 * or a corrupt row taking the whole navigation bar down. The site must always
 * end up with a usable set of links.
 */
import { describe, it, expect } from 'vitest';
import { menuLabel, nestMenuItems } from '../../lib/menus/repo.js';

const row = (id, over = {}) => ({
  id, parent_id: null, href: `/p${id}`, sort_order: 0,
  labels: { en: `Item ${id}` }, ...over,
});

describe('menuLabel', () => {
  it('returns the requested locale, falling back to English', () => {
    expect(menuLabel({ en: 'Travel', bn: 'ভ্রমণ' }, 'bn')).toBe('ভ্রমণ');
    expect(menuLabel({ en: 'Travel' }, 'zh')).toBe('Travel');
  });

  it('parses the JSON string the database hands back', () => {
    expect(menuLabel('{"en":"Travel"}', 'en')).toBe('Travel');
  });

  it('discards corrupt JSON rather than putting it in the navigation bar', () => {
    expect(menuLabel('{oops', 'en')).toBe('');
  });

  it('treats a non-JSON string as a plain label', () => {
    expect(menuLabel('Travel', 'bn')).toBe('Travel');
  });

  it('returns empty for junk rather than throwing', () => {
    for (const v of [null, undefined, 42, [], { en: 7 }]) expect(menuLabel(v, 'en')).toBe('');
  });
});

describe('nestMenuItems', () => {
  it('returns a flat list in sort order', () => {
    const out = nestMenuItems([
      row(1, { sort_order: 2 }), row(2, { sort_order: 1 }),
    ], 'en');
    expect(out.map((i) => i.id)).toEqual([2, 1]);
  });

  it('breaks ties by id, so the order is stable rather than arbitrary', () => {
    const out = nestMenuItems([row(9), row(3), row(5)], 'en');
    expect(out.map((i) => i.id)).toEqual([3, 5, 9]);
  });

  it('nests children under their parent and sorts them too', () => {
    const out = nestMenuItems([
      row(1),
      row(3, { parent_id: 1, sort_order: 2 }),
      row(2, { parent_id: 1, sort_order: 1 }),
    ], 'en');
    expect(out).toHaveLength(1);
    expect(out[0].children.map((c) => c.id)).toEqual([2, 3]);
  });

  it('drops an item with no usable label', () => {
    // An empty link is a tab stop that announces nothing to a screen reader and
    // looks like a rendering fault to everyone else.
    const out = nestMenuItems([row(1), row(2, { labels: {} })], 'en');
    expect(out.map((i) => i.id)).toEqual([1]);
  });

  it('promotes an orphan rather than losing it', () => {
    // Its heading was deleted. Showing the link in the wrong place is visible
    // and fixable; silently dropping it is neither.
    const out = nestMenuItems([row(2, { parent_id: 99 })], 'en');
    expect(out.map((i) => i.id)).toEqual([2]);
  });

  it('does not let an item parent itself into an invisible loop', () => {
    const out = nestMenuItems([row(1, { parent_id: 1 })], 'en');
    expect(out.map((i) => i.id)).toEqual([1]);
    expect(out[0].children).toBeUndefined();
  });

  it('returns an empty list for empty input, which is the signal to use the built-in nav', () => {
    expect(nestMenuItems([], 'en')).toEqual([]);
    expect(nestMenuItems(null, 'en')).toEqual([]);
  });

  it('keeps an href-less item, because a footer heading has no link', () => {
    const out = nestMenuItems([row(1, { href: '' })], 'en');
    expect(out).toHaveLength(1);
    expect(out[0].href).toBe('');
  });
});
