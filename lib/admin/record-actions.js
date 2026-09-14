import { withHistory, trashEntity, assertUnchanged } from './history.js';
import { setFlash } from './context.js';

/**
 * The two calls every admin save and delete makes (W7.4, W7.5, W7.8).
 *
 * saveRecord: refuse when someone else saved the record after this form was
 * opened (the form's hidden `_stamp`), copy the record into history, run the
 * write, log it.
 *
 * deleteRecord: move the record and everything that goes with it to the trash
 * and offer Undo in the toast.
 */
export async function saveRecord(type, id, formData, mutate) {
  const hasId = id !== null && id !== undefined && id !== '' && id !== 0;
  if (hasId) await assertUnchanged(type, id, formData?.get?.('_stamp') ? String(formData.get('_stamp')) : '');
  const detail = formData && typeof formData.entries === 'function' ? Object.fromEntries(formData.entries()) : null;
  return withHistory(type, hasId ? id : null, mutate, { detail });
}

export async function deleteRecord(type, id, { remove = null, formData = null } = {}) {
  const detail = formData && typeof formData.entries === 'function' ? Object.fromEntries(formData.entries()) : null;
  const entry = await trashEntity(type, id, { remove, detail });
  const extra = entry.summary ? ` ${entry.summary}` : '';
  setFlash(`Deleted ${entry.label}${extra}. It is in the trash.`, { undo: entry.trashId });
  return entry;
}
