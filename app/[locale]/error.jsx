'use client';

import { useParams } from 'next/navigation';
import { isLocale, DEFAULT_LOCALE } from '../../lib/i18n/locales.js';
import { t } from '../../lib/i18n/ui.js';

/**
 * The boundary for every page under app/[locale]/.
 *
 * Before this existed (C-D7) an uncaught throw anywhere in a public render
 * path gave the visitor Next's own unbranded "Application error: a
 * server-side exception has occurred (see the server logs for more
 * information)" — no chrome, no language, no way back, and no reference a
 * caller could quote to DBEDC. On a government-linked infrastructure site
 * that is the failure mode with the highest cost, because the reader who
 * hits it is often the reader with a reason to be on the site.
 *
 * The layout ABOVE this still renders when it fires, so the header, the
 * footer, the advisory bar and — importantly — <UiStringsBridge> are all
 * present. That is why `t()` works here and returns the operator's edited
 * string: this component sits inside the tree the bridge fills.
 * app/global-error.jsx is the one that gets no chrome and no database value.
 *
 * WHAT IT DELIBERATELY DOES NOT SHOW: `error.message`. Next already redacts
 * a server-side message down to a digest in production, but this component
 * also catches client-side throws, whose messages are NOT redacted and can
 * name a table, a column or a connection string. The digest is the only thing
 * a reader is given, and it is the only thing that is any use anyway — it is
 * what the server log line is keyed on.
 *
 * A plain <a>, not next/link: the client router is part of what may have
 * failed, and a full document load is the reliable way out. `reset()` is
 * offered as well, because a transient database blip is the common case and
 * re-rendering the segment is cheaper than reloading the page.
 */
export default function LocaleErrorBoundary({ error, reset }) {
  const params = useParams();
  // `[locale]` is a dynamic segment: /old-economic-impact arrives here with
  // locale='old-economic-impact', for which UI[locale] is undefined.
  const raw = params?.locale;
  const locale = isLocale(raw) ? raw : DEFAULT_LOCALE;
  const digest = error?.digest;

  return (
    <section className="db-block db-error">
      <h1 className="db-h1">{t(locale, 'errorHeading')}</h1>
      <p className="db-lede">{t(locale, 'errorBody')}</p>

      {digest ? (
        <p className="db-error-ref">
          <span className="db-error-ref-label">{t(locale, 'errorReference')}</span>
          {/* Selectable and monospaced-by-token so it can be read down a
              phone line or pasted into an email without transcription errors. */}
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
    </section>
  );
}
