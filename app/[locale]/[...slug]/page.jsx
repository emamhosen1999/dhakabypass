import { notFound } from 'next/navigation';
import { redirectOrNotFound } from '../../../lib/redirects/resolve.js';
import { isLocale } from '../../../lib/i18n/locales.js';
import { getPageBySlugCached, getPageBlocksCached } from '../../../lib/content/cache.js';
import { resolveTranslation } from '../../../lib/content/resolve.js';
import { alternatesFor } from '../../../lib/seo/alternates.js';
import { pathForSlug } from '../../../lib/seo/routes.js';
import { routeMetaFor } from '../../../lib/seo/cache.js';
import { applyRouteMeta } from '../../../lib/seo/route-meta.js';
import BlockRenderer from '../../../components/blocks/BlockRenderer.jsx';

async function load(params) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) return null;
  const page = await getPageBySlugCached(slug.join('/'));
  return page ? { locale, page } : null;
}

/**
 * THE DOCUMENT WINS. This is the boundary `route_meta` must not cross.
 *
 * Every page rendered here has a `pages` row, and its title and description
 * live on `page_translations.seo_title` / `seo_description` - written on the
 * same screen where the page's blocks are edited. A `route_meta` row that ALSO
 * carried a title for these URLs would be a second source of truth for one
 * fact, and an operator looking at the two screens would have no way to tell
 * which one the page was actually using.
 *
 * So `applyRouteMeta` only FILLS what the document left empty, and only
 * OVERRIDES the two things `page_translations` has no column for: `robots` and
 * `canonical`. That is what an operator gains here - the ability to mark a
 * published page noindex, or point its canonical at another URL, without
 * asking for a deploy.
 *
 * This matters more after W1.8 than it does today: once every ordinary public
 * route becomes a block document, this function is where nearly all of the
 * site's metadata is built.
 */
export async function generateMetadata({ params }) {
  const loaded = await load(params);
  // Unlike the home route, a draft or missing page here 404s in the component
  // below. hreflang must only ever point at URLs that resolve, so an
  // unpublished page declares no alternates at all — publishing one would
  // advertise three dead URLs to a crawler. No route_meta either: a directive
  // about a URL that 404s is a statement about nothing.
  if (!loaded || loaded.page.status !== 'published') return {};

  const path = pathForSlug(loaded.page.slug);
  const alternates = alternatesFor(path, loaded.locale);
  const rows = loaded.page.translations.map((tr) => ({
    locale: tr.locale, status: tr.status,
    data: { title: tr.seo_title || tr.title, description: tr.seo_description },
  }));
  const resolved = resolveTranslation(rows, loaded.locale);
  const base = resolved
    ? { title: resolved.data.title, description: resolved.data.description, alternates }
    : { alternates };
  return applyRouteMeta(base, await routeMetaFor(path, loaded.locale));
}

export default async function CmsPage({ params }) {
  const loaded = await load(params);
  // Multi-segment URLs reach here rather than a catch-all, for the same reason
  // as the home route: `[locale]/[...slug]` is preferred over a root catch-all.
  // An unpublished page is NOT redirect-eligible — it exists and the operator
  // has chosen not to show it, which is a 404, not a move.
  if (!loaded) {
    const { locale: segment, slug: rest } = await params;
    await redirectOrNotFound(`/${[segment, ...(rest || [])].join('/')}`);
  }
  if (loaded.page.status !== 'published') notFound();
  const blocks = await getPageBlocksCached(loaded.page.id, loaded.page.slug);
  return <BlockRenderer blocks={blocks} locale={loaded.locale} />;
}
