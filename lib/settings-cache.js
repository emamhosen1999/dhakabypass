import { cache } from 'react';
import { unstable_cache } from 'next/cache';
import { getContactDetails } from './settings.js';
import { SETTINGS_TAG } from './revalidate.js';

/**
 * Cached contact details for the public pages.
 *
 * A separate file from lib/settings.js on purpose: that module is imported by
 * standalone seed scripts, and `next/cache` cannot be imported outside a Next
 * runtime — pulling it in there would break every script that reads a setting.
 *
 * Same double wrap and same 300-second recovery floor as every other public
 * reader here; the reasoning is in lib/content/cache.js and applies unchanged.
 */
const RECOVERY_FLOOR_SECONDS = 300;

export const getContactDetailsCached = cache((locale) =>
  unstable_cache(() => getContactDetails(locale), ['contact-details', String(locale)], {
    tags: [SETTINGS_TAG],
    revalidate: RECOVERY_FLOOR_SECONDS,
  })(),
);
