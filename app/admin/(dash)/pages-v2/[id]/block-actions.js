'use server';

import { revalidatePath } from 'next/cache';
import { assertCan } from '../../../../../lib/auth/assert-can';
import { getBlock, validateBlockData, defaultBlockData } from '../../../../../lib/blocks/registry';
import { parseBlockForm } from '../../../../../lib/blocks/form';
import '../../../../../lib/blocks/index';
import {
  getPageBlocks, addBlock, deleteBlock, reorderBlocks, duplicateBlock, saveBlockTranslation,
} from '../../../../../lib/content/pages';
import { revalidatePage } from '../../../../../lib/revalidate';
import { isLocale } from '../../../../../lib/i18n/locales';

const adminPath = (pageId) => `/admin/pages-v2/${pageId}`;

const VALID_STATUSES = ['draft', 'published'];

export async function addBlockAction(formData) {
  await assertCan('edit_blocks');
  const pageId = Number(formData.get('pageId'));
  const slug = String(formData.get('slug') || '');
  const type = String(formData.get('type') || '');
  if (!getBlock(type)) throw new Error(`"${type}" is not a block type`);

  try {
    await addBlock({ pageId, type, data: defaultBlockData(type) });
  } catch {
    // Never leak driver text (a connection drop, an FK violation from a
    // forged pageId) to the browser.
    throw new Error('Could not add the block. Please try again.');
  }
  if (slug) revalidatePage(slug);
  revalidatePath(adminPath(pageId));
}

export async function deleteBlockAction(formData) {
  await assertCan('edit_blocks');
  const pageId = Number(formData.get('pageId'));
  const slug = String(formData.get('slug') || '');

  try {
    await deleteBlock(Number(formData.get('blockId')));
  } catch {
    throw new Error('Could not delete the block. Please try again.');
  }
  if (slug) revalidatePage(slug);
  revalidatePath(adminPath(pageId));
}

export async function duplicateBlockAction(formData) {
  await assertCan('edit_blocks');
  const pageId = Number(formData.get('pageId'));
  const slug = String(formData.get('slug') || '');

  try {
    await duplicateBlock(Number(formData.get('blockId')));
  } catch {
    throw new Error('Could not duplicate the block. Please try again.');
  }
  if (slug) revalidatePage(slug);
  revalidatePath(adminPath(pageId));
}

export async function moveBlockAction(formData) {
  await assertCan('edit_blocks');
  const pageId = Number(formData.get('pageId'));
  const blockId = Number(formData.get('blockId'));
  const direction = String(formData.get('direction'));
  const slug = String(formData.get('slug') || '');

  const blocks = await getPageBlocks(pageId);
  const ids = blocks.map((b) => b.id);
  const i = ids.indexOf(blockId);
  const j = direction === 'up' ? i - 1 : i + 1;
  if (i === -1 || j < 0 || j >= ids.length) return;

  [ids[i], ids[j]] = [ids[j], ids[i]];
  try {
    await reorderBlocks(pageId, ids);
  } catch {
    throw new Error('Could not reorder the blocks. Please try again.');
  }
  if (slug) revalidatePage(slug);
  revalidatePath(adminPath(pageId));
}

export async function saveTranslationAction(formData) {
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
  if (!getBlock(type)) throw new Error(`"${type}" is not a block type`);

  // A stale form (or a forged hidden field) could submit a locale outside
  // the supported set. On MySQL strict mode this errors at the INSERT; on a
  // non-strict sql_mode (a plausible default on shared MariaDB hosting) it
  // silently inserts as '', leaving a garbage block_translations row that no
  // reader ever surfaces. Reject it here instead.
  if (!isLocale(locale)) throw new Error(`"${locale}" is not a supported language`);

  // 'missing' is a valid database value but means "no row exists" — it must
  // never be settable from this form, only 'draft' or 'published'.
  if (!VALID_STATUSES.includes(status)) {
    throw new Error('Status must be "draft" or "published"');
  }

  const data = parseBlockForm(type, formData);
  const check = validateBlockData(type, data);
  // A draft may be incomplete; publishing may not.
  if (status === 'published' && !check.ok) throw new Error(check.errors.join('. '));

  try {
    await saveBlockTranslation({ blockId, locale, data, status, userId: Number(session.user.id) || null });
  } catch {
    throw new Error('Could not save. Please try again.');
  }
  if (slug) revalidatePage(slug);
  revalidatePath(adminPath(pageId));
}
