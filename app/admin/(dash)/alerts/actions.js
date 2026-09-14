'use server';

import { revalidatePath } from 'next/cache';
import { assertCan } from '../../../../lib/auth/assert-can';
import { runAction } from '../../../../lib/admin/run-action';
import { validationError } from '../../../../lib/errors';
import { sendBroadcast, deleteSubscriber } from '../../../../lib/alerts/repo';

const ADMIN = '/admin/alerts';

async function sendBroadcastAction$inner(formData) {
  await assertCan('manage_users');
  const messages = {};
  for (const l of ['en', 'bn', 'zh']) {
    const v = String(formData.get(`message.${l}`) || '').trim();
    if (v.length > 480) throw validationError('Keep each message to 480 characters or fewer.');
    if (v) messages[l] = v;
  }
  const result = await sendBroadcast({ messages, channel: String(formData.get('channel') || 'both') });
  revalidatePath(ADMIN);
  if (result.status === 'no_provider') {
    throw validationError(`Recorded for ${result.recipients} subscribers, but not sent: no SMS or WhatsApp provider is configured on the server.`);
  }
}

async function deleteSubscriberAction$inner(formData) {
  await assertCan('manage_users');
  await deleteSubscriber(Number(formData.get('id')));
  revalidatePath(ADMIN);
}

export async function sendBroadcastAction(formData) { return runAction(() => sendBroadcastAction$inner(formData)); }
export async function deleteSubscriberAction(formData) { return runAction(() => deleteSubscriberAction$inner(formData)); }
