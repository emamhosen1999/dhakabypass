'use server';

import { revalidatePath } from 'next/cache';
import { assertCan } from '../../../../lib/auth/assert-can';
import { revalidateCorridor } from '../../../../lib/revalidate';
import { parseSection, parseMonthly, positiveId, saveSection, saveMonthly, saveSources } from '../../../../lib/corridor/traffic-admin';
import { refreshTraffic } from '../../../../lib/corridor/traffic-refresh';
import { runInActionContext, actionContext } from '../../../../lib/admin/context';
import { saveRecord, deleteRecord } from '../../../../lib/admin/record-actions';
import { logAudit } from '../../../../lib/admin/history';

async function save(capability, operation) {
  return runInActionContext(async () => {
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
    const flash = actionContext()?.flash;
    return { message: flash?.t || 'Saved. The public map will use the updated data.', undo: flash?.u || null, at: Date.now() };
  });
}

export async function saveSectionAction(_state, form) {
  return save('edit_blocks', async () => {
    const input = parseSection(form);
    await saveSection(input);
    await logAudit({ action: 'section.update', id: input?.id ?? '', label: `section ${input?.id}: ${input?.condition}` });
  });
}

export async function saveMonthlyAction(_state, form) {
  return save('edit_blocks', () => {
    const input = parseMonthly(form);
    return saveRecord('monthly', input?.id || null, form, () => saveMonthly(input));
  });
}

export async function deleteMonthlyAction(_state, form) {
  return save('edit_blocks', () => deleteRecord('monthly', positiveId(form.get('id')), { formData: form }));
}

export async function saveTrafficSourcesAction(_state, form) {
  return save('manage_users', async () => {
    await saveSources(form);
    await logAudit({ action: 'traffic.sources', label: `traffic ${form.get('traffic_source')}, monthly ${form.get('monthly_source')}` });
  });
}

export async function refreshTrafficAction() {
  return save('manage_users', async () => {
    await refreshTraffic();
    await logAudit({ action: 'traffic.refresh', label: 'live traffic refreshed' });
  });
}
