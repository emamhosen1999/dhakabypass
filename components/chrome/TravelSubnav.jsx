'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';
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
  const fold = useRef(null);
  const items = Array.isArray(links) && links.length
    ? links
    : TRAVEL_SECTION.map((item) => ({ href: `/${locale}${item.href}`, label: t(locale, item.key) }));
  const current = items.find((item) => pathname === item.href);

  /**
   * On a phone the rail folds into one row — "In this section · Toll rates" —
   * that opens to the wrapped list; from 768px it is always open and the
   * summary is not drawn. Native <details>, rendered OPEN by the server, so
   * without script every link is visible; this effect only closes it on a
   * narrow screen, and leaves alone a fold the reader has toggled themselves.
   */
  useEffect(() => {
    const el = fold.current;
    if (!el) return undefined;
    const mq = window.matchMedia('(max-width: 767px)');
    const apply = () => { if (el.dataset.touched !== 'yes' && el.open === mq.matches) el.open = !mq.matches; };
    const touch = () => { el.dataset.touched = 'yes'; };
    apply();
    mq.addEventListener('change', apply);
    el.querySelector('summary')?.addEventListener('click', touch);
    return () => {
      mq.removeEventListener('change', apply);
      el.querySelector('summary')?.removeEventListener('click', touch);
    };
  }, []);

  return (
    <details ref={fold} className="db-subnav-fold" open>
      <summary className="db-subnav-summary">
        <span className="db-subnav-summary-label">{t(locale, 'inThisSection')}</span>
        {current ? <span className="db-subnav-summary-current">{current.label}</span> : null}
      </summary>
      <nav className="db-subnav" aria-label={label || t(locale, 'navTravel')}>
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            aria-current={pathname === item.href ? 'page' : undefined}
            className="db-subnav-link"
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </details>
  );
}
