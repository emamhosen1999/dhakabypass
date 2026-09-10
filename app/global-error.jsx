'use client';

// The root layout is NOT rendered when this boundary fires, and the root
// layout is what imports the stylesheet. Without this import the page renders
// as unstyled browser default text — which is barely better than the Next
// error it replaces. Importing it here puts the same CSS in this boundary's
// own chunk.
import './globals.css';

import { usePathname } from 'next/navigation';
import { localeFromPath, DEFAULT_LOCALE, LOCALE_HTML_LANG } from '../lib/i18n/locales.js';
import { t } from '../lib/i18n/ui.js';

/**
 * The last boundary: a throw in app/layout.jsx itself, or in a locale layout,
 * lands here. It REPLACES the whole document, which is why it renders its own
 * <html> and <body> — Next requires that, and it is also the honest statement
 * of what has happened: there is no chrome to sit inside because the thing
 * that renders the chrome is what failed.
 *
 * Two consequences worth stating rather than discovering:
 *
 *  1. <UiStringsBridge> never ran, so `t()` here can only return the code
 *     values in lib/i18n/ui.js — never an operator's edited ui_strings row.
 *     That is the correct direction of failure: this page must render when
 *     the database is the thing that is down, and lib/i18n/ui.js is exactly
 *     the table that survives an outage. The strings stay editable; the
 *     edited value simply cannot reach THIS page.
 *
 *  2. There is no locale segment to read, because there is no layout above to
 *     have parsed one. The locale comes from the pathname, and falls back to
 *     English for /admin, /uploads and anything else unprefixed.
 *
 * `.db-root` is applied to <body> by hand here for the same reason: the
 * element that normally carries it (app/[locale]/layout.jsx) did not render,
 * and without it none of the design tokens' scoped rules apply.
 */
export default function GlobalErrorBoundary({ error, reset }) {
  const pathname = usePathname();
  const locale = localeFromPath(pathname) || DEFAULT_LOCALE;
  const digest = error?.digest;

  return (
    <html lang={LOCALE_HTML_LANG[locale]} className="db-html-error">
      <body>
        <div className="db-root" lang={LOCALE_HTML_LANG[locale]}>
          <main className="db-block db-error">
            <h1 className="db-h1">{t(locale, 'errorHeading')}</h1>
            <p className="db-lede">{t(locale, 'errorBody')}</p>

            {digest ? (
              <p className="db-error-ref">
                <span className="db-error-ref-label">{t(locale, 'errorReference')}</span>
                <code className="db-error-digest">{digest}</code>
              </p>
            ) : null}

            <div className="db-actions">
              <button type="button" className="db-btn db-btn-primary" onClick={() => reset()}>
                {t(locale, 'errorRetry')}
              </button>
              <a className="db-btn db-btn-secondary" href={`/${locale}`}>
                {t(locale, 'errorHome')}
              </a>
            </div>
          </main>
        </div>
      </body>
    </html>
  );
}
