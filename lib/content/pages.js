import { query, withTransaction } from '../db.js';
import { DEFAULT_LOCALE } from '../i18n/locales.js';
import { recordRevision } from './revisions.js';

const asJson = (v) => (typeof v === 'string' ? JSON.parse(v) : v);

export async function listPages() {
  return (
    (await query(`
      SELECT p.id, p.slug, p.parent_id, p.nav_order, p.status, p.updated_at, p.updated_by,
             COALESCE(t.title, '') AS title
      FROM pages p
      LEFT JOIN page_translations t ON t.page_id = p.id AND t.locale = ?
      ORDER BY p.nav_order, p.id
    `, [DEFAULT_LOCALE])) || []
  );
}

export async function getPageBySlug(slug) {
  const rows = await query('SELECT id, slug, parent_id, status, legal_status FROM pages WHERE slug = ? LIMIT 1', [slug]);
  const page = rows?.[0];
  if (!page) return null;
  const translations = (await query(
    'SELECT locale, title, seo_title, seo_description, og_image, status FROM page_translations WHERE page_id = ?',
    [page.id]
  )) || [];
  return { ...page, translations };
}

/**
 * A page's blocks with their translations. `locale` (public readers) fetches
 * only that locale and English, the fallback — the other language rows are
 * never used to render a page (W6.17). Without it (the admin, the preview)
 * every translation comes back.
 */
export async function getPageBlocks(pageId, { locale = null } = {}) {
  const blocks = (await query(
    'SELECT id, type, sort_order, settings FROM blocks WHERE page_id = ? ORDER BY sort_order, id',
    [pageId]
  )) || [];
  if (blocks.length === 0) return [];

  const ids = blocks.map((b) => b.id);
  const placeholders = ids.map(() => '?').join(',');
  const onlyLocale = typeof locale === 'string' && /^[a-z]{2}$/.test(locale);
  const trans = (await query(
    `SELECT block_id, locale, data, status, draft_data, updated_at FROM block_translations WHERE block_id IN (${placeholders})`
      + (onlyLocale ? ' AND locale IN (?, ?)' : ''),
    onlyLocale ? [...ids, locale, 'en'] : ids
  )) || [];

  return blocks.map((b) => ({
    ...b,
    settings: b.settings ? asJson(b.settings) : {},
    translations: trans
      .filter((t) => t.block_id === b.id)
      .map((t) => ({
        locale: t.locale,
        data: asJson(t.data),
        status: t.status,
        // The working copy of a live block (W7.2): what the editor and the
        // preview show, never what the public page reads.
        draft: t.draft_data == null ? null : asJson(t.draft_data),
        updatedAt: t.updated_at ?? null,
      })),
  }));
}

/**
 * A new page starts as a DRAFT (W7.3): an empty page no longer appears on the
 * public site the moment it is named. It is published from its settings panel.
 */
export async function createPage({ slug, title, parentId = null, status = 'draft', actor = '' }) {
  return withTransaction(async (q) => {
    const res = await q(
      'INSERT INTO pages (slug, parent_id, status, updated_by) VALUES (?, ?, ?, ?)',
      [slug, parentId, status, actor]
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
    // Unpublished until an editor fills it in and presses Publish (W7.2): an
    // empty block no longer lands on a live page the moment it is added.
    await q(
      `INSERT INTO block_translations (block_id, locale, data, status)
       VALUES (?, ?, ?, 'draft')`,
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

    // The copy starts unpublished in every language, from the working copy
    // where there is one: a duplicate never appears twice on a live page.
    const trans = (await q('SELECT locale, data, draft_data FROM block_translations WHERE block_id = ?', [blockId])) || [];
    for (const t of trans) {
      await q(
        'INSERT INTO block_translations (block_id, locale, data, status) VALUES (?, ?, ?, ?)',
        [newId, t.locale, JSON.stringify(asJson(t.draft_data ?? t.data)), 'draft']
      );
    }
    return newId;
  });
}

/**
 * Save one language of a block (W1.13, W7.2).
 *
 * DRAFT on a block that is live writes the working copy (`draft_data`) and
 * leaves the live text exactly as it is: "Save draft" used to overwrite the one
 * row and set it to draft, which took the block off the public page. On a block
 * that is not live there is no live copy to protect, so the text is the draft.
 *
 * PUBLISH writes the live text and clears the working copy.
 *
 * Whatever is about to be overwritten — the live text, or an earlier draft —
 * is kept as a revision first, in the same transaction.
 */
export async function saveBlockTranslation({ blockId, locale, data, status = 'draft', userId = null }) {
  await withTransaction(async (q) => {
    const prev = (await q(
      'SELECT data, status, draft_data FROM block_translations WHERE block_id = ? AND locale = ? FOR UPDATE',
      [blockId, locale],
    ))?.[0];
    const json = JSON.stringify(data || {});
    if (status === 'published') {
      if (prev) {
        await recordRevision(q, { blockId, locale, userId, status: prev.status, data: asJson(prev.data) });
      }
      await q(
        `INSERT INTO block_translations (block_id, locale, data, status, updated_by, draft_data, draft_updated_at, draft_updated_by)
         VALUES (?, ?, ?, 'published', ?, NULL, NULL, NULL)
         ON DUPLICATE KEY UPDATE data = VALUES(data), status = 'published', updated_by = VALUES(updated_by),
           draft_data = NULL, draft_updated_at = NULL, draft_updated_by = NULL`,
        [blockId, locale, json, userId],
      );
      return;
    }
    if (prev?.status === 'published') {
      if (prev.draft_data != null) {
        await recordRevision(q, { blockId, locale, userId, status: 'draft', data: asJson(prev.draft_data) });
      }
      await q(
        `UPDATE block_translations SET draft_data = ?, draft_updated_at = CURRENT_TIMESTAMP, draft_updated_by = ?
          WHERE block_id = ? AND locale = ?`,
        [json, userId, blockId, locale],
      );
      return;
    }
    if (prev) {
      await recordRevision(q, { blockId, locale, userId, status: prev.status, data: asJson(prev.data) });
    }
    await q(
      `INSERT INTO block_translations (block_id, locale, data, status, updated_by)
       VALUES (?, ?, ?, 'draft', ?)
       ON DUPLICATE KEY UPDATE data = VALUES(data), status = 'draft', updated_by = VALUES(updated_by),
         draft_data = NULL, draft_updated_at = NULL, draft_updated_by = NULL`,
      [blockId, locale, json, userId],
    );
  });
}

/** Throw away a live block's working copy. The draft is kept as a revision. */
export async function discardBlockDraft({ blockId, locale, userId = null }) {
  await withTransaction(async (q) => {
    const prev = (await q(
      'SELECT draft_data FROM block_translations WHERE block_id = ? AND locale = ? FOR UPDATE',
      [blockId, locale],
    ))?.[0];
    if (!prev || prev.draft_data == null) return;
    await recordRevision(q, { blockId, locale, userId, status: 'draft', data: asJson(prev.draft_data) });
    await q(
      'UPDATE block_translations SET draft_data = NULL, draft_updated_at = NULL, draft_updated_by = NULL WHERE block_id = ? AND locale = ?',
      [blockId, locale],
    );
  });
}

/**
 * Take one language of a block off the public page. The working copy, if
 * there is one, becomes the text; readers of that language see English.
 */
export async function unpublishBlockTranslation({ blockId, locale, userId = null }) {
  await withTransaction(async (q) => {
    const prev = (await q(
      'SELECT data, status, draft_data FROM block_translations WHERE block_id = ? AND locale = ? FOR UPDATE',
      [blockId, locale],
    ))?.[0];
    if (!prev || prev.status !== 'published') return;
    await recordRevision(q, { blockId, locale, userId, status: prev.status, data: asJson(prev.data) });
    await q(
      `UPDATE block_translations SET data = COALESCE(draft_data, data), status = 'draft', updated_by = ?,
         draft_data = NULL, draft_updated_at = NULL, draft_updated_by = NULL
        WHERE block_id = ? AND locale = ?`,
      [userId, blockId, locale],
    );
  });
}

/**
 * Copy a whole page — its translations, every block, every block
 * translation — under a new slug, as a DRAFT (W1.23).
 *
 * Most pages on this site share a skeleton (hero, prose, cards, a closing
 * band). Before this, the only way to start a new page from an existing one
 * was to create an empty page and duplicate blocks one at a time across it,
 * which the editor did not support either. This is "page templates" in the
 * only form that does not need a second concept: any page is a template.
 *
 * Everything lands as `draft` — the page and each translation — so a copy
 * never publishes by accident under a slug a crawler can reach. Titles carry
 * the copy suffix the caller passes (per locale), so two identical titles
 * never sit side by side in the list. Block `settings` are copied verbatim;
 * translation `status` is preserved on blocks (a draft block on the source
 * stays draft), because only the PAGE gate matters for visibility and the
 * operator will want the same per-block state to work from.
 *
 * One transaction: a failure mid-way leaves no half page behind.
 *
 * @returns the new page id, or throws with code DUPLICATE_SLUG / NOT_FOUND.
 */
export async function duplicatePage({ sourceId, slug, titleSuffix = () => ' (copy)' }) {
  return withTransaction(async (q) => {
    const src = (await q('SELECT id, slug, parent_id, template FROM pages WHERE id = ? FOR UPDATE', [sourceId]))?.[0];
    if (!src) { const e = new Error('Source page not found'); e.code = 'NOT_FOUND'; throw e; }
    if ((await q('SELECT id FROM pages WHERE slug = ? LIMIT 1', [slug]))?.length) {
      const e = new Error(`A page already lives at "${slug}"`); e.code = 'DUPLICATE_SLUG'; throw e;
    }
    const res = await q(
      'INSERT INTO pages (slug, parent_id, template, status) VALUES (?, ?, ?, ?)',
      [slug, src.parent_id, src.template || 'default', 'draft'],
    );
    const pageId = res.insertId;

    const translations = (await q(
      'SELECT locale, title, seo_title, seo_description, og_image FROM page_translations WHERE page_id = ?',
      [sourceId],
    )) || [];
    for (const t of translations) {
      await q(
        `INSERT INTO page_translations (page_id, locale, title, seo_title, seo_description, og_image, status)
         VALUES (?, ?, ?, ?, ?, ?, 'draft')`,
        [pageId, t.locale, `${t.title || ''}${titleSuffix(t.locale)}`.trim().slice(0, 255),
          t.seo_title ?? '', t.seo_description ?? '', t.og_image ?? ''],
      );
    }

    const blocks = (await q(
      'SELECT id, type, sort_order, settings, status FROM blocks WHERE page_id = ? ORDER BY sort_order, id',
      [sourceId],
    )) || [];
    for (const b of blocks) {
      const ins = await q(
        'INSERT INTO blocks (page_id, type, sort_order, settings, status) VALUES (?, ?, ?, ?, ?)',
        [pageId, b.type, b.sort_order, b.settings == null ? null : (typeof b.settings === 'string' ? b.settings : JSON.stringify(b.settings)), b.status || 'draft'],
      );
      const rows = (await q('SELECT locale, data, status FROM block_translations WHERE block_id = ?', [b.id])) || [];
      for (const r of rows) {
        await q(
          'INSERT INTO block_translations (block_id, locale, data, status) VALUES (?, ?, ?, ?)',
          [ins.insertId, r.locale, typeof r.data === 'string' ? r.data : JSON.stringify(r.data), r.status || 'draft'],
        );
      }
    }
    return pageId;
  });
}

/** Presentation settings for one block (W1.15): a small validated object,
 *  shared by every language. `{}` clears them. */
export async function setBlockSettings(blockId, pageId, settings) {
  await query(
    'UPDATE blocks SET settings = ? WHERE id = ? AND page_id = ?',
    [Object.keys(settings || {}).length ? JSON.stringify(settings) : null, blockId, pageId],
  );
}
