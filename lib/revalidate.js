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

/** The redirects table, read by the root catch-all when a request would 404. */
export const REDIRECTS_TAG = 'redirects';

export function revalidateRedirects() {
  revalidateTag(REDIRECTS_TAG);
}

/** The navigation menus, read by the site header and footer. */
export const MENUS_TAG = 'menus';

export function revalidateMenus() {
  revalidateTag(MENUS_TAG);
}

/** The editable UI strings (`ui_strings`), read by t() and mapUi() on every
 *  page. One tag for all three locales because they are loaded in one entry —
 *  see lib/i18n/strings-cache.js for why they are not split per locale. */
export const UI_STRINGS_TAG = 'ui-strings';

export function revalidateUiStrings() {
  revalidateTag(UI_STRINGS_TAG);
}

/**
 * Per-route SEO (`route_meta`), read by every route's metadata and by the
 * sitemap's noindex filter.
 */
export const ROUTE_META_TAG = 'route-meta';

export function revalidateRouteMeta() {
  revalidateTag(ROUTE_META_TAG);
}

/**
 * Site-level SEO and identity (`seo.*` in `site_settings`) — the root layout's
 * title and description, the favicon, the default share image, the robots.txt
 * mode and the organisation name and logo.
 */
export const SEO_TAG = 'seo';

/**
 * Fires BOTH tags, and the second one is not belt-and-braces.
 *
 * A site-level value is resolved inside every route's metadata: the DEFAULT
 * share image is one row in `site_settings`, but it is read wherever a route
 * did not name its own. Evicting only the site-level entry would leave every
 * route serving the old default until its own recovery floor expired — which
 * for an operator who just changed the share image looks exactly like the save
 * not working.
 */
export function revalidateSeo() {
  revalidateTag(SEO_TAG);
  revalidateTag(ROUTE_META_TAG);
}
