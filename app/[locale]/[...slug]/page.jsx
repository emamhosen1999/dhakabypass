import { notFound } from 'next/navigation';
import { redirectOrNotFound } from '../../../lib/redirects/resolve.js';
import { isLocale } from '../../../lib/i18n/locales.js';
import { getPageBySlugCached, getPageBlocksCached } from '../../../lib/content/cache.js';
import { resolveTranslation } from '../../../lib/content/resolve.js';
import { alternatesFor } from '../../../lib/seo/alternates.js';
import { pathForSlug } from '../../../lib/seo/routes.js';
import BlockRenderer from '../../../components/blocks/BlockRenderer.jsx';

async function load(params) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) return null;
  const page = await getPageBySlugCached(slug.join('/'));
  return page ? { locale, page } : null;
}

export async function generateMetadata({ params }) {
  const loaded = await load(params);
  // Unlike the home route, a draft or missing page here 404s in the component
  // below. hreflang must only ever point at URLs that resolve, so an
  // unpublished page declares no alternates at all — publishing one would
  // advertise three dead URLs to a crawler.
  if (!loaded || loaded.page.status !== 'published') return {};

  const alternates = alternatesFor(pathForSlug(loaded.page.slug), loaded.locale);
  const rows = loaded.page.translations.map((tr) => ({
    locale: tr.locale, status: tr.status,
    data: { title: tr.seo_title || tr.title, description: tr.seo_description },
  }));
  const resolved = resolveTranslation(rows, loaded.locale);
  return resolved
    ? { title: resolved.data.title, description: resolved.data.description, alternates }
    : { alternates };
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
