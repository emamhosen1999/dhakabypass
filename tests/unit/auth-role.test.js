// tests/unit/auth-role.test.js
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../lib/db.js', () => ({
  query: vi.fn(),
  dbEnabled: vi.fn(),
}));

import { query, dbEnabled } from '../../lib/db.js';
import { resolveUserRole } from '../../lib/auth/resolve-role.js';

describe('resolveUserRole', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns the role for a matching users row', async () => {
    dbEnabled.mockReturnValue(true);
    query.mockResolvedValue([{ role: 'translator' }]);

    expect(await resolveUserRole('translator@example.com')).toBe('translator');
    expect(query).toHaveBeenCalledWith(
      'SELECT role FROM users WHERE email = ? LIMIT 1',
      ['translator@example.com']
    );
  });

  it('lowercases and trims the email before querying', async () => {
    dbEnabled.mockReturnValue(true);
    query.mockResolvedValue([{ role: 'admin' }]);

    await resolveUserRole('  Someone@Example.com  ');
    expect(query).toHaveBeenCalledWith(
      'SELECT role FROM users WHERE email = ? LIMIT 1',
      ['someone@example.com']
    );
  });

  it('returns null when there is no matching row', async () => {
    dbEnabled.mockReturnValue(true);
    query.mockResolvedValue([]);

    expect(await resolveUserRole('nobody@example.com')).toBe(null);
  });

  it('returns null and never queries when the database is unavailable', async () => {
    dbEnabled.mockReturnValue(false);

    expect(await resolveUserRole('someone@example.com')).toBe(null);
    expect(query).not.toHaveBeenCalled();
  });

  it('returns null for a missing or empty email without querying', async () => {
    dbEnabled.mockReturnValue(true);

    expect(await resolveUserRole('')).toBe(null);
    expect(await resolveUserRole(undefined)).toBe(null);
    expect(await resolveUserRole(null)).toBe(null);
    expect(query).not.toHaveBeenCalled();
  });
});
