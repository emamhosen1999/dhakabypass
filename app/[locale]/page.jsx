import { notFound } from 'next/navigation';
import { isLocale } from '../../lib/i18n/locales.js';
import { getPageBySlugCached, getPageBlocksCached } from '../../lib/content/cache.js';
import { resolveTranslation } from '../../lib/content/resolve.js';
import BlockRenderer from '../../components/blocks/BlockRenderer.jsx';

async function load(params) {
  const { locale } = await params;
  if (!isLocale(locale)) return null;
  const page = await getPageBySlugCached('home');
  return { locale, page };
}

// Mirrors the content check below: metadata for a draft/missing home must
// not disagree with what actually renders, and it must not read fields off
// a page that isn't published.
export async function generateMetadata({ params }) {
  const loaded = await load(params);
  if (!loaded?.page || loaded.page.status !== 'published') return {};
  const rows = loaded.page.translations.map((tr) => ({
    locale: tr.locale, status: tr.status,
    data: { title: tr.seo_title || tr.title, description: tr.seo_description },
  }));
  const resolved = resolveTranslation(rows, loaded.locale);
  return resolved ? { title: resolved.data.title, description: resolved.data.description } : {};
}

export default async function LocaleHome({ params }) {
  const loaded = await load(params);
  if (!loaded) notFound(); // bad/unsupported locale segment — genuinely not found

  const { locale, page } = loaded;

  // Unlike /[locale]/[...slug], an unpublished or missing home page does NOT
  // 404 here. The home route is the site's front door — a draft home (or one
  // that hasn't been created yet, which is the DB default: pages.status
  // DEFAULTS to 'draft', so a row created outside the admin — a seed script,
  // manual SQL, a future import — lands as draft) reads to an operator as
  // "nothing published yet", not "this URL doesn't exist". It must still
  // never render draft content, so status is checked before any blocks are
  // fetched.
  if (!page || page.status !== 'published') {
    return <p className="db-empty">No home page has been created yet.</p>;
  }

  const blocks = await getPageBlocksCached(page.id, 'home');
  return <BlockRenderer blocks={blocks} locale={locale} />;
}
