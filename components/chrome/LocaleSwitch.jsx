'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LOCALES, LOCALE_LABELS, LOCALE_HTML_LANG, withLocale } from '../../lib/i18n/locales.js';

export default function LocaleSwitch({ current, label = 'Language' }) {
  const pathname = usePathname();
  return (
    <nav className="db-locale-switch" aria-label={label}>
      {LOCALES.map((l) => (
        <Link
          key={l}
          href={withLocale(pathname, l)}
          hrefLang={l}
          lang={LOCALE_HTML_LANG[l]}
          aria-current={l === current ? 'true' : undefined}
          // Remember the choice for the next visit to the bare domain.
          onClick={() => { try { document.cookie = `db_locale=${l}; path=/; max-age=31536000; samesite=lax`; } catch { /* cookies blocked */ } }}
          className="db-locale-btn"
        >
          {LOCALE_LABELS[l]}
        </Link>
      ))}
    </nav>
  );
}
