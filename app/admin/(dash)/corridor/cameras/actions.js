'use server';

import { revalidatePath } from 'next/cache';
import { assertCan } from '../../../../../lib/auth/assert-can';
import { runAction } from '../../../../../lib/admin/run-action';
import { validationError, friendly } from '../../../../../lib/errors';
import { parseCameraForm, saveCamera, deleteCamera, getCamera, recordCameraHealth } from '../../../../../lib/cameras/repo';
import { fetchUpstream, SNAPSHOT_MAX_BYTES } from '../../../../../lib/cameras/upstream';

const ADMIN = '/admin/corridor/cameras';
const ACTION = 'edit_blocks';

async function saveCameraAction$inner(formData) {
  await assertCan(ACTION);
  const camera = parseCameraForm(formData);
  try { await saveCamera(camera); } catch (err) { friendly(err, 'Could not save the camera. Please try again.'); }
  revalidatePath(ADMIN);
}

async function deleteCameraAction$inner(formData) {
  await assertCan(ACTION);
  try { await deleteCamera(Number(formData.get('id'))); } catch { throw validationError('Could not delete the camera. Please try again.'); }
  revalidatePath(ADMIN);
}

/**
 * Fetch the camera's snapshot (or playlist) now and record the result, so the
 * operator sees straight away whether the address and password work.
 */
async function testCameraAction$inner(formData) {
  await assertCan(ACTION);
  const camera = await getCamera(Number(formData.get('id')), { withSecrets: true });
  if (!camera) throw validationError('That camera no longer exists. Reload the page.');
  const url = camera.snapshot_url && !camera.snapshot_url.startsWith('/') ? camera.snapshot_url : camera.stream_url;
  if (!url || url.startsWith('/')) throw validationError('This camera has no network address to test: it shows a stored picture.');
  try {
    const { body, type } = await fetchUpstream(url, camera, { maxBytes: SNAPSHOT_MAX_BYTES });
    if (url === camera.snapshot_url && !/^image\//i.test(type)) throw new Error(`the address answered, but not with an image (${type || 'no content type'})`);
    if (url === camera.stream_url && !/#EXTM3U/.test(body.toString('utf8', 0, 64))) throw new Error('the address answered, but not with an HLS playlist');
    await recordCameraHealth(camera.id, true);
  } catch (err) {
    await recordCameraHealth(camera.id, false, err?.message);
    revalidatePath(ADMIN);
    throw validationError(`The camera did not answer correctly: ${String(err?.message || 'no response').slice(0, 160)}.`);
  }
  revalidatePath(ADMIN);
}

export async function saveCameraAction(formData) { return runAction(() => saveCameraAction$inner(formData)); }
export async function deleteCameraAction(formData) { return runAction(() => deleteCameraAction$inner(formData)); }
export async function testCameraAction(formData) { return runAction(() => testCameraAction$inner(formData)); }
