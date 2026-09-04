import Link from 'next/link';
import LocaleSwitch from './LocaleSwitch.jsx';
import ThemeToggle from './ThemeToggle.jsx';
import { t } from '../../lib/i18n/ui.js';

/**
 * The primary navigation.
 *
 * This is deliberately NOT the old site's shape. That site is organised around
 * `project`, `economic-impact`, `stakeholders` and `chinese-contribution` — a
 * brochure about the project's promoters, published at the address a driver
 * reaches for when they want to know what a truck costs to take through Gazipur.
 *
 * What operators of comparable roads lead with is journey planning, road safety,
 * sustainability and governance; PLUS Malaysia, the closest comparable, is
 * organised in exactly those terms. `/impact` is gone rather than renamed: an
 * economic-impact page is an argument for the road's existence, and every figure
 * that would fill one is in the unverified pile.
 *
 * Six items is the most this header carries before the desktop row wraps. The
 * statutory pages — disclosures, procurement, grievances, governance — are one
 * click deeper, from the footer and from About, because a road user needs them
 * rarely and needs the toll rate constantly.
 */
const NAV = [
  { key: 'navTravel', href: '/travel' },
  { key: 'navSafety', href: '/safety' },
  { key: 'navProject', href: '/project' },
  { key: 'navSustainability', href: '/sustainability' },
  { key: 'navAbout', href: '/about' },
  { key: 'navNews', href: '/news' },
];

export default function SiteHeaderV2({ locale }) {
  return (
    <header className="db-header">
      <a href="#main" className="db-skip">{t(locale, 'skipToContent')}</a>
      <div className="db-header-inner">
        <Link href={`/${locale}`} className="db-brand">
          <span className="db-brand-mark" aria-hidden="true">DB</span>
          <span>
            <b className="db-brand-name">DBEDC</b>
            <small className="db-brand-tag">Dhaka Bypass Expressway</small>
          </span>
        </Link>

        {/* Visible from md, not xl — the old header vanished between 1024 and 1279px. */}
        <nav className="db-nav" aria-label="Primary">
          {NAV.map((item) => (
            <Link key={item.href} href={`/${locale}${item.href}`} className="db-nav-link">
              {t(locale, item.key)}
            </Link>
          ))}
          <Link href={`/${locale}/contact`} className="db-nav-cta">{t(locale, 'navContact')}</Link>
        </nav>

        <div className="db-header-utils">
          <LocaleSwitch current={locale} label={t(locale, 'language')} />
          <ThemeToggle label={t(locale, 'theme')} />
        </div>

        {/* Below 768px the same links live here, in a horizontally scrollable
            row, so no destination is ever unreachable on a narrow screen. */}
        <nav className="db-nav-mobile" aria-label="Primary, compact">
          {NAV.map((item) => (
            <Link key={item.href} href={`/${locale}${item.href}`} className="db-nav-link">
              {t(locale, item.key)}
            </Link>
          ))}
          <Link href={`/${locale}/contact`} className="db-nav-cta">{t(locale, 'navContact')}</Link>
        </nav>
      </div>
    </header>
  );
}
