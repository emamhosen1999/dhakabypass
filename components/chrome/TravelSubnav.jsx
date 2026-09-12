'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { t } from '../../lib/i18n/ui';
import { TRAVEL_NAV } from '../../lib/menus/builtin.js';

/**
 * The built-in travel links: the OUTAGE FALLBACK, not the source of truth.
 *
 * Since W1.11 the links come from the `travel` menu (edited at /admin/menus)
 * through the section-subnav block, and this list is what renders while that
 * menu is empty or the database is unreachable — the same override-not-replace
 * rule the header and footer follow (lib/menus/repo.js). It is exported so the
 * block can build the fallback from it and the test can pin the two together.
 */
export const TRAVEL_SECTION = TRAVEL_NAV;

/**
 * The section sub-nav, a client component so it can mark the current item
 * with usePathname — the same client-component-inside-server-chrome pattern
 * LocaleSwitch already uses. Styled to match .db-locale-btn[aria-current];
 * aria-current="page" is the correct value here (a nav announcing which page
 * you're on), not LocaleSwitch's "true" (a switch announcing which option is
 * selected).
 *
 * `links` is `[{ href, label }]` with locale-prefixed hrefs, built by the
 * server component that owns the data read. When it is omitted the built-in
 * list renders, so the component still works anywhere it was used before.
 */
export default function TravelSubnav({ locale, links, label }) {
  const pathname = usePathname();
  const items = Array.isArray(links) && links.length
    ? links
    : TRAVEL_SECTION.map((item) => ({ href: `/${locale}${item.href}`, label: t(locale, item.key) }));

  return (
    <nav className="db-subnav" aria-label={label || t(locale, 'navTravel')}>
      {items.map((item) => {
        const current = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={current ? 'page' : undefined}
            className="db-subnav-link"
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
