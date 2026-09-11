import Link from 'next/link';
import { t } from '../../lib/i18n/ui.js';
import { listNewsCached } from '../../lib/newsroom/cache.js';
import { formatNewsDate, newsDateISO } from '../../lib/newsroom/format.js';

const text = (v) => (typeof v === 'string' ? v.trim() : '');

/** What /news rendered, reading the same cache the same way. */
export default async function NewsListBlock({ data, locale }) {
  const limit = Math.min(Math.max(Number(data?.limit) || 24, 1), 200);
  const category = text(data?.category);
  let items = [];
  try {
    items = await listNewsCached(locale, limit);
  } catch { items = []; }
  if (category) items = items.filter((i) => i.category === category);

  const heading = text(data?.heading);
  const intro = text(data?.intro);
  const empty = text(data?.emptyMessage) || t(locale, 'newsEmpty');

  return (
    <section className="db-block db-newslist-block">
      {heading ? <h2 className="db-h2">{heading}</h2> : null}
      {intro ? <p className="db-lede">{intro}</p> : null}
      {items.length === 0 ? (
        <p className="db-empty">{empty}</p>
      ) : (
        <ul className="db-newslist">
          {items.map((item) => (
            <li key={item.id} className="db-newsitem">
              <p className="db-newsmeta">
                <time dateTime={newsDateISO(item.published_at)}>{formatNewsDate(item.published_at, locale)}</time>
                {item.category ? <span className="db-newscat">{item.category}</span> : null}
              </p>
              <h3 className="db-newstitle">
                <Link href={`/${locale}/news/${item.slug}`}>{item.title}</Link>
              </h3>
              {item.excerpt ? <p className="db-newsexcerpt">{item.excerpt}</p> : null}
              {/* An article shown in English inside a Bangla page says so. */}
              {!item.translated ? <p className="db-newsfallback">{t(locale, 'newsInEnglish')}</p> : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
