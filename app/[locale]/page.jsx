import { notFound } from 'next/navigation';
import { isLocale } from '../../lib/i18n/locales.js';
import { getPageBySlug, getPageBlocks } from '../../lib/content/pages.js';
import BlockRenderer from '../../components/blocks/BlockRenderer.jsx';

export default async function LocaleHome({ params }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const page = await getPageBySlug('home');
  if (!page) return <p className="db-empty">No home page has been created yet.</p>;

  const blocks = await getPageBlocks(page.id);
  return <BlockRenderer blocks={blocks} locale={locale} />;
}
