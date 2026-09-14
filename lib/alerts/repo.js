import { query } from '../db.js';
import { asJson, isPlainObject } from '../json.js';
import { validationError } from '../errors.js';
import { CHANNELS, broadcastText } from './policy.js';
import { deliver, providerStatus } from './providers.js';
import { logError } from '../log.js';

export async function listSubscribers() {
  return (await query(
    'SELECT id, phone, channel, locale, status, created_at FROM alert_subscribers ORDER BY created_at DESC LIMIT 1000',
  )) || [];
}

export async function subscriberCounts() {
  const rows = (await query(
    "SELECT channel, locale, COUNT(*) AS c FROM alert_subscribers WHERE status = 'active' GROUP BY channel, locale",
  )) || [];
  return rows.map((r) => ({ channel: r.channel, locale: r.locale, count: Number(r.c) }));
}

export async function deleteSubscriber(id) {
  await query('DELETE FROM alert_subscribers WHERE id = ?', [Number(id)]);
}

export async function listBroadcasts() {
  const rows = (await query(
    'SELECT id, messages, channel, status, recipients, sent, error, created_at, sent_at FROM alert_broadcasts ORDER BY id DESC LIMIT 50',
  )) || [];
  return rows.map((r) => ({ ...r, messages: (() => { const m = asJson(r.messages, {}); return isPlainObject(m) ? m : {}; })() }));
}

/**
 * Record a broadcast and send it to every active subscriber on its channel(s),
 * each in their own language (English where a translation was not written).
 * Sends one at a time; a failed delivery is counted, not retried, so one bad
 * number cannot hold up the rest.
 */
export async function sendBroadcast({ messages, channel }, { env = process.env, fetchImpl = fetch } = {}) {
  if (!broadcastText(messages, 'en')) throw validationError('Write the English message; other languages fall back to it.');
  const channels = channel === 'both' ? CHANNELS : CHANNELS.includes(channel) ? [channel] : null;
  if (!channels) throw validationError('Choose SMS, WhatsApp or both.');
  const status = providerStatus(env);
  const recipients = (await query(
    `SELECT phone, channel, locale FROM alert_subscribers WHERE status = 'active' AND channel IN (${channels.map(() => '?').join(',')})`,
    channels,
  )) || [];
  const res = await query(
    "INSERT INTO alert_broadcasts (messages, channel, status, recipients) VALUES (?, ?, 'queued', ?)",
    [JSON.stringify(messages), channel, recipients.length],
  );
  const id = res.insertId;
  const deliverable = recipients.filter((r) => status[r.channel]);
  if (!deliverable.length) {
    const reason = recipients.length ? 'No SMS or WhatsApp provider is configured on the server.' : 'There are no subscribers on this channel.';
    await query("UPDATE alert_broadcasts SET status = ?, error = ?, sent_at = CURRENT_TIMESTAMP WHERE id = ?",
      [recipients.length ? 'no_provider' : 'sent', reason, id]);
    return { id, recipients: recipients.length, sent: 0, status: recipients.length ? 'no_provider' : 'sent' };
  }
  let sent = 0;
  for (const r of deliverable) {
    try {
      if (await deliver(r.channel, r.phone, broadcastText(messages, r.locale), r.locale, { env, fetchImpl })) sent += 1;
    } catch (err) {
      logError('alerts.delivery_failed', err, { channel: r.channel });
    }
  }
  const final = sent === deliverable.length ? 'sent' : sent === 0 ? 'failed' : 'sent';
  const error = deliverable.length < recipients.length ? 'Some subscribers are on a channel with no provider configured.' : (sent < deliverable.length ? `${deliverable.length - sent} deliveries failed.` : '');
  await query('UPDATE alert_broadcasts SET status = ?, sent = ?, error = ?, sent_at = CURRENT_TIMESTAMP WHERE id = ?', [final, sent, error, id]);
  return { id, recipients: recipients.length, sent, status: final };
}
