import { siteSeoCached } from './cache.js';
import { rootMetadata } from './settings.js';

/**
 * Site title, description and favicon for a root layout (W1.24, W6.5). The
 * values are `site_settings` rows; the read degrades to the code defaults on
 * any failure, so it cannot throw and cannot emit an empty <title>.
 *
 * `options` is passed through to rootMetadata; the public locale layout sets
 * `brandTitles`, and the admin and legacy roots deliberately do not.
 */
export async function generateRootMetadata(locale = 'en', options = {}) {
  return rootMetadata(await siteSeoCached(locale), options);
}
