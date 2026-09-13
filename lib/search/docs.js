import { cache } from 'react';
import { unstable_cache } from 'next/cache';
import { query, dbEnabled } from '../db.js';
import { asJson } from '../json.js';
import { DEFAULT_LOCALE } from '../i18n/locales.js';
import { LIST_TAG, NEWS_TAG } from '../revalidate.js';
import { pathForSlug, localisedPath } from '../seo/routes.js';
import { listNews } from '../newsroom/repo.js';
import { blockText, plainText } from './index.js';

const NOT_FOUND_SLUG = 'not-found';

/**
 * The searchable documents for one locale: every published page (its title,
 * search description and every published block, in this locale with English
 * where a translation is missing) and every published news article.
 */
export async function loadSearchDocs(locale) {
  if (!dbEnabled()) return [];
  const pages = (await query(
    `SELECT p.id, p.slug, pt.locale, pt.title, pt.seo_description
       FROM pages p JOIN page_translations pt ON pt.page_id = p.id
      WHERE p.status = 'published' AND pt.status = 'published' AND pt.locale IN (?, ?) AND p.slug <> ?`,
    [locale, DEFAULT_LOCALE, NOT_FOUND_SLUG],
  )) || [];
  const blocks = (await query(
    `SELECT b.id AS block_id, b.page_id, t.locale, t.data
       FROM blocks b JOIN block_translations t ON t.block_id = b.id JOIN pages p ON p.id = b.page_id
      WHERE p.status = 'published' AND t.status = 'published' AND t.locale IN (?, ?)
      ORDER BY b.sort_order, b.id`,
    [locale, DEFAULT_LOCALE],
  )) || [];

  const prefer = (rows, key) => {
    const best = new Map();
    for (const r of rows) {
      const k = r[key];
      if (!best.has(k) || r.locale === locale) best.set(k, r);
    }
    return best;
  };
  const pageRows = prefer(pages, 'id');
  const blockRows = prefer(blocks, 'block_id');
  const textByPage = new Map();
  for (const b of blockRows.values()) {
    const text = blockText(asJson(b.data, {}));
    if (text) textByPage.set(b.page_id, `${textByPage.get(b.page_id) || ''} ${text}`);
  }

  const docs = [...pageRows.values()].map((p) => ({
    kind: 'page',
    href: localisedPath(pathForSlug(p.slug), locale),
    title: p.title || p.slug,
    text: `${plainText(p.seo_description)} ${textByPage.get(p.id) || ''}`.trim(),
  }));

  let news = [];
  try { news = await listNews({ locale, limit: 100 }); } catch { news = []; }
  for (const n of news) {
    docs.push({
      kind: 'news',
      href: `/${locale}/news/${n.slug}`,
      title: n.title,
      text: `${plainText(n.excerpt)} ${plainText(n.body)}`.trim(),
    });
  }
  return docs;
}

export const getSearchDocsCached = cache((locale) =>
  unstable_cache(() => loadSearchDocs(locale), ['search-docs', String(locale)], {
    tags: [LIST_TAG, NEWS_TAG, 'search'],
    revalidate: 300,
  })(),
);
