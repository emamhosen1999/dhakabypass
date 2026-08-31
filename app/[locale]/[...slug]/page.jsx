import { notFound } from 'next/navigation';
import { isLocale } from '../../../lib/i18n/locales.js';
import { getPageBySlugCached, getPageBlocksCached } from '../../../lib/content/cache.js';
import { resolveTranslation } from '../../../lib/content/resolve.js';
import BlockRenderer from '../../../components/blocks/BlockRenderer.jsx';

async function load(params) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) return null;
  const page = await getPageBySlugCached(slug.join('/'));
  return page ? { locale, page } : null;
}

export async function generateMetadata({ params }) {
  const loaded = await load(params);
  if (!loaded) return {};
  const rows = loaded.page.translations.map((tr) => ({
    locale: tr.locale, status: tr.status,
    data: { title: tr.seo_title || tr.title, description: tr.seo_description },
  }));
  const resolved = resolveTranslation(rows, loaded.locale);
  return resolved ? { title: resolved.data.title, description: resolved.data.description } : {};
}

export default async function CmsPage({ params }) {
  const loaded = await load(params);
  if (!loaded || loaded.page.status !== 'published') notFound();
  const blocks = await getPageBlocksCached(loaded.page.id, loaded.page.slug);
  return <BlockRenderer blocks={blocks} locale={loaded.locale} />;
}
