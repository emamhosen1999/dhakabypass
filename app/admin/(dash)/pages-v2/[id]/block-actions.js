'use server';

import { validationError } from '../../../../../lib/errors';
import { runAction } from '../../../../../lib/admin/run-action';

import { revalidatePath } from 'next/cache';
import { assertCan } from '../../../../../lib/auth/assert-can';
import { getBlock, validateBlockData, defaultBlockData } from '../../../../../lib/blocks/registry';
import { parseBlockForm } from '../../../../../lib/blocks/form';
import '../../../../../lib/blocks/index';
import {
  addBlock, deleteBlock, reorderBlocks, duplicateBlock, saveBlockTranslation,
} from '../../../../../lib/content/pages';
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

  try {
    await addBlock({ pageId, type, data: defaultBlockData(type) });
  } catch {
    // Never leak driver text (a connection drop, an FK violation from a
    // forged pageId) to the browser.
    throw validationError('Could not add the block. Please try again.');
  }
  if (slug) revalidatePage(slug);
  revalidatePath(adminPath(pageId));
}

async function deleteBlockAction$inner(formData) {
  await assertCan('edit_blocks');
  const pageId = Number(formData.get('pageId'));
  const slug = String(formData.get('slug') || '');

  try {
    await deleteBlock(Number(formData.get('blockId')));
  } catch {
    throw validationError('Could not delete the block. Please try again.');
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
  if (slug) revalidatePage(slug);
  revalidatePath(adminPath(pageId));
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
  if (status === 'published' && !check.ok) throw validationError(check.errors.join('. '));

  try {
    await saveBlockTranslation({ blockId, locale, data, status, userId: Number(session.user.id) || null });
  } catch {
    throw validationError('Could not save. Please try again.');
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
  return runAction(() => addBlockAction$inner(formData));
}
export async function deleteBlockAction(formData) {
  return runAction(() => deleteBlockAction$inner(formData));
}
export async function duplicateBlockAction(formData) {
  return runAction(() => duplicateBlockAction$inner(formData));
}
export async function reorderBlocksAction(formData) {
  return runAction(() => reorderBlocksAction$inner(formData));
}
export async function saveTranslationAction(formData) {
  return runAction(() => saveTranslationAction$inner(formData));
}
