import Link from 'next/link';
import { t } from '../../lib/i18n/ui.js';
import { getMenuCached } from '../../lib/menus/cache.js';
import { localeHref } from '../../lib/blocks/href.js';

/**
 * The footer carries the statutory pages.
 *
 * A PPP toll road has obligations that a road user needs rarely and an affected
 * landowner, a supplier or a journalist needs badly: tariff notifications, land
 * acquisition and resettlement disclosure, open tenders, governance, and a route
 * for grievances. Putting them in the header would push the toll rate — which
 * every visitor wants — further away; leaving them out entirely would make them
 * findable only by someone who already knew they existed.
 *
 * Grouped rather than listed flat, because eight undifferentiated links is a
 * list nobody reads.
 */
const GROUPS = [
  {
    heading: 'footerTravel',
    links: [
      { key: 'travelStatus', href: '/travel/status' },
      { key: 'travelToll', href: '/travel/toll' },
      { key: 'travelRoute', href: '/travel/route' },
      { key: 'navSafety', href: '/safety' },
    ],
  },
  {
    heading: 'footerCompany',
    links: [
      { key: 'navAbout', href: '/about' },
      { key: 'navGovernance', href: '/about/governance' },
      { key: 'navSustainability', href: '/sustainability' },
      { key: 'navNews', href: '/news' },
      { key: 'navGallery', href: '/gallery' },
    ],
  },
  {
    heading: 'footerDisclosure',
    links: [
      { key: 'navDisclosures', href: '/disclosures' },
      { key: 'navTariff', href: '/disclosures/tariff' },
      { key: 'navLandAcquisition', href: '/disclosures/land-acquisition' },
      { key: 'navProcurement', href: '/procurement' },
    ],
  },
  {
    heading: 'footerContact',
    links: [
      { key: 'navContact', href: '/contact' },
      { key: 'navGrievances', href: '/grievances' },
    ],
  },
];

export default async function SiteFooterV2({ locale }) {
  const year = new Date().getFullYear();

  /**
   * A `footer` menu in the database overrides the groups above, using
   * `menu_items.parent_id`: a top-level item is a column heading and its
   * children are the links beneath it. A heading needs no href.
   *
   * As in the header, this only ever overrides — no menu, no items or no
   * database leaves the built-in groups in place, so the statutory links a
   * landowner or a supplier comes here for cannot vanish because a query failed.
   */
  let menu = [];
  try {
    menu = await getMenuCached('footer', locale);
  } catch {
    menu = [];
  }

  const groups = menu.length
    ? menu.map((g) => ({
        key: g.id,
        heading: g.label,
        links: (g.children || []).map((c) => ({
          key: c.id, href: localeHref(c.href, locale), label: c.label,
        })),
      }))
    : GROUPS.map((group) => ({
        key: group.heading,
        heading: t(locale, group.heading),
        links: group.links.map((link) => ({
          key: link.href, href: `/${locale}${link.href}`, label: t(locale, link.key),
        })),
      }));

  return (
    <footer className="db-footer">
      <nav className="db-footer-nav" aria-label={t(locale, 'footerNavLabel')}>
        {groups.map((group) => (
          <div key={group.key} className="db-footer-group">
            <h2 className="db-footer-heading">{group.heading}</h2>
            <ul className="db-footer-links">
              {group.links.map((link) => (
                <li key={link.key}>
                  <Link href={link.href} className="db-footer-link">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>
      <div className="db-footer-inner">
        <p className="db-footer-brand">Dhaka Bypass Expressway Development Company</p>
        {/* The legacy footer carried these three and the rebuild dropped them,
            which left the site running Google Analytics behind a consent banner
            with no policy to consent to. They sit in the bottom bar rather than
            a nav column because that is where a reader looks for them, and
            because the columns above are operator-editable while these must not
            quietly disappear. */}
        <ul className="db-footer-legal-links">
          <li><Link href={localeHref('privacy', locale)}>{t(locale, 'footerPrivacy')}</Link></li>
          <li><Link href={localeHref('terms', locale)}>{t(locale, 'footerTerms')}</Link></li>
          <li><Link href={localeHref('accessibility', locale)}>{t(locale, 'footerAccessibility')}</Link></li>
        </ul>
        <p className="db-footer-legal">© {year} DBEDC. {t(locale, 'allRights')}</p>
      </div>
    </footer>
  );
}
