// tests/unit/contact-actions.test.js
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('../../lib/db.js', () => ({ query: vi.fn(), dbEnabled: vi.fn(() => true) }));
// app/admin/actions.js reaches auth.js through lib/auth/assert-can, and
// next-auth cannot be resolved outside a Next build. The two actions under
// test here are the intentionally-public ones and never touch it.
vi.mock('../../auth.js', () => ({ auth: vi.fn() }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn(), revalidateTag: vi.fn() }));

const headerStore = { 'x-forwarded-for': '203.0.113.9' };
vi.mock('next/headers', () => ({
  headers: vi.fn(async () => ({ get: (k) => headerStore[String(k).toLowerCase()] ?? null })),
}));

import { query, dbEnabled } from '../../lib/db.js';
import { submitContactMessage } from '../../app/[locale]/contact/actions.js';
import { MAX_MESSAGE_CHARS } from '../../lib/public-write-policy.js';
import { submitContactAction, subscribeNewsletterAction } from '../../app/admin/actions.js';
import { resetRateLimits } from '../../lib/rate-limit.js';

/**
 * C-D16 / C-S4 (no rate limiting, unbounded `message`) and C-D17 (the legacy
 * action thanking a sender for a message it failed to store).
 *
 * `message` is `longtext`. Field clipping bounds row WIDTH — name and email to
 * 191, subject to 255 — but nothing bounded the body, so one request could
 * store megabytes into the one table the deploy runbook has no rollback for.
 */
function form(overrides = {}) {
  const fd = new FormData();
  const values = {
    name: 'A Person', email: 'a@example.com', subject: 'Hazard', message: 'There is debris at ch. 21.',
    ...overrides,
  };
  for (const [k, v] of Object.entries(values)) fd.append(k, v);
  return fd;
}

beforeEach(() => {
  vi.clearAllMocks();
  resetRateLimits();
  dbEnabled.mockReturnValue(true);
  query.mockResolvedValue({});
  headerStore['x-forwarded-for'] = '203.0.113.9';
});

describe('submitContactMessage — rate limit', () => {
  it('accepts the first five submissions from one address and rejects the sixth', async () => {
    for (let i = 1; i <= 5; i += 1) {
      const res = await submitContactMessage(null, form());
      expect(res.status, `submission ${i}`).toBe('ok');
    }
    const sixth = await submitContactMessage(null, form());
    expect(sixth.status).toBe('ratelimited');
    // Nothing reached the database on the rejected attempt.
    expect(query).toHaveBeenCalledTimes(5);
  });

  it('does not penalise a different address', async () => {
    for (let i = 0; i < 5; i += 1) await submitContactMessage(null, form());
    expect((await submitContactMessage(null, form())).status).toBe('ratelimited');
    headerStore['x-forwarded-for'] = '198.51.100.4';
    expect((await submitContactMessage(null, form())).status).toBe('ok');
  });

  it('spends the budget on a bot that trips the honeypot, not only on real sends', async () => {
    // The honeypot returns a success shape so a bot learns nothing. That must
    // not also make honeypot hits free — they are the traffic being limited.
    for (let i = 0; i < 5; i += 1) await submitContactMessage(null, form({ company: 'Acme' }));
    expect(query).not.toHaveBeenCalled();
    expect((await submitContactMessage(null, form())).status).toBe('ratelimited');
  });
});

describe('submitContactMessage — message cap', () => {
  it('exposes the cap so the form can enforce it client-side too', () => {
    expect(Number.isInteger(MAX_MESSAGE_CHARS)).toBe(true);
    expect(MAX_MESSAGE_CHARS).toBeGreaterThan(1000);
    expect(MAX_MESSAGE_CHARS).toBeLessThan(100_000);
  });

  it('rejects a 1 MB message instead of storing it', async () => {
    const res = await submitContactMessage(null, form({ message: 'x'.repeat(1024 * 1024) }));
    expect(res.status).toBe('too_long');
    expect(query).not.toHaveBeenCalled();
  });

  it('rejects one character over the cap and accepts one character under it', async () => {
    expect((await submitContactMessage(null, form({ message: 'x'.repeat(MAX_MESSAGE_CHARS + 1) }))).status)
      .toBe('too_long');
    expect((await submitContactMessage(null, form({ message: 'x'.repeat(MAX_MESSAGE_CHARS) }))).status)
      .toBe('ok');
  });

  it('rejecting an over-long message does not spend the sender\'s budget', async () => {
    // Otherwise a person who pasted a long document is locked out for ten
    // minutes for a mistake the form told them to fix.
    for (let i = 0; i < 8; i += 1) {
      const res = await submitContactMessage(null, form({ message: 'x'.repeat(MAX_MESSAGE_CHARS + 1) }));
      expect(res.status).toBe('too_long');
    }
    expect((await submitContactMessage(null, form())).status).toBe('ok');
  });
});

describe('submitContactMessage — failure honesty', () => {
  it('reports unavailable when the insert throws', async () => {
    query.mockRejectedValue(Object.assign(new Error('nope'), { code: 'ER_LOCK_WAIT_TIMEOUT' }));
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect((await submitContactMessage(null, form())).status).toBe('unavailable');
    spy.mockRestore();
  });
});

describe('legacy submitContactAction / subscribeNewsletterAction', () => {
  afterEach(() => vi.restoreAllMocks());

  it('stops returning ok:true after a failed insert — C-D17', async () => {
    // It logged the failure and thanked the sender anyway. Its own successor
    // documents that as wrong: somebody reporting a hazard needs to know the
    // message did not arrive so they can use another route.
    query.mockRejectedValue(new Error('disk full'));
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const res = await submitContactAction(form());
    expect(res.ok).toBe(false);
    expect(res.error).toBeTruthy();
  });

  it('rate-limits the legacy contact action', async () => {
    for (let i = 0; i < 5; i += 1) expect((await submitContactAction(form())).ok).toBe(true);
    const denied = await submitContactAction(form());
    expect(denied.ok).toBe(false);
    expect(denied.error).toBeTruthy();
  });

  it('caps the legacy contact message too', async () => {
    const res = await submitContactAction(form({ message: 'x'.repeat(1024 * 1024) }));
    expect(res.ok).toBe(false);
    expect(query).not.toHaveBeenCalled();
  });

  it('rate-limits the newsletter action', async () => {
    const fd = (email) => { const f = new FormData(); f.append('email', email); return f; };
    for (let i = 0; i < 5; i += 1) {
      expect((await subscribeNewsletterAction(fd(`a${i}@example.com`))).ok).toBe(true);
    }
    expect((await subscribeNewsletterAction(fd('a9@example.com'))).ok).toBe(false);
  });

  it('stops returning ok:true after a failed newsletter insert', async () => {
    query.mockRejectedValue(new Error('disk full'));
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const fd = new FormData();
    fd.append('email', 'a@example.com');
    expect((await subscribeNewsletterAction(fd)).ok).toBe(false);
  });
});
