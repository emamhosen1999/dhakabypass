'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { runAction } from '../../../lib/admin/run-action';
import { assertCan } from '../../../lib/auth/assert-can';
import { validationError, friendly } from '../../../lib/errors';
import { ENTITIES } from '../../../lib/admin/entities';
import { restoreTrash, restoreHistory, purgeTrash, getTrashEntry, logAudit } from '../../../lib/admin/history';
import { afterRestore, revalidateRestored } from '../../../lib/admin/restore-hooks';
import { setFlash } from '../../../lib/admin/context';
import { query } from '../../../lib/db';

/**
 * Restore from the trash, restore a version from history, and delete for good
 * (W7.4, W7.5). One set of actions for every record type: the entity registry
 * says what each needs, and the capability to restore a record is the one
 * needed to edit it.
 */

async function capabilityFor(type) {
  if (!Object.hasOwn(ENTITIES, type)) throw validationError('That kind of record cannot be restored here.');
  await assertCan(ENTITIES[type].can);
}

async function undoTrashAction$inner(formData) {
  const id = Number(formData.get('id'));
  const entry = await getTrashEntry(id);
  if (!entry) throw validationError('That item is no longer in the trash.');
  await capabilityFor(entry.entity_type);
  let restored;
  try {
    restored = await restoreTrash(id, { after: afterRestore });
  } catch (err) { friendly(err, 'The item could not be restored. Please try again.'); }
  await revalidateRestored(restored.type, entry.payload);
  revalidatePath('/admin/trash');
  setFlash(`Restored ${restored.label}.`);
  const back = String(formData.get('back') || '');
  if (back.startsWith('/admin/')) redirect(back);
}

async function restoreHistoryAction$inner(formData) {
  const id = Number(formData.get('id'));
  const rows = await query('SELECT entity_type FROM record_history WHERE id = ? LIMIT 1', [id]);
  if (!rows?.length) throw validationError('That version is no longer kept.');
  await capabilityFor(rows[0].entity_type);
  let restored;
  try {
    restored = await restoreHistory(id, { after: afterRestore });
  } catch (err) { friendly(err, 'That version could not be put back. Please try again.'); }
  const snapRows = await query('SELECT snapshot FROM record_history WHERE id = ? LIMIT 1', [id]);
  let snap = null;
  try { snap = typeof snapRows?.[0]?.snapshot === 'string' ? JSON.parse(snapRows[0].snapshot) : snapRows?.[0]?.snapshot; } catch { snap = null; }
  await revalidateRestored(restored.type, snap);
  setFlash(`Put back ${restored.label} as it was.`);
}

/** Delete for good. Administrators only; uploaded files go with the record. */
async function purgeTrashAction$inner(formData) {
  await assertCan('manage_users');
  const id = Number(formData.get('id'));
  const all = formData.get('all') === 'expired';
  const removed = all ? await purgeTrash({}) : await purgeTrash({ id });
  await removeUploadedFiles(removed);
  for (const r of removed) await logAudit({ action: `${r.entity_type}.purge`, type: r.entity_type, id: r.entity_id, label: r.label });
  revalidatePath('/admin/trash');
  setFlash(removed.length === 1 ? `Deleted ${removed[0].label} for good.` : `Deleted ${removed.length} items for good.`);
}

async function removeUploadedFiles(entries) {
  const paths = entries.flatMap((e) => (e.entity_type === 'media' ? (e.payload?.rows?.media || []).map((m) => m.path) : []));
  if (!paths.length) return;
  const { unlink } = await import('node:fs/promises');
  const { join, basename } = await import('node:path');
  const { uploadRoot } = await import('../../../lib/media');
  for (const path of paths) {
    if (!String(path).startsWith('/uploads/')) continue;
    const still = await query('SELECT id FROM media WHERE path = ? LIMIT 1', [path]);
    if (still?.length) continue;
    await unlink(join(uploadRoot(), basename(path))).catch(() => {});
  }
}

export async function undoTrashAction(formData) {
  return runAction(() => undoTrashAction$inner(formData), { name: 'undoTrashAction', form: formData });
}
export async function restoreHistoryAction(formData) {
  return runAction(() => restoreHistoryAction$inner(formData), { name: 'restoreHistoryAction', form: formData });
}
export async function purgeTrashAction(formData) {
  return runAction(() => purgeTrashAction$inner(formData), { name: 'purgeTrashAction', form: formData });
}
