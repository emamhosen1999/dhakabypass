import { LOCALES, DEFAULT_LOCALE } from './locales.js';

/**
 * Which language the bare domain opens in (W8C.8, W8N.7).
 *
 * A chosen language wins — the switch writes `db_locale` — then the browser's
 * first preferred language that this site has, then English. Pure, so the
 * decision is tested without a request.
 *
 * Only the first Accept-Language entry is consulted, deliberately: a Dhaka
 * browser set to "en-GB, bn" is asking for English first, and honouring the
 * Bangla further down the list would be a guess against a stated preference.
 */
export function pickLocale({ cookie = '', acceptLanguage = '' } = {}) {
  const chosen = String(cookie || '').trim().toLowerCase();
  if (LOCALES.includes(chosen)) return chosen;
  const first = String(acceptLanguage || '').split(',')[0].split(';')[0].trim().toLowerCase();
  const lang = first.split('-')[0];
  if (LOCALES.includes(lang)) return lang;
  return DEFAULT_LOCALE;
}
