import Link from 'next/link';
import LocaleSwitch from './LocaleSwitch.jsx';
import ThemeToggle from './ThemeToggle.jsx';
import { t } from '../../lib/i18n/ui.js';

const NAV = [
  { key: 'navTravel', href: '/travel' },
  { key: 'navProject', href: '/project' },
  { key: 'navImpact', href: '/impact' },
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
