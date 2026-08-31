'use server';

import { revalidatePath } from 'next/cache';
import { assertCan } from '../actions';
import { getBlock, validateBlockData, defaultBlockData } from '../../../../../lib/blocks/registry';
import { parseBlockForm } from '../../../../../lib/blocks/form';
import '../../../../../lib/blocks/index';
import {
  getPageBlocks, addBlock, deleteBlock, reorderBlocks, duplicateBlock, saveBlockTranslation,
} from '../../../../../lib/content/pages';
import { revalidatePage } from '../../../../../lib/revalidate';

const adminPath = (pageId) => `/admin/pages-v2/${pageId}`;

export async function addBlockAction(formData) {
  await assertCan('edit_blocks');
  const pageId = Number(formData.get('pageId'));
  const slug = String(formData.get('slug') || '');
  const type = String(formData.get('type') || '');
  if (!getBlock(type)) throw new Error(`"${type}" is not a block type`);

  await addBlock({ pageId, type, data: defaultBlockData(type) });
  revalidatePage(slug);
  revalidatePath(adminPath(pageId));
}

export async function deleteBlockAction(formData) {
  await assertCan('edit_blocks');
  const pageId = Number(formData.get('pageId'));
  await deleteBlock(Number(formData.get('blockId')));
  revalidatePage(String(formData.get('slug') || ''));
  revalidatePath(adminPath(pageId));
}

export async function duplicateBlockAction(formData) {
  await assertCan('edit_blocks');
  const pageId = Number(formData.get('pageId'));
  await duplicateBlock(Number(formData.get('blockId')));
  revalidatePage(String(formData.get('slug') || ''));
  revalidatePath(adminPath(pageId));
}

export async function moveBlockAction(formData) {
  await assertCan('edit_blocks');
  const pageId = Number(formData.get('pageId'));
  const blockId = Number(formData.get('blockId'));
  const direction = String(formData.get('direction'));

  const blocks = await getPageBlocks(pageId);
  const ids = blocks.map((b) => b.id);
  const i = ids.indexOf(blockId);
  const j = direction === 'up' ? i - 1 : i + 1;
  if (i === -1 || j < 0 || j >= ids.length) return;

  [ids[i], ids[j]] = [ids[j], ids[i]];
  await reorderBlocks(pageId, ids);
  revalidatePage(String(formData.get('slug') || ''));
  revalidatePath(adminPath(pageId));
}

export async function saveTranslationAction(formData) {
  const session = await assertCan('translate');
  const pageId = Number(formData.get('pageId'));
  const blockId = Number(formData.get('blockId'));
  const locale = String(formData.get('locale'));
  const type = String(formData.get('type'));
  const status = String(formData.get('status') || 'draft');

  const data = parseBlockForm(type, formData);
  const check = validateBlockData(type, data);
  // A draft may be incomplete; publishing may not.
  if (status === 'published' && !check.ok) throw new Error(check.errors.join('. '));

  await saveBlockTranslation({ blockId, locale, data, status, userId: Number(session.user.id) || null });
  revalidatePage(String(formData.get('slug') || ''));
  revalidatePath(adminPath(pageId));
}
