import Link from 'next/link';
import { notFound } from 'next/navigation';
import { isLocale } from '../../../lib/i18n/locales';
import { t } from '../../../lib/i18n/ui';

const SECTION = [
  { key: 'travelStatus', href: '/travel/status' },
  { key: 'travelToll', href: '/travel/toll' },
  { key: 'travelRoute', href: '/travel/route' },
  { key: 'travelFacilities', href: '/travel/facilities' },
  { key: 'travelRules', href: '/travel/rules' },
];

export default async function TravelLayout({ children, params }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  return (
    <div className="db-section">
      <nav className="db-subnav" aria-label={t(locale, 'navTravel')}>
        {SECTION.map((item) => (
          <Link key={item.href} href={`/${locale}${item.href}`} className="db-subnav-link">
            {t(locale, item.key)}
          </Link>
        ))}
      </nav>
      {children}
    </div>
  );
}
