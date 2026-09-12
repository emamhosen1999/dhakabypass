import { notFound } from 'next/navigation';
import { LOCALES, LOCALE_HTML_LANG, isLocale } from '../../lib/i18n/locales.js';
import { setRequestLocale } from '../../lib/i18n/request-locale.js';
import ThemeScript from '../../components/chrome/ThemeScript.jsx';
import SiteHeaderV2 from '../../components/chrome/SiteHeaderV2.jsx';
import SiteFooterV2 from '../../components/chrome/SiteFooterV2.jsx';
import AdvisoryBar from '../../components/corridor/AdvisoryBar.jsx';
import Analytics from '../../components/chrome/Analytics.jsx';
import DocumentLang from '../../components/chrome/DocumentLang.jsx';
import FontPreload from '../../components/chrome/FontPreload.jsx';
import BrandTokens from '../../components/chrome/BrandTokens.jsx';
import StructuredData from '../../components/chrome/StructuredData.jsx';
import UiStringsBridge from '../../components/chrome/UiStringsBridge.jsx';
import { loadOrganization } from '../../lib/seo/identity.js';
import { primeUiStrings } from '../../lib/i18n/strings-cache.js';

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

  /**
   * A layout must NOT decide the 404 here, and this used to.
   *
   * `[locale]` is a dynamic segment, so `/old-economic-impact` matches it and
   * arrives with `locale = 'old-economic-impact'`. Calling `notFound()` at this
   * point ended the request before the page ran — which meant the page, the only
   * component that can see the REST of the path, never got to decide anything.
   * That is what stopped operator-configured redirects from ever firing: the
   * lookup has to happen somewhere that knows the whole URL, and a layout only
   * ever receives its own segment.
   *
   * So an unrecognised segment now renders the children bare — no chrome, no
   * advisory or header queries — and the page below resolves a redirect or calls
   * `notFound()` itself. A visitor sees exactly what they saw before: the same
   * 404 page, without localised chrome around it.
   */
  if (!isLocale(locale)) return <>{children}</>;

  /**
   * Load the editable UI strings BEFORE anything under this layout renders.
   *
   * `t()` and `mapUi()` are synchronous — around 240 call sites depend on that
   * — so the overrides have to be in the module store by the time a component
   * asks for one. Awaiting here is what guarantees it: React does not render a
   * layout's children until the layout itself has resolved.
   *
   * It cannot fail. The reader behind it degrades to `{}` on any error
   * (lib/i18n/strings-repo.js), and `{}` means the code tables, which is the
   * site exactly as it shipped.
   *
   * ONE known gap, deliberate and recorded rather than papered over: a route's
   * `generateMetadata` may run before or beside this, so on a cold cache entry
   * a <title> can be built from a code value while the page body uses the
   * edited one. It is bounded to the first request after a revalidation, and
   * W1.7 replaces those `t()`-built titles with `route_meta` rows anyway.
   */
  // For not-found.jsx, which receives no params — see lib/i18n/request-locale.js.
  setRequestLocale(locale);
  const uiStringTables = await primeUiStrings();

  return (
    <div className="db-root" lang={LOCALE_HTML_LANG[locale]}>
      {/* Must stay above {children}: it fills the browser's copy of the string
          store, and the client components below read from it during render.
          Only this page's locale crosses to the browser — see the component. */}
      <UiStringsBridge locale={locale} table={uiStringTables[locale]} />
      {/* Corrects <html lang> for this locale — see the component. */}
      <DocumentLang locale={locale} />
      {/* Stops the header re-wrapping when the condensed face swaps in. */}
      <FontPreload />
      {/* Chinese: Noto Sans SC, self-hosted and sliced by unicode-range (W1.28).
          A stylesheet link rather than a CSS import so only /zh pays for the
          202 @font-face rules; the browser then fetches just the slices this
          page's characters need. `precedence` lets React hoist it into <head>
          ahead of the page's own styles. */}
      {locale === 'zh' ? <link rel="stylesheet" href="/fonts/noto-sans-sc.css" precedence="high" /> : null}
      <ThemeScript />
      {/* The operator's brand colours and page width, when changed (W1.16). */}
      <BrandTokens />
      {/* Asserts only what has been verified and omits every field DBEDC has
          not supplied, which is why it is safe to publish on every page. The
          organisation name and the logo are /admin/settings values now, and
          the logo's dimensions are MEASURED rather than remembered - see
          lib/seo/identity.js. Both reads degrade to the code constants, so a
          database outage costs this block nothing. */}
      <StructuredData data={await loadOrganization()} />
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
