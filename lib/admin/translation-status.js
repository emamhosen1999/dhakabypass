import { query, dbEnabled } from '../db.js';

/**
 * One view of what still needs a translator (audit T1), across every kind of
 * content that carries text in three languages, not only page blocks:
 * blocks, page titles, news, menu links, interchange and waypoint names,
 * segment labels, cameras, toll class labels, advisories, road names and
 * picture descriptions.
 *
 * Each row counts, per language, how many records have the text published,
 * how many hold it only as a draft, and how many have none. Counts are made
 * in SQL over the JSON columns so the screen stays one round of queries.
 */
const LANGS = ['bn', 'zh'];

const jsonCounts = (label, href, table, column, where = '1 = 1') => ({
  label, href,
  sql: `SELECT COUNT(*) AS total,
          ${LANGS.map((l) => `SUM(COALESCE(JSON_UNQUOTE(JSON_EXTRACT(${column}, '$.${l}')), '') <> '') AS ${l}_published`).join(', ')}
        FROM ${table} WHERE ${where}`,
  drafts: false,
});

export const SOURCES = [
  {
    label: 'Page blocks', href: '/admin/translations#pages',
    sql: `SELECT COUNT(DISTINCT b.id) AS total,
            ${LANGS.map((l) => `SUM(bt.locale = '${l}' AND bt.status = 'published') AS ${l}_published, SUM(bt.locale = '${l}' AND bt.status = 'draft') AS ${l}_draft`).join(', ')}
          FROM blocks b JOIN pages p ON p.id = b.page_id AND p.status = 'published'
          LEFT JOIN block_translations bt ON bt.block_id = b.id`,
    drafts: true,
  },
  {
    label: 'Page titles', href: '/admin/pages-v2',
    sql: `SELECT COUNT(DISTINCT p.id) AS total,
            ${LANGS.map((l) => `SUM(pt.locale = '${l}' AND pt.title <> '') AS ${l}_published`).join(', ')}
          FROM pages p LEFT JOIN page_translations pt ON pt.page_id = p.id WHERE p.status = 'published'`,
    drafts: false,
  },
  {
    label: 'News articles', href: '/admin/news',
    sql: `SELECT COUNT(DISTINCT n.id) AS total,
            ${LANGS.map((l) => `SUM(nt.locale = '${l}' AND nt.status = 'published') AS ${l}_published, SUM(nt.locale = '${l}' AND nt.status = 'draft') AS ${l}_draft`).join(', ')}
          FROM news_updates n LEFT JOIN news_translations nt ON nt.news_id = n.id WHERE n.is_published = 1`,
    drafts: true,
  },
  jsonCounts('Menu links', '/admin/menus', 'menu_items', 'labels', "href <> '' OR parent_id IS NULL"),
  jsonCounts('Interchanges and plazas', '/admin/corridor/interchanges', 'interchanges', 'names'),
  jsonCounts('Waypoint names', '/admin/corridor/waypoints', 'corridor_waypoints', 'names', 'names IS NOT NULL'),
  jsonCounts('Segment labels', '/admin/corridor/segments', 'segments', 'labels'),
  jsonCounts('Toll class labels', '/admin/corridor/tolls', 'toll_rates', 'class_labels'),
  jsonCounts('Advisories', '/admin/corridor/advisories', 'advisories', 'messages', 'is_active = 1'),
  jsonCounts('Road names', '/admin/corridor/roads', 'corridor_roads', 'names'),
  jsonCounts('Cameras', '/admin/corridor/cameras', 'cameras', 'names', 'is_active = 1'),
  jsonCounts('Picture descriptions', '/admin/media?show=undescribed', 'media', 'alt', "JSON_UNQUOTE(JSON_EXTRACT(alt, '$.en')) <> ''"),
];

export function shapeRow(source, row) {
  const total = Number(row?.total || 0);
  const out = { label: source.label, href: source.href, total, langs: {} };
  for (const l of LANGS) {
    const published = Math.min(total, Number(row?.[`${l}_published`] || 0));
    const draft = source.drafts ? Math.min(total - published, Number(row?.[`${l}_draft`] || 0)) : 0;
    out.langs[l] = { published, draft, missing: Math.max(0, total - published - draft) };
  }
  return out;
}

export async function translationStatus() {
  if (!dbEnabled()) return [];
  const rows = [];
  for (const source of SOURCES) {
    try {
      const result = await query(source.sql);
      rows.push(shapeRow(source, result?.[0]));
    } catch {
      rows.push({ label: source.label, href: source.href, total: 0, langs: {}, error: true });
    }
  }
  return rows;
}
