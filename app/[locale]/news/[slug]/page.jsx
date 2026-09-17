import { notFound } from 'next/navigation';
import Link from 'next/link';
import { isLocale } from '../../../../lib/i18n/locales.js';
import { t } from '../../../../lib/i18n/ui.js';
import { alternatesFor } from '../../../../lib/seo/alternates.js';
import { routeMetaFor, getSeoSettingsCached } from '../../../../lib/seo/cache.js';
import { withSocialCard } from '../../../../lib/seo/social.js';
import { absoluteUrl } from '../../../../lib/seo/site.js';
import { applyRouteMeta } from '../../../../lib/seo/route-meta.js';
import { getNewsBySlugCached } from '../../../../lib/newsroom/cache.js';
import { formatNewsDate, newsDateISO } from '../../../../lib/newsroom/format.js';
import StructuredData from '../../../../components/chrome/StructuredData.jsx';
import { newsArticleJsonLd } from '../../../../lib/seo/organization.js';
import { localiseProseLinks } from '../../../../lib/html/prose-links.js';

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
/**
 * This is the route `route_meta`'s TEXT columns exist for.
 *
 * `/news/[slug]` is one file on disk and as many URLs as there are published
 * articles. It has no `pages` row and never will, so there is no
 * `page_translations.seo_title` to defer to - which is why a stored title here
 * is a fill rather than a duplicate source of truth. The article's own title
 * still wins whenever it has one; the row only answers for what the article
 * left blank, and for the two DIRECTIVES nothing else can express.
 *
 * That is the whole reason the operator can now mark the newsroom noindex, or
 * point every article's canonical somewhere, without a developer.
 */
export async function generateMetadata({ params }) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) return {};
  const path = `/news/${slug}`;

  // Settled independently. A failed route_meta read must not cost the article
  // its own title, and a failed article read must not stop a robots directive
  // from being honoured - a page an operator hid staying hidden is the more
  // important of the two.
  const meta = await routeMetaFor(path, locale);

  let article = null;
  try {
    article = await getNewsBySlugCached(slug, locale);
  } catch {
    article = null;
  }

  // No article: still fold in the row, so a directive applies to a URL whose
  // body could not be read. `applyRouteMeta(base, null)` returns base
  // untouched, so this stays exactly `{}` when there is nothing stored.
  if (!article) return applyRouteMeta({}, meta);

  const withMeta = applyRouteMeta({
    title: article.title,
    description: article.excerpt || undefined,
    alternates: alternatesFor(path, locale),
    openGraph: {
      type: 'article',
      title: article.title,
      description: article.excerpt || undefined,
      publishedTime: newsDateISO(article.published_at),
      ...(article.image ? { images: [{ url: absoluteUrl(article.image) }] } : {}),
    },
  }, meta);
  // The banner as the share image, or the site default; a card for every article.
  let site = {};
  try { site = await getSeoSettingsCached(locale); } catch { site = {}; }
  const card = withSocialCard(withMeta, {
    page: { title: article.title, description: article.excerpt, ogImage: article.image },
    site: { title: site.siteTitle, description: site.siteDescription, ogImage: site.ogImage },
    locale, path,
  });
  card.openGraph.type = 'article';
  return card;
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
      {/* An untranslated article is English inside a Bangla or Chinese page:
          the notice comes before the heading, and the English parts carry
          lang="en" so a screen reader switches voice (WCAG 3.1.2, UI-A11Y-02). */}
      {!article.translated ? (
        <p className="db-pending">
          <span className="db-pending-tag">{t(locale, 'newsFallbackTag')}</span>
          {t(locale, 'newsInEnglish')}
        </p>
      ) : null}
      <h1 className="db-h1" lang={article.translated ? undefined : 'en'}>{article.title}</h1>
      {article.excerpt ? <p className="db-lede" lang={article.translated ? undefined : 'en'}>{article.excerpt}</p> : null}

      {article.body ? (
        // Article bodies come from the admin, which is behind auth and role
        // checks — the same trust boundary as every other rich-text block.
        <div className="db-prose" lang={article.translated ? undefined : 'en'} dangerouslySetInnerHTML={{ __html: localiseProseLinks(article.body, locale) }} />
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

