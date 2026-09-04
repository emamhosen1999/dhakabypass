import { DEFAULT_LOCALE } from '../i18n/locales.js';

/**
 * Locale codes for date formatting.
 *
 * `bn` alone gives Intl the Bangladeshi Bengali it needs, but `bn-BD` pins the
 * region so the calendar and numbering system do not depend on the runtime's
 * default resolution — Node's ICU build and a browser's do not always agree.
 * zh-CN for the same reason.
 */
const INTL_LOCALE = { en: 'en-GB', bn: 'bn-BD', zh: 'zh-CN' };

/**
 * Coerce a database value to a Date, or null.
 *
 * The null/empty guard is not defensive tidiness. `new Date(null)` is the Unix
 * epoch, not an invalid date — so a row with a NULL `published_at` would sail
 * through a NaN check and render "1 January 1970" on a public page, which looks
 * like a data corruption bug and is really a missing value. `new Date('')` and
 * `new Date(undefined)` do produce Invalid Date, which is why only some of the
 * empty cases would ever have been caught.
 */
export function asNewsDate(value) {
  if (value == null || value === '') return null;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

/**
 * The machine-readable form for a <time datetime="…"> attribute, or undefined
 * so the attribute is omitted entirely rather than emitted empty.
 */
export function newsDateISO(value) {
  const d = asNewsDate(value);
  return d ? d.toISOString().slice(0, 10) : undefined;
}

/**
 * A published date, written the way each locale writes dates.
 *
 * Returns an empty string rather than "Invalid Date" for anything unparseable:
 * this renders inside a <time> element on a public page, and a visible
 * "Invalid Date" is worse than an absent one.
 */
export function formatNewsDate(value, locale = DEFAULT_LOCALE) {
  const d = asNewsDate(value);
  if (!d) return '';
  try {
    return new Intl.DateTimeFormat(INTL_LOCALE[locale] || INTL_LOCALE[DEFAULT_LOCALE], {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      // The row is a DATE with no time. Formatting it in the server's zone
      // would shift it a day either side of midnight depending on where the
      // process runs — the host is UTC, the editors are UTC+6.
      timeZone: 'UTC',
    }).format(d);
  } catch {
    return d.toISOString().slice(0, 10);
  }
}
