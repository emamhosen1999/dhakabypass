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

export function revalidateCorridor() {
  revalidateTag(CORRIDOR_TAG);
}
