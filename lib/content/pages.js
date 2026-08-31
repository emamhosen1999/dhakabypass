import { query } from '../db.js';
import { DEFAULT_LOCALE } from '../i18n/locales.js';

const asJson = (v) => (typeof v === 'string' ? JSON.parse(v) : v);

export async function listPages() {
  return (
    (await query(`
      SELECT p.id, p.slug, p.parent_id, p.nav_order, p.status,
             COALESCE(t.title, '') AS title
      FROM pages p
      LEFT JOIN page_translations t ON t.page_id = p.id AND t.locale = ?
      ORDER BY p.nav_order, p.id
    `, [DEFAULT_LOCALE])) || []
  );
}

export async function getPageBySlug(slug) {
  const rows = await query('SELECT id, slug, parent_id, status FROM pages WHERE slug = ? LIMIT 1', [slug]);
  const page = rows?.[0];
  if (!page) return null;
  const translations = (await query(
    'SELECT locale, title, seo_title, seo_description, og_image, status FROM page_translations WHERE page_id = ?',
    [page.id]
  )) || [];
  return { ...page, translations };
}

export async function getPageBlocks(pageId) {
  const blocks = (await query(
    'SELECT id, type, sort_order, settings FROM blocks WHERE page_id = ? ORDER BY sort_order, id',
    [pageId]
  )) || [];
  if (blocks.length === 0) return [];

  const ids = blocks.map((b) => b.id);
  const placeholders = ids.map(() => '?').join(',');
  const trans = (await query(
    `SELECT block_id, locale, data, status FROM block_translations WHERE block_id IN (${placeholders})`,
    ids
  )) || [];

  return blocks.map((b) => ({
    ...b,
    settings: b.settings ? asJson(b.settings) : {},
    translations: trans
      .filter((t) => t.block_id === b.id)
      .map((t) => ({ locale: t.locale, data: asJson(t.data), status: t.status })),
  }));
}

export async function createPage({ slug, title, parentId = null }) {
  const res = await query(
    'INSERT INTO pages (slug, parent_id, status) VALUES (?, ?, ?)',
    [slug, parentId, 'published']
  );
  const id = res.insertId;
  await query(
    `INSERT INTO page_translations (page_id, locale, title, status)
     VALUES (?, ?, ?, 'published')`,
    [id, DEFAULT_LOCALE, title || slug]
  );
  return id;
}

export async function deletePage(id) {
  await query('DELETE FROM pages WHERE id = ?', [id]);
}

export async function addBlock({ pageId, type, data }) {
  const rows = await query('SELECT COALESCE(MAX(sort_order), -1) + 1 AS next FROM blocks WHERE page_id = ?', [pageId]);
  const sort = rows?.[0]?.next ?? 0;
  const res = await query('INSERT INTO blocks (page_id, type, sort_order) VALUES (?, ?, ?)', [pageId, type, sort]);
  const id = res.insertId;
  await query(
    `INSERT INTO block_translations (block_id, locale, data, status)
     VALUES (?, ?, ?, 'published')`,
    [id, DEFAULT_LOCALE, JSON.stringify(data || {})]
  );
  return id;
}

export async function deleteBlock(id) {
  await query('DELETE FROM blocks WHERE id = ?', [id]);
}

export async function reorderBlocks(pageId, orderedIds) {
  for (let i = 0; i < orderedIds.length; i += 1) {
    await query('UPDATE blocks SET sort_order = ? WHERE id = ? AND page_id = ?', [i, orderedIds[i], pageId]);
  }
}

export async function duplicateBlock(blockId) {
  const rows = await query('SELECT page_id, type, settings FROM blocks WHERE id = ? LIMIT 1', [blockId]);
  const src = rows?.[0];
  if (!src) throw new Error(`Block ${blockId} not found`);

  const next = await query('SELECT COALESCE(MAX(sort_order), -1) + 1 AS n FROM blocks WHERE page_id = ?', [src.page_id]);
  const res = await query(
    'INSERT INTO blocks (page_id, type, sort_order, settings) VALUES (?, ?, ?, ?)',
    [src.page_id, src.type, next?.[0]?.n ?? 0, src.settings ? JSON.stringify(asJson(src.settings)) : null]
  );
  const newId = res.insertId;

  const trans = (await query('SELECT locale, data, status FROM block_translations WHERE block_id = ?', [blockId])) || [];
  for (const t of trans) {
    await query(
      'INSERT INTO block_translations (block_id, locale, data, status) VALUES (?, ?, ?, ?)',
      [newId, t.locale, JSON.stringify(asJson(t.data)), t.status]
    );
  }
  return newId;
}

export async function saveBlockTranslation({ blockId, locale, data, status = 'draft', userId = null }) {
  await query(
    `INSERT INTO block_translations (block_id, locale, data, status, updated_by)
     VALUES (?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE data = VALUES(data), status = VALUES(status), updated_by = VALUES(updated_by)`,
    [blockId, locale, JSON.stringify(data || {}), status, userId]
  );
}
