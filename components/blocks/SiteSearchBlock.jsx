import Link from 'next/link';
import { t } from '../../lib/i18n/ui.js';
import { searchDocs } from '../../lib/search/index.js';
import { getSearchDocsCached } from '../../lib/search/docs.js';

const text = (v) => (typeof v === 'string' ? v.trim() : '');

export default async function SiteSearchBlock({ data = {}, locale, searchParams, blockId }) {
  let search = null;
  try { search = searchParams ? await searchParams : null; } catch { search = null; }
  const q = typeof search?.q === 'string' ? search.q.slice(0, 120).trim() : '';
  const limit = Math.min(Math.max(Number(data.limit) || 30, 1), 100);

  let results = [];
  if (q) {
    try { results = searchDocs(await getSearchDocsCached(locale), q, limit); } catch { results = []; }
  }
  const inputId = `site-search-${blockId ?? 'q'}`;
  const heading = text(data.heading);
  const intro = text(data.intro);

  return (
    <section className="db-block db-search-block">
      {heading ? <h2 className="db-h2">{heading}</h2> : null}
      {intro ? <p className="db-lede">{intro}</p> : null}
      <form method="get" role="search" className="db-search-form">
        <label htmlFor={inputId} className="db-search-label">{t(locale, 'searchLabel')}</label>
        <div className="db-search-row">
          <input id={inputId} type="search" name="q" defaultValue={q} maxLength={120} className="db-search-input" />
          <button type="submit" className="db-btn db-btn-primary">{t(locale, 'searchButton')}</button>
        </div>
      </form>
      {q ? (
        <div aria-live="polite">
          <p className="db-search-count">
            {results.length
              ? t(locale, 'searchCount').replace('{n}', String(results.length)).replace('{q}', q)
              : t(locale, 'searchNone').replace('{q}', q)}
          </p>
          {results.length ? (
            <ol className="db-search-results">
              {results.map((r) => (
                <li key={r.href}>
                  <Link href={r.href} className="db-search-title">{r.title}</Link>
                  {r.kind === 'news' ? <span className="db-search-kind">{t(locale, 'searchNews')}</span> : null}
                  {r.excerpt ? <p className="db-search-excerpt">{r.excerpt}</p> : null}
                </li>
              ))}
            </ol>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
