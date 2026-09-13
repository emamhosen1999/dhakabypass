import { siteSeoCached } from './cache.js';
import { rootMetadata } from './settings.js';

/**
 * Site title, description and favicon for a root layout (W1.24, W6.5). The
 * values are `site_settings` rows; the read degrades to the code defaults on
 * any failure, so it cannot throw and cannot emit an empty <title>.
 */
export async function generateRootMetadata(locale = 'en') {
  return rootMetadata(await siteSeoCached(locale));
}
