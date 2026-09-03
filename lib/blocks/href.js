import { LOCALES } from '../i18n/locales.js';

/**
 * Resolve an authored link target for one locale.
 *
 * Authored content must never carry a locale prefix. If it did, the Bangla
 * translation of a block would either repeat every href with a /bn prefix — a
 * second place for the same link to rot — or, far more likely, keep the
 * translator's copied /en value and quietly send Bangla readers to the English
 * page. That is the bug this function exists to make impossible.
 *
 * The authoring rule is deliberately blunt, so an editor can hold it in their
 * head with no documentation to hand:
 *
 *   NO leading slash  -> a page on this site, localised.
 *                        'travel/toll' -> '/bn/travel/toll'
 *   leading slash     -> used exactly as written, untouched.
 *                        '/contact' -> '/contact'
 *   scheme, //, #, ?  -> untouched. mailto:, tel:, https:, anchors.
 *
 * The escape hatch matters: some routes on this site genuinely are not
 * localised yet (the legacy pages), and an editor must be able to link one
 * without this helper silently inventing a /bn/ URL that 404s. Making that
 * choice visible in the authored value is the point — a leading slash is the
 * editor saying "I mean this literally".
 *
 * An already-localised absolute path is passed through rather than
 * double-prefixed, so '/en/travel/toll' cannot become '/bn/en/travel/toll'.
 */
export function localeHref(href, locale) {
  if (typeof href !== 'string') return '';
  const raw = href.trim();
  if (!raw) return '';

  // Absolute URL, protocol-relative, anchor, or query-only: never touched.
  if (/^([a-z][a-z0-9+.-]*:|\/\/|#|\?)/i.test(raw)) return raw;

  if (raw.startsWith('/')) return raw;

  const clean = raw.replace(/^\/+/, '');
  const first = clean.split('/')[0];
  // Guard against an editor writing 'en/travel/toll' by habit: honour the
  // locale they named rather than producing '/bn/en/travel/toll'.
  if (LOCALES.includes(first)) return `/${clean}`;

  return `/${locale}/${clean}`;
}
