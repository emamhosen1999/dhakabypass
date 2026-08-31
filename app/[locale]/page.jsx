import { notFound } from 'next/navigation';
import { isLocale } from '../../lib/i18n/locales.js';
import { getPageBySlugCached, getPageBlocksCached } from '../../lib/content/cache.js';
import BlockRenderer from '../../components/blocks/BlockRenderer.jsx';

export default async function LocaleHome({ params }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const page = await getPageBySlugCached('home');
  if (!page) return <p className="db-empty">No home page has been created yet.</p>;

  const blocks = await getPageBlocksCached(page.id, 'home');
  return <BlockRenderer blocks={blocks} locale={locale} />;
}
