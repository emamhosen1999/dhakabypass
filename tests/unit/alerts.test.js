import { describe, it, expect, vi, beforeEach } from 'vitest';
import { normaliseBdMobile, maskPhone, smsSegments, broadcastText } from '../../lib/alerts/policy.js';
import { providerStatus, smsRequest, whatsappRequest } from '../../lib/alerts/providers.js';

const query = vi.fn();
vi.mock('../../lib/db.js', () => ({ query: (...a) => query(...a), dbEnabled: () => true }));
vi.mock('../../lib/log.js', () => ({ logError: vi.fn(), log: vi.fn() }));

beforeEach(() => query.mockReset());

describe('alert rules', () => {
  it('accepts every common way of writing a Bangladesh mobile number, in one canonical form', () => {
    for (const v of ['01711000000', '+8801711000000', '8801711000000', '0088 01711-000000', '+880 1711 000000']) {
      expect(normaliseBdMobile(v), v).toBe('+8801711000000');
    }
    expect(normaliseBdMobile('01211000000')).toBe('');
    expect(normaliseBdMobile('12345')).toBe('');
  });

  it('masks numbers, counts SMS segments and falls back to English', () => {
    expect(maskPhone('+8801711000123')).toBe('+880171•••123');
    expect(smsSegments('a'.repeat(160))).toBe(1);
    expect(smsSegments('a'.repeat(161))).toBe(2);
    expect(smsSegments('সড়ক'.repeat(20))).toBe(2);
    expect(broadcastText({ en: 'Closed' }, 'bn')).toBe('Closed');
  });
});

describe('providers', () => {
  it('are switched on only by their full configuration', () => {
    expect(providerStatus({})).toEqual({ sms: false, whatsapp: false });
    expect(providerStatus({ ALERTS_SMS_URL: 'u', ALERTS_SMS_TOKEN: 't' }).sms).toBe(true);
    expect(providerStatus({ ALERTS_WHATSAPP_TOKEN: 't', ALERTS_WHATSAPP_PHONE_ID: '1' }).whatsapp).toBe(false);
  });

  it('build the gateway and WhatsApp template requests', () => {
    const env = { ALERTS_SMS_URL: 'https://gw/send', ALERTS_SMS_TOKEN: 'k', ALERTS_SMS_SENDER: 'DBEDC', ALERTS_WHATSAPP_TOKEN: 'w', ALERTS_WHATSAPP_PHONE_ID: '99', ALERTS_WHATSAPP_TEMPLATE: 'road_alert' };
    expect(JSON.parse(smsRequest('+8801711000000', 'Hi', env).init.body)).toEqual({ to: '+8801711000000', from: 'DBEDC', message: 'Hi' });
    const wa = whatsappRequest('+8801711000000', 'বন্ধ', 'bn', env);
    expect(wa.url).toContain('/99/messages');
    const body = JSON.parse(wa.init.body);
    expect(body.to).toBe('8801711000000');
    expect(body.template).toMatchObject({ name: 'road_alert', language: { code: 'bn' } });
  });
});

describe('sendBroadcast', () => {
  it('records a broadcast as not sent when no provider is configured', async () => {
    const { sendBroadcast } = await import('../../lib/alerts/repo.js');
    query.mockImplementation(async (sql) => {
      if (/FROM alert_subscribers/.test(sql)) return [{ phone: '+8801711000000', channel: 'sms', locale: 'bn' }];
      if (/INSERT INTO alert_broadcasts/.test(sql)) return { insertId: 5 };
      return {};
    });
    const out = await sendBroadcast({ messages: { en: 'Closed tonight' }, channel: 'both' }, { env: {} });
    expect(out).toMatchObject({ id: 5, recipients: 1, sent: 0, status: 'no_provider' });
  });

  it('sends each subscriber their own language through a configured provider', async () => {
    const { sendBroadcast } = await import('../../lib/alerts/repo.js');
    query.mockImplementation(async (sql) => {
      if (/FROM alert_subscribers/.test(sql)) return [{ phone: '+8801711000000', channel: 'sms', locale: 'bn' }, { phone: '+8801811000000', channel: 'sms', locale: 'en' }];
      if (/INSERT INTO alert_broadcasts/.test(sql)) return { insertId: 6 };
      return {};
    });
    const fetchImpl = vi.fn(async () => ({ ok: true }));
    const out = await sendBroadcast({ messages: { en: 'Closed', bn: 'বন্ধ' }, channel: 'sms' },
      { env: { ALERTS_SMS_URL: 'https://gw', ALERTS_SMS_TOKEN: 'k' }, fetchImpl });
    expect(out).toMatchObject({ sent: 2, status: 'sent' });
    expect(fetchImpl.mock.calls.map(([, init]) => JSON.parse(init.body).message)).toEqual(['বন্ধ', 'Closed']);
  });
});
