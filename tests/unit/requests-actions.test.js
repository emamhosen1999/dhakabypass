// K6: the acknowledgement email failed silently. Neither the citizen nor the
// staff could learn that it never arrived, on a form that exists to prove a
// grievance was received.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('../../lib/db.js', () => ({ query: vi.fn(), dbEnabled: vi.fn(() => true) }));
vi.mock('../../lib/mail.js', () => ({ sendMail: vi.fn() }));
vi.mock('../../lib/settings.js', () => ({ getSetting: vi.fn(async () => ({})) }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn(), revalidateTag: vi.fn() }));
vi.mock('next/headers', () => ({
  headers: vi.fn(async () => ({ get: (k) => (String(k).toLowerCase() === 'x-forwarded-for' ? '203.0.113.9' : null) })),
}));

import { query } from '../../lib/db.js';
import { sendMail } from '../../lib/mail.js';
import { submitServiceRequest } from '../../lib/requests/actions.js';
import { resetRateLimits } from '../../lib/rate-limit.js';

const config = { kind: 'grievance', locale: 'en', slaDays: 15 };

function form(overrides = {}) {
  const fd = new FormData();
  const values = {
    name: 'A Person', phone: '01700000000', email: 'a@example.com',
    subject: 'No receipt at the plaza', message: 'I was charged and given no receipt at ch. 21.',
    ...overrides,
  };
  for (const [k, v] of Object.entries(values)) fd.append(k, v);
  return fd;
}

const eventInserts = () => query.mock.calls.filter(([sql]) => String(sql).includes('service_request_events'));

let stderr;

beforeEach(() => {
  vi.clearAllMocks();
  resetRateLimits();
  query.mockResolvedValue({ insertId: 42 });
  sendMail.mockResolvedValue({ ok: true });
  stderr = vi.spyOn(process.stderr, 'write').mockImplementation(() => true);
});

afterEach(() => { stderr.mockRestore(); });

describe('submitServiceRequest — a filed request is still filed', () => {
  it('returns the tracking number when the acknowledgement is sent', async () => {
    const res = await submitServiceRequest(config, null, form());
    expect(res.status).toBe('ok');
    expect(res.trackingNo).toMatch(/^[A-Z]{2,4}-/);
    expect(sendMail).toHaveBeenCalledTimes(1);
  });

  it('still accepts the request when the mail server refuses it', async () => {
    sendMail.mockRejectedValue(new Error('SMTP 421'));
    const res = await submitServiceRequest(config, null, form());
    expect(res.status).toBe('ok');
  });
});

describe('submitServiceRequest — an unsent acknowledgement leaves a trace', () => {
  it('logs the failure rather than swallowing it', async () => {
    sendMail.mockRejectedValue(new Error('SMTP 421'));
    await submitServiceRequest(config, null, form());
    await vi.waitFor(() => {
      const lines = stderr.mock.calls.map(([l]) => String(l)).join('');
      expect(lines).toContain('requests.ack_mail_failed');
    });
  });

  it('records it on the request timeline, where staff will see it', async () => {
    sendMail.mockRejectedValue(new Error('SMTP 421'));
    await submitServiceRequest(config, null, form());
    await vi.waitFor(() => expect(eventInserts().length).toBe(1));
    const [, params] = eventInserts()[0];
    expect(params[0]).toBe(42);
    expect(String(params[2]).toLowerCase()).toContain('acknowledgement');
  });

  it('writes no timeline note when the acknowledgement goes out', async () => {
    await submitServiceRequest(config, null, form());
    await new Promise((r) => setTimeout(r, 10));
    expect(eventInserts()).toEqual([]);
  });

  it('never puts the sender address in the log', async () => {
    sendMail.mockRejectedValue(new Error('SMTP 421'));
    await submitServiceRequest(config, null, form());
    await vi.waitFor(() => {
      expect(stderr.mock.calls.map(([l]) => String(l)).join('')).toContain('requests.ack_mail_failed');
    });
    expect(stderr.mock.calls.map(([l]) => String(l)).join('')).not.toContain('a@example.com');
  });
});
