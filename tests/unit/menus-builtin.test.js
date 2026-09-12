import { describe, it, expect } from 'vitest';
import { MAIN_NAV, FOOTER_GROUPS, TRAVEL_NAV, builtinRows } from '../../lib/menus/builtin.js';
import { LOCALES } from '../../lib/i18n/locales.js';
import { t } from '../../lib/i18n/ui.js';

/**
 * W1.11: the built-in navigation is one definition read by the chrome and by
 * "Start from the built-in links". These pin the seed's shape.
 */
describe('builtinRows', () => {
  it('copies the main and travel lists flat, in order, with a label per locale', () => {
    const main = builtinRows('main');
    expect(main.map((r) => r.href)).toEqual(MAIN_NAV.map((n) => n.href));
    expect(main.map((r) => r.sortOrder)).toEqual([0, 1, 2, 3, 4, 5]);
    for (const r of main) {
      expect(r.parentIndex).toBeNull();
      for (const l of LOCALES) expect(r.labels[l]).toBeTruthy();
    }
    expect(main[0].labels.bn).toBe(t('bn', 'navTravel'));
    expect(builtinRows('travel').map((r) => r.href)).toEqual(TRAVEL_NAV.map((n) => n.href));
  });

  it('copies the footer as headings with their links nested one level', () => {
    const rows = builtinRows('footer');
    const headings = rows.filter((r) => r.parentIndex == null);
    expect(headings).toHaveLength(FOOTER_GROUPS.length);
    for (const h of headings) expect(h.href).toBe('');
    const links = rows.filter((r) => r.parentIndex != null);
    expect(links).toHaveLength(FOOTER_GROUPS.reduce((n, g) => n + g.links.length, 0));
    // Every link's parentIndex points at a heading row that precedes it.
    for (const l of links) {
      const parent = rows[l.parentIndex];
      expect(parent.parentIndex).toBeNull();
      expect(rows.indexOf(parent)).toBeLessThan(rows.indexOf(l));
    }
    expect(rows[1].labels.en).toBe(t('en', 'travelStatus'));
  });

  it('yields nothing for a slug it does not know', () => {
    expect(builtinRows('sidebar')).toEqual([]);
  });

  it('every built-in key resolves in every locale', () => {
    const keys = [...MAIN_NAV, ...TRAVEL_NAV, ...FOOTER_GROUPS.flatMap((g) => [{ key: g.heading }, ...g.links])].map((n) => n.key);
    for (const key of keys) for (const l of LOCALES) expect(t(l, key), `${key}/${l}`).not.toBe(key);
  });
});
