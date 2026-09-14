import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { MENU_SLUGS, SECTION_MENU_SLUGS } from '../../lib/menus/slugs.js';
import { TRAVEL_SECTION } from '../../components/chrome/TravelSubnav.jsx';
import def from '../../lib/blocks/types/section-subnav.js';
import { LOCALES } from '../../lib/i18n/locales.js';
import { t } from '../../lib/i18n/ui.js';

const root = path.resolve(import.meta.dirname, '../..');

/**
 * W1.11: the travel sub-navigation is menu-driven, with the code list as the
 * outage fallback. These pin the three things that keep that honest.
 */
describe('section-subnav menu', () => {
  it('offers only section menus, never the header or footer', () => {
    // A block re-rendering the main navigation halfway down a page is a second
    // copy of the same links.
    for (const slug of SECTION_MENU_SLUGS) {
      expect(MENU_SLUGS).toContain(slug);
      expect(['main', 'footer']).not.toContain(slug);
    }
    const menuField = def.fields.find((f) => f.name === 'menu');
    expect(menuField.type).toBe('select');
    expect(menuField.options.map((o) => o.value)).toEqual(SECTION_MENU_SLUGS);
    expect(SECTION_MENU_SLUGS).toContain(menuField.default);
  });

  it('every built-in fallback link points at a seeded travel page', () => {
    // The fallback renders during an outage. A link to a page that does not
    // exist would be a 404 offered precisely when the site is least able to
    // recover from one.
    const sql = fs.readdirSync(path.join(root, 'db/sql')).filter((f) => /^\d\d-.*\.sql$/.test(f))
      .map((f) => fs.readFileSync(path.join(root, 'db/sql', f), 'utf8')).join('\n');
    for (const item of TRAVEL_SECTION) {
      expect(sql, item.href).toContain(`'${item.href.replace(/^\//, '')}'`);
    }
  });

  it('every link in every built-in menu points at a page some SQL file seeds', async () => {
    const { MAIN_NAV, FOOTER_GROUPS, LEGAL_NAV, CTA_NAV } = await import('../../lib/menus/builtin.js');
    const sql = fs.readdirSync(path.join(root, 'db/sql')).filter((f) => /^\d\d-.*\.sql$/.test(f))
      .map((f) => fs.readFileSync(path.join(root, 'db/sql', f), 'utf8')).join('\n');
    const links = [...MAIN_NAV, ...LEGAL_NAV, ...CTA_NAV, ...FOOTER_GROUPS.flatMap((g) => g.links)];
    // A page row, or a redirect seeded for that address (/travel -> /travel/status).
    const missing = links.map((l) => l.href.replace(/^\//, ''))
      .filter((slug) => !sql.includes(`'${slug}'`) && !sql.includes(`'/en/${slug}'`));
    expect(missing).toEqual([]);
  });

  it('every built-in fallback label exists in all three locales', () => {
    for (const item of TRAVEL_SECTION) {
      for (const locale of LOCALES) {
        expect(t(locale, item.key), `${item.key}/${locale}`).not.toBe('');
        expect(t(locale, item.key)).not.toBe(item.key);
      }
    }
  });
});
