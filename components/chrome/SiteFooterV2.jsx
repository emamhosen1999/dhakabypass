import Link from 'next/link';
import { t } from '../../lib/i18n/ui.js';

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

export default function SiteFooterV2({ locale }) {
  const year = new Date().getFullYear();
  return (
    <footer className="db-footer">
      <nav className="db-footer-nav" aria-label={t(locale, 'footerNavLabel')}>
        {GROUPS.map((group) => (
          <div key={group.heading} className="db-footer-group">
            <h2 className="db-footer-heading">{t(locale, group.heading)}</h2>
            <ul className="db-footer-links">
              {group.links.map((link) => (
                <li key={link.href}>
                  <Link href={`/${locale}${link.href}`} className="db-footer-link">
                    {t(locale, link.key)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>
      <div className="db-footer-inner">
        <p className="db-footer-brand">Dhaka Bypass Expressway Development Company</p>
        <p className="db-footer-legal">© {year} DBEDC. {t(locale, 'allRights')}</p>
      </div>
    </footer>
  );
}
