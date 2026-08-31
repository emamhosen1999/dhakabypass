/** The project's three locales. `en` is both default and fallback. */
export const LOCALES = ['en', 'bn', 'zh'];
export const DEFAULT_LOCALE = 'en';

/** Native names, for the switcher — never translate these. */
export const LOCALE_LABELS = { en: 'English', bn: 'বাংলা', zh: '中文' };

/** Values for the html lang attribute. zh is script-qualified for screen readers. */
export const LOCALE_HTML_LANG = { en: 'en', bn: 'bn', zh: 'zh-Hans' };

export function isLocale(value) {
  return LOCALES.includes(value);
}

export function localeFromPath(pathname) {
  const first = String(pathname || '').split('/')[1];
  return isLocale(first) ? first : null;
}

export function stripLocale(pathname) {
  const locale = localeFromPath(pathname);
  if (!locale) return pathname || '/';
  const rest = pathname.slice(locale.length + 1);
  return rest === '' ? '/' : rest;
}

export function withLocale(pathname, locale) {
  const rest = stripLocale(pathname);
  return rest === '/' ? `/${locale}` : `/${locale}${rest}`;
}
