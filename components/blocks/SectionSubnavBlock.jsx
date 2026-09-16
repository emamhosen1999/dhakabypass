import { getMenuCached } from '../../lib/menus/cache.js';
import { localeHref } from '../../lib/blocks/href.js';
import { SECTION_MENU_SLUGS } from '../../lib/menus/slugs.js';
import { sectionMenuSlugs } from '../../lib/menus/section-menus.js';
import { t } from '../../lib/i18n/ui.js';
import TravelSubnav from '../chrome/TravelSubnav.jsx';
import { pageSummaries } from '../../lib/content/page-summaries.js';
import { stripLocale } from '../../lib/seo/routes.js';
import Link from 'next/link';

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
  // Any menu the operator has made, not a list frozen in code (W8N.3). An
  // unknown value falls back to the built-in travel links rather than to
  // nothing, which is the rule the header and footer follow.
  let allowed = SECTION_MENU_SLUGS;
  try { allowed = await sectionMenuSlugs(); } catch { allowed = SECTION_MENU_SLUGS; }
  const slug = allowed.includes(data?.menu) ? data.menu : SECTION_MENU_SLUGS[0];
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

  /**
   * The section index (W8N.3 follow-up). A hub whose whole body was a row of
   * fourteen uppercase labels — in a strip that scrolled sideways with the
   * scrollbar hidden, so a reader with a mouse could not reach the last six —
   * was a page that cost a click and gave nothing back. As cards, each page
   * says what it is for, in the reader's language, from its own settings.
   */
  if (data?.layout === 'cards') {
    const slugs = links.map((l) => stripLocale(l.href));
    let summaries = {};
    try { summaries = await pageSummaries(slugs, locale); } catch { summaries = {}; }
    return (
      <nav className="db-block db-section-index" aria-label={label}>
        <ul className="db-section-cards">
          {links.map((l) => {
            const s = summaries[stripLocale(l.href)] || {};
            return (
              <li key={l.href} className="db-section-card">
                <Link className="db-section-card-link" href={l.href}>
                  <span className="db-section-card-title">{l.label}</span>
                  {s.description ? <span className="db-section-card-desc">{s.description}</span> : null}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    );
  }
  return <TravelSubnav locale={locale} links={links} label={label} />;
}
