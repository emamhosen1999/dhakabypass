import { notFound } from 'next/navigation';
import Link from 'next/link';
import { isLocale } from '../../../../lib/i18n/locales.js';
import { t } from '../../../../lib/i18n/ui.js';
import { alternatesFor } from '../../../../lib/seo/alternates.js';
import { getNewsBySlugCached } from '../../../../lib/newsroom/cache.js';
import { formatNewsDate, newsDateISO } from '../../../../lib/newsroom/format.js';
import StructuredData from '../../../../components/chrome/StructuredData.jsx';
import { newsArticleJsonLd } from '../../../../lib/seo/organization.js';

/**
 * One article.
 *
 * No `generateStaticParams`. The localised pages are prerendered at build time
 * against the build machine's database, and the newsroom is the one part of
 * this site that changes AFTER a deploy — an editor publishing an article on a
 * Tuesday should not have to wait for a rebuild. Rendering on demand, behind
 * the same 300-second cache the rest of the site uses, costs one query per five
 * minutes per article and removes that constraint entirely.
 */
export async function generateMetadata({ params }) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) return {};
  let article = null;
  try {
    article = await getNewsBySlugCached(slug, locale);
  } catch {
    article = null;
  }
  if (!article) return {};
  return {
    title: article.title,
    description: article.excerpt || undefined,
    alternates: alternatesFor(`/news/${slug}`, locale),
    openGraph: {
      type: 'article',
      title: article.title,
      description: article.excerpt || undefined,
      publishedTime: newsDateISO(article.published_at),
    },
  };
}

export default async function NewsArticle({ params }) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();

  let article = null;
  try {
    article = await getNewsBySlugCached(slug, locale);
  } catch {
    // A database outage must not turn every article into a 404 — a 404 tells
    // a crawler the page is gone for good. Rethrowing gives a 500, which is
    // the honest answer for a transient fault, and Next renders the error page.
    throw new Error('newsroom unavailable');
  }
  if (!article) notFound();

  return (
    <article className="db-block db-article">
      <StructuredData data={newsArticleJsonLd(article, `/news/${slug}`, locale)} />
      <p className="db-newsmeta">
        <time dateTime={newsDateISO(article.published_at)}>
          {formatNewsDate(article.published_at, locale)}
        </time>
        {article.category ? <span className="db-newscat">{article.category}</span> : null}
      </p>
      <h1 className="db-h1">{article.title}</h1>
      {article.excerpt ? <p className="db-lede">{article.excerpt}</p> : null}

      {!article.translated ? (
        <p className="db-pending">
          <span className="db-pending-tag">{t(locale, 'newsFallbackTag')}</span>
          {t(locale, 'newsInEnglish')}
        </p>
      ) : null}

      {article.body ? (
        // Article bodies come from the admin, which is behind auth and role
        // checks — the same trust boundary as every other rich-text block.
        <div className="db-prose" dangerouslySetInnerHTML={{ __html: article.body }} />
      ) : null}

      {article.url ? (
        <p className="db-article-source">
          <a href={article.url} rel="noopener noreferrer nofollow" target="_blank">
            {article.source ? `${t(locale, 'newsSource')}: ${article.source}` : t(locale, 'newsSource')}
          </a>
        </p>
      ) : null}

      <p className="db-article-back">
        <Link href={`/${locale}/news`}>{t(locale, 'newsBack')}</Link>
      </p>
    </article>
  );
}

