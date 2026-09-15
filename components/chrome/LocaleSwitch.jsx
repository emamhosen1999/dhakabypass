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
          className="db-locale-btn"
        >
          {LOCALE_LABELS[l]}
        </Link>
      ))}
    </nav>
  );
}
