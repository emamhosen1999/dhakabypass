import { notFound } from 'next/navigation';
import { isLocale } from '../../../lib/i18n/locales';
import TravelSubnav from '../../../components/chrome/TravelSubnav';

export default async function TravelLayout({ children, params }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  return (
    <div className="db-section">
      <TravelSubnav locale={locale} />
      {children}
    </div>
  );
}
