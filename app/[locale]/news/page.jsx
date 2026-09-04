import { notFound } from 'next/navigation';
import Link from 'next/link';
import { isLocale } from '../../../lib/i18n/locales.js';
import { t } from '../../../lib/i18n/ui.js';
import { alternatesFor } from '../../../lib/seo/alternates.js';
import { listNewsCached } from '../../../lib/newsroom/cache.js';
import { formatNewsDate, newsDateISO } from '../../../lib/newsroom/format.js';

export async function generateMetadata({ params }) {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return {
    title: t(locale, 'navNews'),
    description: t(locale, 'newsIntro'),
    alternates: alternatesFor('/news', locale),
  };
}

/**
 * The newsroom index.
 *
 * A dead database must not 500 this page — the house rule for every public
 * reader here, and the reason the empty state and the outage state look the
 * same to a visitor: both mean "nothing to show", and only one of them is
 * anybody's fault.
 */
export default async function NewsIndex({ params }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  let items = [];
  try {
    items = await listNewsCached(locale, 24);
  } catch {
    items = [];
  }

  return (
    <>
      <section className="db-block">
        <p className="db-eyebrow">{t(locale, 'navNews')}</p>
        <h1 className="db-h1">{t(locale, 'newsHeading')}</h1>
        <p className="db-lede">{t(locale, 'newsIntro')}</p>
      </section>

      <section className="db-block">
        {items.length === 0 ? (
          <p className="db-empty">{t(locale, 'newsEmpty')}</p>
        ) : (
          <ul className="db-newslist">
            {items.map((item) => (
              <li key={item.id} className="db-newsitem">
                <p className="db-newsmeta">
                  <time dateTime={newsDateISO(item.published_at)}>
                    {formatNewsDate(item.published_at, locale)}
                  </time>
                  {item.category ? <span className="db-newscat">{item.category}</span> : null}
                </p>
                <h2 className="db-newstitle">
                  <Link href={`/${locale}/news/${item.slug}`}>{item.title}</Link>
                </h2>
                {item.excerpt ? <p className="db-newsexcerpt">{item.excerpt}</p> : null}
                {/* An article shown in English inside a Bangla page says so.
                    Silently serving the fallback is how a reader concludes the
                    translation exists and is simply bad. */}
                {!item.translated ? (
                  <p className="db-newsfallback">{t(locale, 'newsInEnglish')}</p>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}

