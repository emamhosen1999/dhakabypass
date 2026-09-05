import { revalidateTag } from 'next/cache';

export const LIST_TAG = 'pages:list';

export function pageTag(slug) {
  if (!slug) throw new Error('pageTag needs a slug');
  return `page:${slug}`;
}

/** Called by admin actions after a save, so the public page updates at once. */
export function revalidatePage(slug) {
  revalidateTag(pageTag(slug));
  revalidateTag(LIST_TAG);
}

/** One tag for all operational data: segments, interchanges, tolls, advisories.
 *  They are read together and change together, so splitting them would mean
 *  every editor save had to remember which of four tags to invalidate. */
export const CORRIDOR_TAG = 'corridor';

/** Advisories get their own tag on top of CORRIDOR_TAG: they carry a short
 *  revalidate window (see lib/corridor/cache.js) so a save can invalidate
 *  just the advisory entry for an immediate refresh, without also evicting
 *  the segments/interchanges/tolls entries, which don't need it. */
export const ADVISORY_TAG = 'corridor:advisories';

export function revalidateCorridor() {
  revalidateTag(CORRIDOR_TAG);
  revalidateTag(ADVISORY_TAG);
}

/** The newsroom. One tag: the index and every article are read together on a
 *  publish, and an editor who adds an article expects both to update. */
export const NEWS_TAG = 'news';

export function revalidateNews() {
  revalidateTag(NEWS_TAG);
}

/** The media library, and therefore the public gallery. Fired when an image is
 *  uploaded, replaced, or moved in or out of the gallery. */
export const MEDIA_TAG = 'media';

export function revalidateMedia() {
  revalidateTag(MEDIA_TAG);
}

/** Contact details and social links — read by the contact page and the footer. */
export const SETTINGS_TAG = 'settings';

export function revalidateSettings() {
  revalidateTag(SETTINGS_TAG);
}
