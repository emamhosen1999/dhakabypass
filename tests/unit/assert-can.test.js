// tests/unit/assert-can.test.js
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../auth.js', () => ({ auth: vi.fn() }));

import { auth } from '../../auth.js';
import { assertCan } from '../../lib/auth/assert-can.js';

describe('assertCan — the authorization chokepoint', () => {
  beforeEach(() => vi.clearAllMocks());

  it('throws when there is no session', async () => {
    auth.mockResolvedValue(null);
    await expect(assertCan('manage_pages')).rejects.toThrow('Sign in to continue');
  });

  it('throws when isAdmin is false, even with a role that would permit the action', async () => {
    // Stale JWT scenario: role still says admin, but ADMIN_EMAILS no longer
    // includes this user — isAdmin must be re-derived per request and checked
    // first, or a revoked admin keeps access on an unexpired token.
    auth.mockResolvedValue({ user: { isAdmin: false, role: 'admin' } });
    await expect(assertCan('manage_pages')).rejects.toThrow('Sign in to continue');
  });

  it('throws when isAdmin is true but the role lacks the permission', async () => {
    auth.mockResolvedValue({ user: { isAdmin: true, role: 'translator' } });
    await expect(assertCan('manage_pages')).rejects.toThrow('Your role cannot manage pages');
  });

  it('succeeds and returns the session when both checks pass', async () => {
    const session = { user: { isAdmin: true, role: 'editor' } };
    auth.mockResolvedValue(session);
    await expect(assertCan('manage_pages')).resolves.toBe(session);
  });
});
