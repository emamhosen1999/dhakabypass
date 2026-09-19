/**
 * What the generated share card says (E3).
 *
 * Kept apart from the renderer so the wording is testable without drawing a
 * picture, and so the route stays a thin wrapper around ImageResponse.
 */
import { SEO_DEFAULTS } from './settings.js';
import { isLocale } from '../i18n/locales.js';

/** The longest title that still fits three lines at the card's type size. */
const MAX_TITLE = 90;

/**
 * The page slug a card URL refers to.
 *
 * Two shapes arrive here. `withSocialCard` passes the UNLOCALISED page path
 * (`/travel/toll`), because that is what the page tree stores; a link pasted
 * by hand carries the locale (`/bn/travel/toll`). Stripping the first segment
 * unconditionally turned the first shape into `toll`, which matches no page,
 * so every generated card fell back to the road name.
 *
 * A bare locale, and an empty path, are the home page.
 */
export function slugFromPath(path) {
  const parts = String(path || '').split('?')[0].split('/').filter(Boolean);
  if (parts.length && isLocale(parts[0])) return parts.slice(1).join('/');
  return parts.join('/');
}

const tidy = (s) => String(s || '').replace(/\s+/g, ' ').trim();

const clamp = (s) => {
  if (s.length <= MAX_TITLE) return s;
  const cut = s.slice(0, MAX_TITLE - 1);
  // The trailing partial word goes, as it does in firstProse. A Bangla or
  // Chinese title may carry no space at all, and then the character cut is the
  // only one available.
  const space = cut.lastIndexOf(' ');
  return `${(space > 0 ? cut.slice(0, space) : cut).trimEnd()}…`;
};

/**
 * The two lines on the card. `brand` is empty when the title already carries
 * the road name, which is the home page's ordinary case.
 */
export function cardText({ pageTitle, siteTitle } = {}) {
  const brand = tidy(siteTitle) || SEO_DEFAULTS.siteTitle;
  const title = clamp(tidy(pageTitle) || brand);
  const repeats = title.toLowerCase().includes(brand.toLowerCase());
  return { title, brand: repeats ? '' : brand };
}
