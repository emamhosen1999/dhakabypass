'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { t } from '../../lib/i18n/ui';

const SECTION = [
  { key: 'travelStatus', href: '/travel/status' },
  { key: 'travelToll', href: '/travel/toll' },
  { key: 'travelRoute', href: '/travel/route' },
  { key: 'travelFacilities', href: '/travel/facilities' },
  { key: 'travelRules', href: '/travel/rules' },
];

/**
 * The section sub-nav, split out from the (server) TravelLayout so it can
 * mark the current item with usePathname — the same client-component-inside-
 * server-chrome pattern LocaleSwitch already uses. Styled to match
 * .db-locale-btn[aria-current]; aria-current="page" is the correct value
 * here (a nav announcing which page you're on), not LocaleSwitch's "true"
 * (a switch announcing which option is selected).
 */
export default function TravelSubnav({ locale }) {
  const pathname = usePathname();

  return (
    <nav className="db-subnav" aria-label={t(locale, 'navTravel')}>
      {SECTION.map((item) => {
        const href = `/${locale}${item.href}`;
        const current = pathname === href;
        return (
          <Link
            key={item.href}
            href={href}
            aria-current={current ? 'page' : undefined}
            className="db-subnav-link"
          >
            {t(locale, item.key)}
          </Link>
        );
      })}
    </nav>
  );
}
