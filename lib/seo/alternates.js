import { LOCALES, DEFAULT_LOCALE } from '../i18n/locales.js';
import { absoluteUrl } from './site.js';
import { localisedPath } from './routes.js';

/**
 * hreflang alternates for one localised page.
 *
 * Every page under `/[locale]/` exists in all three locales — the fallback in
 * `lib/content/resolve.js` is per block and per translation row, so a page
 * whose Bangla translation is missing still RENDERS at `/bn/...` with English
 * content rather than 404ing. The set of URLs is therefore always the same
 * three, regardless of translation status, and declaring all three is
 * accurate: Google's requirement is that each alternate resolves to a real
 * page, not that it be fully translated.
 *
 * `x-default` points at `/en`, not at `/`. `/` is the LEGACY site's home page
 * (`app/(site)/page.jsx`), a different page in a different tree; pointing
 * x-default there would tell Google the locale-neutral version of `/bn` is the
 * old site.
 *
 * Absolute URLs are emitted directly rather than relying on Next's
 * `metadataBase` resolution, because `metadataBase` lives in the ROOT layout,
 * which is shared with the legacy site and with the admin. Setting it there
 * would change the metadata of pages this work is not allowed to touch.
 *
 * @param {string} path locale-less path, e.g. `/` or `/travel/toll`
 */
export function localeAlternates(path) {
  const languages = {};
  for (const locale of LOCALES) {
    languages[locale] = absoluteUrl(localisedPath(path, locale));
  }
  languages['x-default'] = absoluteUrl(localisedPath(path, DEFAULT_LOCALE));
  return languages;
}

/**
 * The complete `alternates` value for a page's metadata object: the canonical
 * self-URL plus the language map.
 *
 * The canonical is the page's OWN localised URL, never the English one. A
 * cross-locale canonical would tell Google `/bn` is a duplicate of `/en` and
 * drop the Bangla page from the index entirely — which is the exact failure
 * that hreflang exists to prevent.
 */
export function alternatesFor(path, locale) {
  return {
    canonical: absoluteUrl(localisedPath(path, locale)),
    languages: localeAlternates(path),
  };
}
