import { notFound } from 'next/navigation';
import { LOCALES, LOCALE_HTML_LANG, isLocale } from '../../lib/i18n/locales.js';
import ThemeScript from '../../components/chrome/ThemeScript.jsx';
import SiteHeaderV2 from '../../components/chrome/SiteHeaderV2.jsx';
import SiteFooterV2 from '../../components/chrome/SiteFooterV2.jsx';

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

/** Zooming must never be disabled — WCAG 2.2 AA and basic courtesy on a phone. */
export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export default async function LocaleLayout({ children, params }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  return (
    <div className="db-root" lang={LOCALE_HTML_LANG[locale]}>
      <ThemeScript />
      <SiteHeaderV2 locale={locale} />
      <main id="main">{children}</main>
      <SiteFooterV2 locale={locale} />
    </div>
  );
}
