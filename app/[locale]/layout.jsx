import { notFound } from 'next/navigation';
import { LOCALES, LOCALE_HTML_LANG, isLocale } from '../../lib/i18n/locales.js';
import ThemeScript from '../../components/chrome/ThemeScript.jsx';
import SiteHeaderV2 from '../../components/chrome/SiteHeaderV2.jsx';
import SiteFooterV2 from '../../components/chrome/SiteFooterV2.jsx';
import AdvisoryBar from '../../components/corridor/AdvisoryBar.jsx';
import Analytics from '../../components/chrome/Analytics.jsx';
import DocumentLang from '../../components/chrome/DocumentLang.jsx';
import FontPreload from '../../components/chrome/FontPreload.jsx';
import StructuredData from '../../components/chrome/StructuredData.jsx';
import { organizationJsonLd } from '../../lib/seo/organization.js';

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
      {/* Corrects <html lang> for this locale — see the component. */}
      <DocumentLang locale={locale} />
      {/* Stops the header re-wrapping when the condensed face swaps in. */}
      <FontPreload />
      <ThemeScript />
      {/* lib/seo/organization.js was written and never wired in. It asserts
          only what has been verified and omits every field DBEDC has not
          supplied, which is why it is safe to publish on every page. */}
      <StructuredData data={organizationJsonLd()} />
      <AdvisoryBar locale={locale} />
      <SiteHeaderV2 locale={locale} />
      <main id="main">{children}</main>
      <SiteFooterV2 locale={locale} />
      {/* Renders nothing unless ANALYTICS_PROVIDER is configured. Only the
          localised tree is measured: the admin is staff behind auth, and the
          legacy tree is not touched. */}
      <Analytics locale={locale} />
    </div>
  );
}
