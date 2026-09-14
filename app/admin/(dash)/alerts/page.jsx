import { assertCan } from '../../../../lib/auth/assert-can';
import { listSubscribers, subscriberCounts, listBroadcasts } from '../../../../lib/alerts/repo';
import { providerStatus } from '../../../../lib/alerts/providers';
import { maskPhone } from '../../../../lib/alerts/policy';
import { sendBroadcastAction, deleteSubscriberAction } from './actions';
import SmsComposer from '../../../../components/admin/SmsComposer';

export const dynamic = 'force-dynamic';

const STATUS = { queued: 'Queued', sent: 'Sent', failed: 'Failed', no_provider: 'Not sent — no provider' };

/**
 * Road alerts by SMS and WhatsApp (W4.13): who is subscribed, and a broadcast
 * composer. Sending needs a provider configured on the server; without one a
 * broadcast is recorded and the screen says it was not sent.
 */
export default async function AlertsAdmin() {
  await assertCan('manage_users');
  const [subscribers, counts, broadcasts] = await Promise.all([listSubscribers(), subscriberCounts(), listBroadcasts()]);
  const providers = providerStatus();
  const total = (channel) => counts.filter((c) => c.channel === channel).reduce((n, c) => n + c.count, 0);
  return (
    <div className="p-6 space-y-8 max-w-5xl">
      <header className="space-y-2">
        <h1 className="text-2xl font-bold">Road alerts</h1>
        <p className="text-sm text-gray-600">Closures and major notices sent to subscribers by SMS or WhatsApp, each in the language they chose.</p>
        <ul className="flex flex-wrap gap-3 text-sm">
          <li className="border rounded px-3 py-1">SMS subscribers: <strong>{total('sms')}</strong> · provider {providers.sms ? 'configured' : <span className="text-red-700">not configured</span>}</li>
          <li className="border rounded px-3 py-1">WhatsApp subscribers: <strong>{total('whatsapp')}</strong> · provider {providers.whatsapp ? 'configured' : <span className="text-red-700">not configured</span>}</li>
        </ul>
      </header>

      <section className="border rounded p-4 space-y-3 bg-white">
        <h2 className="font-semibold">Send an alert</h2>
        <form action={sendBroadcastAction} className="space-y-3">
          {[['en', 'English'], ['bn', 'বাংলা (Bangla)'], ['zh', '中文 (Chinese)']].map(([l, label]) => (
            <SmsComposer key={l} name={`message.${l}`} label={label} required={l === 'en'}
              placeholder={l === 'en' ? 'Dhaka Bypass: northbound lane closed at Kanchan Bridge 22:00–05:00 tonight for maintenance. Use the service road.' : ''} />
          ))}
          <label className="flex flex-col text-sm max-w-xs">Send by
            <select name="channel" defaultValue="both" className="border rounded px-2 py-1">
              <option value="both">SMS and WhatsApp</option><option value="sms">SMS only</option><option value="whatsapp">WhatsApp only</option>
            </select>
          </label>
          <p className="text-xs text-gray-600">An SMS in Bangla or Chinese is billed per 70 characters, in English per 160.</p>
          <button
            type="submit"
            className="px-4 py-2 rounded bg-blue-900 text-white font-semibold"
            data-pending="Sending…"
            data-confirm={`Send this alert now?\n\nSMS: ${total('sms')} subscribers${providers.sms ? '' : ' (no provider: will not be sent)'}\nWhatsApp: ${total('whatsapp')} subscribers${providers.whatsapp ? '' : ' (no provider: will not be sent)'}\n\nA sent alert cannot be recalled.`}
          >
            Send alert
          </button>
        </form>
      </section>

      <section className="space-y-2">
        <h2 className="font-semibold">Recent alerts</h2>
        {broadcasts.length === 0 ? <p className="text-sm text-gray-500">None yet.</p> : (
          <table className="w-full text-sm"><thead><tr className="text-left border-b"><th className="py-1">When</th><th>Message</th><th>Channel</th><th>Status</th><th>Sent</th><th>By</th></tr></thead>
            <tbody>{broadcasts.map((b) => (
              <tr key={b.id} className="border-b align-top"><td className="py-1 whitespace-nowrap">{new Date(b.created_at).toLocaleString('en-GB', { timeZone: 'Asia/Dhaka' })}</td>
                <td>{b.messages.en}</td><td>{b.channel}</td><td>{STATUS[b.status] || b.status}{b.error ? <div className="text-xs text-gray-600">{b.error}</div> : null}</td><td>{b.sent}/{b.recipients}</td><td className="text-xs">{b.sent_by || ''}</td></tr>
            ))}</tbody></table>
        )}
      </section>

      <section className="space-y-2">
        <h2 className="font-semibold">Subscribers</h2>
        {subscribers.length === 0 ? <p className="text-sm text-gray-500">No one has subscribed yet.</p> : (
          <table className="w-full text-sm"><thead><tr className="text-left border-b"><th className="py-1">Number</th><th>Channel</th><th>Language</th><th>Status</th><th>Since</th><th></th></tr></thead>
            <tbody>{subscribers.map((s) => (
              <tr key={s.id} className="border-b"><td className="py-1 font-mono">{maskPhone(s.phone)}</td><td>{s.channel}</td><td>{s.locale}</td><td>{s.status}</td>
                <td>{new Date(s.created_at).toLocaleDateString('en-GB')}</td>
                <td><form action={deleteSubscriberAction}><input type="hidden" name="id" value={s.id} /><button type="submit" className="text-red-700 underline" data-confirm={`Remove ${maskPhone(s.phone)} from ${s.channel} alerts?\n\nThis is permanent; they can sign up again. The removal is recorded.`}>Remove</button></form></td></tr>
            ))}</tbody></table>
        )}
      </section>
    </div>
  );
}
