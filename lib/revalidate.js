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
