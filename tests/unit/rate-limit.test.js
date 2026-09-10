// tests/unit/rate-limit.test.js
import { describe, it, expect, beforeEach } from 'vitest';
import { rateLimit, clientIp, resetRateLimits, trackedKeyCount } from '../../lib/rate-limit.js';

/**
 * C-D16 / C-S4: nothing bounded the public write paths. A script could insert
 * rows into contact_messages and newsletter_subscribers until the shared-host
 * MySQL quota ran out — and contact_messages is precisely the table the deploy
 * runbook has no rollback for.
 *
 * `now` is injected in every test rather than faked with timers, because the
 * window arithmetic is the thing being tested and a test that depends on the
 * clock advancing is a test that fails on a slow CI box.
 */
const opts = { limit: 5, windowMs: 600_000 };

beforeEach(() => resetRateLimits());

describe('rateLimit — per-key sliding window', () => {
  it('allows exactly `limit` hits and rejects the next one', () => {
    for (let i = 1; i <= 5; i += 1) {
      expect(rateLimit('contact', '1.2.3.4', { ...opts, now: 1000 }).ok, `hit ${i}`).toBe(true);
    }
    const sixth = rateLimit('contact', '1.2.3.4', { ...opts, now: 1000 });
    expect(sixth.ok).toBe(false);
    expect(sixth.retryAfterMs).toBe(600_000);
  });

  it('counts each key separately, so one abuser cannot lock out everyone', () => {
    for (let i = 0; i < 5; i += 1) rateLimit('contact', '1.2.3.4', { ...opts, now: 1000 });
    expect(rateLimit('contact', '1.2.3.4', { ...opts, now: 1000 }).ok).toBe(false);
    expect(rateLimit('contact', '5.6.7.8', { ...opts, now: 1000 }).ok).toBe(true);
  });

  it('counts each bucket separately, so contact and newsletter have their own budgets', () => {
    for (let i = 0; i < 5; i += 1) rateLimit('contact', '1.2.3.4', { ...opts, now: 1000 });
    expect(rateLimit('contact', '1.2.3.4', { ...opts, now: 1000 }).ok).toBe(false);
    expect(rateLimit('newsletter', '1.2.3.4', { ...opts, now: 1000 }).ok).toBe(true);
  });

  it('SLIDES rather than resetting on a fixed boundary', () => {
    // A fixed window lets 2x the limit through across a boundary: 5 at the end
    // of one window and 5 at the start of the next, back to back. Here the
    // hits are staggered — one at t=1000 and four at t=2000 — so that at
    // t=601_001 exactly ONE has aged out.
    rateLimit('contact', '1.2.3.4', { ...opts, now: 1000 });
    for (let i = 0; i < 4; i += 1) rateLimit('contact', '1.2.3.4', { ...opts, now: 2000 });
    expect(rateLimit('contact', '1.2.3.4', { ...opts, now: 2000 }).ok).toBe(false);
    // One slot freed, and one only: the window closes again immediately.
    expect(rateLimit('contact', '1.2.3.4', { ...opts, now: 601_001 }).ok).toBe(true);
    expect(rateLimit('contact', '1.2.3.4', { ...opts, now: 601_001 }).ok).toBe(false);
  });

  it('reports how long the caller must wait, measured from the OLDEST hit', () => {
    rateLimit('contact', '1.2.3.4', { ...opts, now: 1000 });
    for (let i = 0; i < 4; i += 1) rateLimit('contact', '1.2.3.4', { ...opts, now: 300_000 });
    const denied = rateLimit('contact', '1.2.3.4', { ...opts, now: 300_000 });
    expect(denied.ok).toBe(false);
    expect(denied.retryAfterMs).toBe(600_000 - 299_000);
  });

  it('frees the whole budget once the window has passed', () => {
    for (let i = 0; i < 5; i += 1) rateLimit('contact', '1.2.3.4', { ...opts, now: 1000 });
    for (let i = 1; i <= 5; i += 1) {
      expect(rateLimit('contact', '1.2.3.4', { ...opts, now: 1_000_000 }).ok, `hit ${i}`).toBe(true);
    }
  });

  it('does not grow without bound when a flood arrives from many addresses', () => {
    // The Map is the whole defence, so the Map must not become the attack.
    for (let i = 0; i < 30_000; i += 1) {
      rateLimit('contact', `10.0.${(i >> 8) & 255}.${i & 255}`, { ...opts, now: 1000 });
    }
    expect(trackedKeyCount()).toBeLessThanOrEqual(10_000);
  });

  it('drops keys whose hits have all expired', () => {
    rateLimit('contact', '1.2.3.4', { ...opts, now: 1000 });
    expect(trackedKeyCount()).toBe(1);
    rateLimit('contact', '5.6.7.8', { ...opts, now: 1_000_000 });
    // The expired key is swept rather than kept forever at zero hits.
    expect(trackedKeyCount()).toBe(1);
  });
});

describe('clientIp', () => {
  const h = (obj) => ({ get: (k) => obj[k.toLowerCase()] ?? null });

  it('takes the left-most address from x-forwarded-for', () => {
    // Left-most is the client; everything after it is a proxy in the chain.
    expect(clientIp(h({ 'x-forwarded-for': '203.0.113.9, 10.0.0.1, 10.0.0.2' }))).toBe('203.0.113.9');
  });

  it('falls back to x-real-ip', () => {
    expect(clientIp(h({ 'x-real-ip': '203.0.113.9' }))).toBe('203.0.113.9');
  });

  it('returns a single shared key when neither header is present', () => {
    // One shared bucket is deliberate: with no address, every anonymous
    // request shares one budget rather than each getting an unlimited one.
    expect(clientIp(h({}))).toBe('unknown');
    expect(clientIp(null)).toBe('unknown');
  });

  it('ignores a blank or whitespace-only header value', () => {
    expect(clientIp(h({ 'x-forwarded-for': '  ,  ' }))).toBe('unknown');
    expect(clientIp(h({ 'x-forwarded-for': '   ', 'x-real-ip': '203.0.113.9' }))).toBe('203.0.113.9');
  });

  it('bounds the key length so a huge header cannot bloat the Map', () => {
    const key = clientIp(h({ 'x-forwarded-for': 'a'.repeat(5000) }));
    expect(key.length).toBeLessThanOrEqual(64);
  });
});
