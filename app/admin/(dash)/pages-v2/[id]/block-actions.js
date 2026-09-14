'use server';

import { validationError, friendly } from '../../../../../lib/errors';
import { getRevision } from '../../../../../lib/content/revisions';
import { parsePresentationForm } from '../../../../../lib/blocks/presentation';
import { runAction } from '../../../../../lib/admin/run-action';

import { revalidatePath } from 'next/cache';
import { assertCan } from '../../../../../lib/auth/assert-can';
import { getBlock, validateBlockData, defaultBlockData } from '../../../../../lib/blocks/registry';
import { parseBlockForm } from '../../../../../lib/blocks/form';
import '../../../../../lib/blocks/index';
import {
  addBlock, reorderBlocks, duplicateBlock, saveBlockTranslation, getPageBlocks, setBlockSettings,
  discardBlockDraft, unpublishBlockTranslation,
} from '../../../../../lib/content/pages';
import { deleteRecord } from '../../../../../lib/admin/record-actions';
import { logAudit, recordHistory, stampOf } from '../../../../../lib/admin/history';
import { setFlash } from '../../../../../lib/admin/context';
import { query } from '../../../../../lib/db';
import { revalidatePage } from '../../../../../lib/revalidate';
import { isLocale } from '../../../../../lib/i18n/locales';

const adminPath = (pageId) => `/admin/pages-v2/${pageId}`;

const VALID_STATUSES = ['draft', 'published'];

async function addBlockAction$inner(formData) {
  await assertCan('edit_blocks');
  const pageId = Number(formData.get('pageId'));
  const slug = String(formData.get('slug') || '');
  const type = String(formData.get('type') || '');
  if (!getBlock(type)) throw validationError(`"${type}" is not a block type`);

  let blockId;
  try {
    blockId = await addBlock({ pageId, type, data: defaultBlockData(type) });
    // "Add below" places it straight after the chosen block.
    const after = Number(formData.get('after'));
    if (Number.isInteger(after) && after > 0) {
      const ids = (await getPageBlocks(pageId)).map((b) => b.id).filter((id) => id !== blockId);
      const at = ids.indexOf(after);
      if (at >= 0) {
        ids.splice(at + 1, 0, blockId);
        await reorderBlocks(pageId, ids);
      }
    }
  } catch {
    // Never leak driver text (a connection drop, an FK violation from a
    // forged pageId) to the browser.
    throw validationError('Could not add the block. Please try again.');
  }
  await logAudit({ action: 'block.create', type: 'block', id: blockId, label: `"${getBlock(type).label}" block on /${slug}` });
  if (slug) revalidatePage(slug);
  revalidatePath(adminPath(pageId));
  setFlash(`Added a ${getBlock(type).label} block. It is not on the public page until you publish it.`);
}

async function deleteBlockAction$inner(formData) {
  await assertCan('edit_blocks');
  const pageId = Number(formData.get('pageId'));
  const slug = String(formData.get('slug') || '');

  const blockId = Number(formData.get('blockId'));
  const owner = await query('SELECT page_id FROM blocks WHERE id = ? LIMIT 1', [blockId]);
  if (!owner?.length || Number(owner[0].page_id) !== pageId) throw validationError('That block is not on this page.');
  try {
    // All its languages go to the trash together and come back together.
    await deleteRecord('block', blockId, { formData });
  } catch (err) {
    friendly(err, 'Could not delete the block. Please try again.');
  }
  if (slug) revalidatePage(slug);
  revalidatePath(adminPath(pageId));
}

async function duplicateBlockAction$inner(formData) {
  await assertCan('edit_blocks');
  const pageId = Number(formData.get('pageId'));
  const slug = String(formData.get('slug') || '');

  try {
    await duplicateBlock(Number(formData.get('blockId')));
  } catch {
    throw validationError('Could not duplicate the block. Please try again.');
  }
  await logAudit({ action: 'block.duplicate', type: 'block', id: formData.get('blockId'), label: `block on /${slug}` });
  if (slug) revalidatePage(slug);
  revalidatePath(adminPath(pageId));
  setFlash('Duplicated. The copy is unpublished in every language until you publish it.');
}

/**
 * Parses the `order` field — a comma-separated list of block ids in their new
 * order — into a validated array of positive integers.
 *
 * This is a forgeable hidden field, so every element is checked here before it
 * reaches SQL: ids must be whole positive numbers and each may appear once.
 * `reorderBlocks` then re-checks the set against the page's actual block ids
 * inside the transaction, so a valid-looking list belonging to another page is
 * still rejected — this is the cheap first gate, not the only one.
 */
function parseOrder(raw) {
  const parts = String(raw ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s !== '');
  if (parts.length === 0) throw validationError('That is not a valid block order.');

  const ids = parts.map((s) => Number(s));
  const ok = ids.every((n) => Number.isInteger(n) && n > 0);
  if (!ok || new Set(ids).size !== ids.length) {
    throw validationError('That is not a valid block order.');
  }
  return ids;
}

/**
 * Replaces the whole ordering of a page's blocks in one action.
 *
 * This supersedes the per-block up/down forms, which cost one server round
 * trip and one full page re-render per single swap — moving a block from
 * position 9 to position 1 was eight page reloads. One drag is now one action
 * and one `reorderBlocks` transaction (lib/content/pages.js, which uses
 * `withTransaction`), so the page is never observed mid-shuffle.
 */
async function reorderBlocksAction$inner(formData) {
  await assertCan('edit_blocks');
  const pageId = Number(formData.get('pageId'));
  const slug = String(formData.get('slug') || '');
  // Outside the try: a malformed order is the caller's bug, not a database
  // failure, and must not be reported as one.
  const ids = parseOrder(formData.get('order'));

  try {
    await reorderBlocks(pageId, ids);
  } catch {
    throw validationError('Could not reorder the blocks. Please try again.');
  }
  await logAudit({ action: 'page.reorder', type: 'page', id: pageId, label: `blocks on /${slug}`, detail: { order: ids.join(',') } });
  if (slug) revalidatePage(slug);
  revalidatePath(adminPath(pageId));
}

async function saveTranslationAction$inner(formData) {
  const session = await assertCan('translate');
  const pageId = Number(formData.get('pageId'));
  const blockId = Number(formData.get('blockId'));
  const locale = String(formData.get('locale'));
  const type = String(formData.get('type'));
  const status = String(formData.get('status') || 'draft');
  const slug = String(formData.get('slug') || '');

  // Unlike addBlockAction, this form doesn't create the block — but an
  // unregistered or mismatched type must still be rejected before it ever
  // reaches parseBlockForm/saveBlockTranslation. Without this check,
  // parseBlockForm silently returns {} for an unknown type, and because
  // validateBlockData is only consulted when status === 'published', a
  // *draft* save would overwrite the block's existing translation with an
  // empty object via ON DUPLICATE KEY UPDATE.
  if (!getBlock(type)) throw validationError(`"${type}" is not a block type`);

  // A stale form (or a forged hidden field) could submit a locale outside
  // the supported set. On MySQL strict mode this errors at the INSERT; on a
  // non-strict sql_mode (a plausible default on shared MariaDB hosting) it
  // silently inserts as '', leaving a garbage block_translations row that no
  // reader ever surfaces. Reject it here instead.
  if (!isLocale(locale)) throw validationError(`"${locale}" is not a supported language`);

  // 'missing' is a valid database value but means "no row exists" — it must
  // never be settable from this form, only 'draft' or 'published'.
  if (!VALID_STATUSES.includes(status)) {
    throw validationError('Status must be "draft" or "published"');
  }

  const data = parseBlockForm(type, formData);
  const check = validateBlockData(type, data);
  // A draft may be incomplete; publishing may not.
  if (status === 'published' && !check.ok) throw validationError(`Not published: ${check.errors.join('. ')}. Your text is kept below.`);

  // Someone else saved this language after the form was opened (W7.8).
  const stamp = String(formData.get('_stamp') || '');
  if (stamp) {
    const rows = await query(
      `SELECT bt.updated_at, u.email FROM block_translations bt LEFT JOIN users u ON u.id = COALESCE(bt.draft_updated_by, bt.updated_by)
        WHERE bt.block_id = ? AND bt.locale = ? LIMIT 1`,
      [blockId, locale],
    );
    const now = rows?.[0] ? stampOf(rows[0].updated_at) : '';
    if (now && now !== stamp) {
      throw validationError(`${rows[0].email || 'Someone else'} saved this block in this language at ${now.slice(11, 16)}, after you opened it. Your text is kept below: compare it with the preview, then save again.`);
    }
  }

  try {
    await saveBlockTranslation({ blockId, locale, data, status, userId: Number(session.user.id) || null });
  } catch {
    throw validationError('Could not save. Please try again.');
  }
  await logAudit({ action: status === 'published' ? 'block.publish' : 'block.save_draft', type: 'block', id: blockId, label: `${getBlock(type).label} (${locale}) on /${slug}` });
  if (slug) revalidatePage(slug);
  revalidatePath(adminPath(pageId));
  setFlash(status === 'published'
    ? `Published the ${locale} text. It is on the public page now.`
    : 'Draft saved. The public page is unchanged until you publish.');
}

/** Throw away the unpublished changes to one language of a live block. */
async function discardDraftAction$inner(formData) {
  const session = await assertCan('translate');
  const pageId = Number(formData.get('pageId'));
  const blockId = Number(formData.get('blockId'));
  const locale = String(formData.get('locale'));
  const slug = String(formData.get('slug') || '');
  if (!isLocale(locale)) throw validationError(`"${locale}" is not a supported language`);
  try {
    await discardBlockDraft({ blockId, locale, userId: Number(session.user.id) || null });
  } catch { throw validationError('Could not discard the draft. Please try again.'); }
  await logAudit({ action: 'block.discard_draft', type: 'block', id: blockId, label: `${locale} draft on /${slug}` });
  revalidatePath(adminPath(pageId));
  setFlash('Draft discarded. It is kept under Previous versions if you need it back.');
}

/** Take one language of a block off the public page. */
async function unpublishTranslationAction$inner(formData) {
  const session = await assertCan('translate');
  const pageId = Number(formData.get('pageId'));
  const blockId = Number(formData.get('blockId'));
  const locale = String(formData.get('locale'));
  const slug = String(formData.get('slug') || '');
  if (!isLocale(locale)) throw validationError(`"${locale}" is not a supported language`);
  try {
    await unpublishBlockTranslation({ blockId, locale, userId: Number(session.user.id) || null });
  } catch { throw validationError('Could not unpublish. Please try again.'); }
  await logAudit({ action: 'block.unpublish', type: 'block', id: blockId, label: `${locale} on /${slug}` });
  if (slug) revalidatePage(slug);
  revalidatePath(adminPath(pageId));
  setFlash(locale === 'en' ? 'Unpublished. The block is no longer on the public page.' : `Unpublished. ${locale} readers now see the English text.`);
}

/**
 * Put a previous version of a block's text back (W1.13).
 *
 * The restored text lands with the row's CURRENT status: restoring an older
 * paragraph on a live block keeps the block live, and restoring on a draft
 * keeps it a draft — nothing publishes or unpublishes as a side effect of
 * going back. The version being replaced is itself recorded first, so a
 * restore can be undone by restoring again.
 */
async function restoreRevisionAction$inner(formData) {
  const session = await assertCan('translate');
  const pageId = Number(formData.get('pageId'));
  const revisionId = Number(formData.get('revisionId'));
  const slug = String(formData.get('slug') || '');
  if (!Number.isInteger(revisionId) || revisionId <= 0) throw validationError('Pick a version to restore.');
  const rev = await getRevision(revisionId);
  if (!rev || !isLocale(rev.locale)) throw validationError('That version is no longer available.');
  const blocks = await getPageBlocks(pageId);
  const block = blocks.find((b) => b.id === rev.blockId);
  if (!block) throw validationError('That block is not on this page.');
  const current = block.translations.find((t) => t.locale === rev.locale);
  // A restore lands in the working copy (W7.2): nothing goes live by going
  // back. On a live block it is an unpublished change to review and publish.
  try {
    await saveBlockTranslation({ blockId: rev.blockId, locale: rev.locale, data: rev.data, status: 'draft', userId: Number(session.user.id) || null });
  } catch {
    throw validationError('Could not restore. Please try again.');
  }
  await logAudit({ action: 'block.restore_version', type: 'block', id: rev.blockId, label: `${rev.locale} on /${slug}` });
  if (slug) revalidatePage(slug);
  revalidatePath(adminPath(pageId));
  setFlash(current?.status === 'published'
    ? 'Restored into the draft. Check the preview, then Publish to make it live.'
    : 'Restored. Publish when it is ready.');
}

/**
 * Presentation settings — background, spacing, width, alignment — for one
 * block (W1.15). `edit_blocks`, like adding or moving one: how a block sits
 * on the page is layout, not translation, and it is shared by every
 * language, so it is saved once and not per locale.
 */
async function saveBlockSettingsAction$inner(formData) {
  await assertCan('edit_blocks');
  const pageId = Number(formData.get('pageId'));
  const blockId = Number(formData.get('blockId'));
  const slug = String(formData.get('slug') || '');
  if (!Number.isInteger(blockId) || blockId <= 0) throw validationError('Pick a block.');
  const parsed = parsePresentationForm(formData);
  if (!parsed.ok) throw validationError(parsed.errors.join('. '));
  try {
    await recordHistory('block', blockId);
    await setBlockSettings(blockId, pageId, parsed.settings);
  } catch {
    throw validationError('Could not save the presentation. Please try again.');
  }
  if (slug) revalidatePage(slug);
  revalidatePath(adminPath(pageId));
}

// ---------------------------------------------------------------------------
// Every exported action runs through runAction(): a thrown validation error
// becomes a redirect back to the form with the sentence in `?notice=`, which
// is the only way a message survives a production build. See
// lib/admin/run-action.js. The bodies above are unchanged.
// ---------------------------------------------------------------------------
export async function addBlockAction(formData) {
  return runAction(() => addBlockAction$inner(formData), { name: 'addBlockAction', form: formData });
}
export async function deleteBlockAction(formData) {
  return runAction(() => deleteBlockAction$inner(formData), { name: 'deleteBlockAction', form: formData });
}
export async function duplicateBlockAction(formData) {
  return runAction(() => duplicateBlockAction$inner(formData), { name: 'duplicateBlockAction', form: formData });
}
export async function reorderBlocksAction(formData) {
  return runAction(() => reorderBlocksAction$inner(formData), { name: 'reorderBlocksAction', form: formData });
}
export async function saveTranslationAction(formData) {
  return runAction(() => saveTranslationAction$inner(formData), { name: 'saveTranslationAction', form: formData });
}
export async function discardDraftAction(formData) {
  return runAction(() => discardDraftAction$inner(formData), { name: 'discardDraftAction', form: formData });
}
export async function unpublishTranslationAction(formData) {
  return runAction(() => unpublishTranslationAction$inner(formData), { name: 'unpublishTranslationAction', form: formData });
}
export async function restoreRevisionAction(formData) {
  return runAction(() => restoreRevisionAction$inner(formData), { name: 'restoreRevisionAction', form: formData });
}
export async function saveBlockSettingsAction(formData) {
  return runAction(() => saveBlockSettingsAction$inner(formData), { name: 'saveBlockSettingsAction', form: formData });
}
