import { query, withTransaction } from '../db.js';
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
  return withTransaction(async (q) => {
    const res = await q(
      'INSERT INTO pages (slug, parent_id, status) VALUES (?, ?, ?)',
      [slug, parentId, 'published']
    );
    const id = res.insertId;
    await q(
      `INSERT INTO page_translations (page_id, locale, title, status)
       VALUES (?, ?, ?, 'published')`,
      [id, DEFAULT_LOCALE, title || slug]
    );
    return id;
  });
}

// Unchecked delete: orphans any child pages (parent_id carries no FK, so
// nothing cascades or nulls it). Retained only for a test helper — real
// callers must use deletePageIfChildless below instead.
export async function deletePageUnchecked(id) {
  await query('DELETE FROM pages WHERE id = ?', [id]);
}

/**
 * Deletes a page only if it currently has no children, checked and enforced
 * inside a single transaction so a child row created between the check and
 * the delete cannot slip through and be orphaned.
 *
 * pages.parent_id carries no foreign key constraint, so the database itself
 * will not cascade or null it when a parent is deleted — the guard has to
 * live here in application code, and it has to be atomic with the delete.
 *
 * Throws an Error with `code: 'HAS_CHILDREN'` and `childCount` set when the
 * page still has children; the page is left untouched in that case.
 */
export async function deletePageIfChildless(id) {
  return withTransaction(async (q) => {
    // FOR UPDATE locks the child rows for the life of this transaction, so a
    // concurrent create/reparent under this id blocks until we commit or
    // roll back — the read and the delete are atomic together.
    const children = await q('SELECT id FROM pages WHERE parent_id = ? FOR UPDATE', [id]);
    if (children.length > 0) {
      const err = new Error(`Page ${id} has ${children.length} child page(s)`);
      err.code = 'HAS_CHILDREN';
      err.childCount = children.length;
      throw err;
    }
    await q('DELETE FROM pages WHERE id = ?', [id]);
  });
}

export async function addBlock({ pageId, type, data }) {
  return withTransaction(async (q) => {
    // FOR UPDATE serialises two concurrent calls on the same page
    const rows = await q('SELECT COALESCE(MAX(sort_order), -1) + 1 AS next FROM blocks WHERE page_id = ? FOR UPDATE', [pageId]);
    const sort = rows?.[0]?.next ?? 0;
    const res = await q('INSERT INTO blocks (page_id, type, sort_order) VALUES (?, ?, ?)', [pageId, type, sort]);
    const id = res.insertId;
    await q(
      `INSERT INTO block_translations (block_id, locale, data, status)
       VALUES (?, ?, ?, 'published')`,
      [id, DEFAULT_LOCALE, JSON.stringify(data || {})]
    );
    return id;
  });
}

export async function deleteBlock(id) {
  await query('DELETE FROM blocks WHERE id = ?', [id]);
}

export async function reorderBlocks(pageId, orderedIds) {
  return withTransaction(async (q) => {
    // Validate that we have every block id for the page
    const existing = (await q('SELECT id FROM blocks WHERE page_id = ? ORDER BY id', [pageId])) || [];
    const existingIds = new Set(existing.map((b) => b.id));
    const providedIds = new Set(orderedIds);

    if (orderedIds.length !== existingIds.size || providedIds.size !== existingIds.size || !orderedIds.every((id) => existingIds.has(id))) {
      throw new Error('reorderBlocks needs every block id for the page');
    }

    for (let i = 0; i < orderedIds.length; i += 1) {
      await q('UPDATE blocks SET sort_order = ? WHERE id = ? AND page_id = ?', [i, orderedIds[i], pageId]);
    }
  });
}

export async function duplicateBlock(blockId) {
  return withTransaction(async (q) => {
    const rows = await q('SELECT page_id, type, settings FROM blocks WHERE id = ? LIMIT 1', [blockId]);
    const src = rows?.[0];
    if (!src) throw new Error(`Block ${blockId} not found`);

    const next = await q('SELECT COALESCE(MAX(sort_order), -1) + 1 AS n FROM blocks WHERE page_id = ? FOR UPDATE', [src.page_id]);
    const res = await q(
      'INSERT INTO blocks (page_id, type, sort_order, settings) VALUES (?, ?, ?, ?)',
      [src.page_id, src.type, next?.[0]?.n ?? 0, src.settings ? JSON.stringify(asJson(src.settings)) : null]
    );
    const newId = res.insertId;

    const trans = (await q('SELECT locale, data, status FROM block_translations WHERE block_id = ?', [blockId])) || [];
    for (const t of trans) {
      await q(
        'INSERT INTO block_translations (block_id, locale, data, status) VALUES (?, ?, ?, ?)',
        [newId, t.locale, JSON.stringify(asJson(t.data)), t.status]
      );
    }
    return newId;
  });
}

export async function saveBlockTranslation({ blockId, locale, data, status = 'draft', userId = null }) {
  await query(
    `INSERT INTO block_translations (block_id, locale, data, status, updated_by)
     VALUES (?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE data = VALUES(data), status = VALUES(status), updated_by = VALUES(updated_by)`,
    [blockId, locale, JSON.stringify(data || {}), status, userId]
  );
}
