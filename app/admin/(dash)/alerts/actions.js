'use server';

import { revalidatePath } from 'next/cache';
import { assertCan } from '../../../../lib/auth/assert-can';
import { runAction } from '../../../../lib/admin/run-action';
import { validationError } from '../../../../lib/errors';
import { sendBroadcast, deleteSubscriber } from '../../../../lib/alerts/repo';
import { currentActor, setFlash } from '../../../../lib/admin/context';
import { logAudit } from '../../../../lib/admin/history';
import { query } from '../../../../lib/db';
import { maskPhone } from '../../../../lib/alerts/policy';

const ADMIN = '/admin/alerts';

async function sendBroadcastAction$inner(formData) {
  await assertCan('manage_users');
  const messages = {};
  for (const l of ['en', 'bn', 'zh']) {
    const v = String(formData.get(`message.${l}`) || '').trim();
    if (v.length > 480) throw validationError('Keep each message to 480 characters or fewer.');
    if (v) messages[l] = v;
  }
  if (!messages.en) throw validationError('Write the English message: subscribers without a translation receive it.');
  const result = await sendBroadcast({ messages, channel: String(formData.get('channel') || 'both'), sentBy: currentActor() });
  await logAudit({ action: 'alert.send', label: `"${messages.en.slice(0, 80)}" to ${result.recipients} subscribers (${result.status})` });
  revalidatePath(ADMIN);
  if (result.status === 'no_provider') {
    throw validationError(`Recorded for ${result.recipients} subscribers, but not sent: no SMS or WhatsApp provider is configured on the server.`);
  }
  setFlash(`Alert sent to ${result.sent ?? result.recipients} of ${result.recipients} subscribers.`);
}

async function deleteSubscriberAction$inner(formData) {
  await assertCan('manage_users');
  const id = Number(formData.get('id'));
  const rows = await query('SELECT phone FROM alert_subscribers WHERE id = ? LIMIT 1', [id]);
  await deleteSubscriber(id);
  // Personal data: removed outright, the removal recorded.
  await logAudit({ action: 'alert_subscriber.delete', id, label: rows?.[0] ? maskPhone(rows[0].phone) : `subscriber ${id}` });
  setFlash('Subscriber removed.');
  revalidatePath(ADMIN);
}

export async function sendBroadcastAction(formData) { return runAction(() => sendBroadcastAction$inner(formData), { name: 'sendBroadcastAction', form: formData }); }
export async function deleteSubscriberAction(formData) { return runAction(() => deleteSubscriberAction$inner(formData), { name: 'deleteSubscriberAction', form: formData }); }
