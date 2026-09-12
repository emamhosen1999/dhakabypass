'use server';

import { runAction } from '../../../../lib/admin/run-action';

import { revalidatePath } from 'next/cache';
import { assertCan } from '../../../../lib/auth/assert-can';
import { LOCALES } from '../../../../lib/i18n/locales';
import { saveRouteMeta, deleteRouteMeta, normaliseRoute, ROBOTS_DIRECTIVES } from '../../../../lib/seo/route-meta';
import { publishablePath } from '../../../../lib/seo/settings';
import { revalidateRouteMeta } from '../../../../lib/revalidate';
import { validationError, friendly } from '../../../../lib/errors';

const ADMIN = '/admin/seo';

/**
 * Save one route's overrides, in all three languages, as one unit.
 *
 * `manage_pages`, not `manage_users`. Everything on this screen is scoped to a
 * single URL and is reversible by clearing it: an editor who can publish and
 * unpublish a page can already remove it from the public site entirely, so
 * being able to mark it noindex is not a larger power. The site-wide switches
 * — the robots.txt posture, the organisation's own name — are the ones that
 * live at /admin/settings behind `manage_users`.
 */
async function saveRouteMetaAction$inner(formData) {
  await assertCan('manage_pages');

  const raw = String(formData.get('route') || '').trim();
  if (!raw) throw validationError('Enter the page path this applies to, such as /news/[slug].');

  let route;
  try {
    route = normaliseRoute(raw);
  } catch {
    // normaliseRoute throws only on a locale prefix, and that is worth an
    // explanation: a row stored as /en/news would be silently never read, and
    // the screen would still say it saved.
    throw validationError(
      `Leave the language out of the path: write "${raw.replace(/^\/(en|bn|zh)/, '') || '/'}" `
      + 'rather than "' + raw + '". The same row covers all three languages.',
    );
  }

  const robots = String(formData.get('robots') || '').trim();
  if (!ROBOTS_DIRECTIVES.includes(robots)) {
    throw validationError('Choose one of the listed search-engine options.');
  }

  const canonical = String(formData.get('canonical') || '').trim();
  if (canonical && !publishablePath(canonical)) {
    throw validationError(
      'The canonical link must be a path beginning with "/" or a full https:// URL.',
    );
  }

  const ogImage = String(formData.get('og_image_en') || '').trim();
  if (ogImage && !publishablePath(ogImage)) {
    throw validationError(
      'The sharing image must be a path beginning with "/" or a full https:// URL.',
    );
  }

  try {
    for (const locale of LOCALES) {
      await saveRouteMeta({
        route,
        locale,
        seoTitle: String(formData.get(`seo_title_${locale}`) || ''),
        seoDescription: String(formData.get(`seo_description_${locale}`) || ''),
        // The three DIRECTIVE-shaped fields are stored on the English row only.
        // A robots directive is a fact about the URL, not a translation, and
        // the reader takes them from English for every language — writing them
        // to all three would create three copies of one fact that could
        // disagree after a later partial edit.
        ogImage: locale === 'en' ? ogImage : '',
        robots: locale === 'en' ? robots : '',
        canonical: locale === 'en' ? canonical : '',
      });
    }
  } catch (err) {
    friendly(err, 'Those settings could not be saved. Please try again.');
  }

  revalidateRouteMeta();
  // /sitemap.xml is an hourly ISR route, so evicting the cached data behind it
  // is not enough — without this, a page marked noindex would keep being
  // advertised in the sitemap for up to an hour, which is the "Submitted URL
  // marked noindex" error in Search Console.
  revalidatePath('/sitemap.xml');
  revalidatePath(ADMIN);
}

/**
 * Remove every language's row for one route.
 *
 * Deleting, not blanking. An empty row still reads as "an operator set this",
 * and the point of removing it is to say the route has no overrides again —
 * the same meaning a deleted row has in `ui_strings`.
 */
async function deleteRouteMetaAction$inner(formData) {
  await assertCan('manage_pages');

  const raw = String(formData.get('route') || '').trim();
  if (!raw) throw validationError('Nothing to remove.');

  try {
    await deleteRouteMeta(raw);
  } catch (err) {
    friendly(err, 'That entry could not be removed. Please try again.');
  }

  revalidateRouteMeta();
  revalidatePath('/sitemap.xml');
  revalidatePath(ADMIN);
}

// ---------------------------------------------------------------------------
// Every exported action runs through runAction(): a thrown validation error
// becomes a redirect back to the form with the sentence in `?notice=`, which
// is the only way a message survives a production build. See
// lib/admin/run-action.js. The bodies above are unchanged.
// ---------------------------------------------------------------------------
export async function saveRouteMetaAction(formData) {
  return runAction(() => saveRouteMetaAction$inner(formData));
}
export async function deleteRouteMetaAction(formData) {
  return runAction(() => deleteRouteMetaAction$inner(formData));
}
