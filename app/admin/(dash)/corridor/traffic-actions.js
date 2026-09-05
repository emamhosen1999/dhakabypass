'use server';

import { revalidatePath } from 'next/cache';
import { assertCan } from '../../../../lib/auth/assert-can';
import { revalidateCorridor } from '../../../../lib/revalidate';
import { parseSection, parseMonthly, positiveId, saveSection, saveMonthly, deleteMonthly, saveSources } from '../../../../lib/corridor/traffic-admin';
import { refreshTraffic } from '../../../../lib/corridor/traffic-refresh';

async function save(capability, operation) {
  await assertCan(capability);
  try {
    await operation();
  } catch (err) {
    if (err?.code === 'VALIDATION') return { error: err.message };
    if (err?.code === 'ER_DUP_ENTRY') return { error: 'That month and plaza already have a row. Edit the existing row instead.' };
    return { error: 'The change could not be saved. Please try again.' };
  }
  revalidateCorridor();
  for (const path of ['/admin/corridor', '/admin/corridor/sections', '/admin/corridor/monthly']) revalidatePath(path);
  return { message: 'Saved. The public map will use the updated data.' };
}

export async function saveSectionAction(_state, form) {
  return save('edit_blocks', () => saveSection(parseSection(form)));
}

export async function saveMonthlyAction(_state, form) {
  return save('edit_blocks', () => saveMonthly(parseMonthly(form)));
}

export async function deleteMonthlyAction(_state, form) {
  return save('edit_blocks', () => deleteMonthly(positiveId(form.get('id'))));
}

export async function saveTrafficSourcesAction(_state, form) {
  return save('manage_users', () => saveSources(form));
}

export async function refreshTrafficAction() {
  return save('manage_users', refreshTraffic);
}
