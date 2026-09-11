import { getMenuCached } from '../../lib/menus/cache.js';
import { localeHref } from '../../lib/blocks/href.js';
import { SECTION_MENU_SLUGS } from '../../lib/menus/slugs.js';
import { t } from '../../lib/i18n/ui.js';
import TravelSubnav from '../chrome/TravelSubnav.jsx';

const text = (v) => (typeof v === 'string' ? v.trim() : '');

/**
 * A section's sub-navigation, read from the menu the operator chose.
 *
 * Override, never replace: while the menu is empty or the database is down,
 * TravelSubnav renders its built-in list, so the travel pages never lose
 * their section navigation to an outage — the same rule the header and
 * footer follow (lib/menus/repo.js). Nested items are flattened: a sub-nav
 * is one row of links and has nowhere to put a second level.
 */
export default async function SectionSubnavBlock({ data, locale }) {
  const slug = SECTION_MENU_SLUGS.includes(data?.menu) ? data.menu : SECTION_MENU_SLUGS[0];
  let items = [];
  try { items = await getMenuCached(slug, locale); } catch { items = []; }

  const links = [];
  for (const item of items) {
    if (item.href && item.label) links.push({ href: localeHref(item.href, locale), label: item.label });
    for (const child of item.children || []) {
      if (child.href && child.label) links.push({ href: localeHref(child.href, locale), label: child.label });
    }
  }

  const label = text(data?.label) || t(locale, 'navTravel');
  return <TravelSubnav locale={locale} links={links} label={label} />;
}
