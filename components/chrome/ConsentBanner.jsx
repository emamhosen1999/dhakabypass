'use client';

import { useEffect, useState } from 'react';
import { t } from '../../lib/i18n/ui.js';

const KEY = 'db-analytics-consent';

/**
 * The cookie consent banner, shown only when the configured provider actually
 * sets cookies.
 *
 * Rendered by Analytics.jsx for `ga4` and never for the cookieless providers,
 * because a banner asking permission for cookies that are not set trains people
 * to dismiss banners without reading them.
 *
 * Three things it does deliberately:
 *
 *  - It renders nothing until the stored choice has been read. Rendering the
 *    banner and then hiding it makes it flash on every page load for a visitor
 *    who already answered, which is the most irritating possible outcome for
 *    the person who did the right thing.
 *  - Reject is a real button, the same size and weight as Accept. A banner
 *    where refusing is harder than agreeing is not consent.
 *  - The choice is stored in localStorage rather than a cookie, so declining
 *    cookies does not itself set one.
 */
export default function ConsentBanner({ locale }) {
  const [choice, setChoice] = useState(undefined);

  useEffect(() => {
    try {
      setChoice(localStorage.getItem(KEY) || null);
    } catch {
      // Private mode, or storage blocked. Ask, and treat the answer as
      // session-only — better than assuming consent.
      setChoice(null);
    }
  }, []);

  function decide(value) {
    try {
      localStorage.setItem(KEY, value);
    } catch { /* the choice still applies to this page load */ }
    if (value === 'granted' && typeof window.gtag === 'function') {
      window.gtag('consent', 'update', { analytics_storage: 'granted' });
    }
    setChoice(value);
  }

  if (choice !== null) return null;

  return (
    <div className="db-consent" role="dialog" aria-live="polite" aria-label={t(locale, 'consentHeading')}>
      <div className="db-consent-inner">
        <p className="db-consent-text">{t(locale, 'consentBody')}</p>
        <div className="db-consent-actions">
          <button type="button" className="db-btn db-btn-quiet" onClick={() => decide('denied')}>
            {t(locale, 'consentReject')}
          </button>
          <button type="button" className="db-btn db-btn-primary" onClick={() => decide('granted')}>
            {t(locale, 'consentAccept')}
          </button>
        </div>
      </div>
    </div>
  );
}
