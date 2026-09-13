import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import bcrypt from 'bcryptjs';

/**
 * The sign-in path itself (W6.19): the password check against a bcrypt hash,
 * the allowlist on every provider, and the role and admin flag the session
 * carries. auth.js is imported for real; only NextAuth's constructor, the
 * database and the users list are replaced, so the callbacks under test are
 * the ones production runs.
 */
let config;
vi.mock('next-auth', () => ({
  default: (cfg) => { config = cfg; return { handlers: {}, auth: vi.fn(), signIn: vi.fn(), signOut: vi.fn() }; },
}));
vi.mock('next-auth/providers/credentials', () => ({ default: (opts) => ({ id: 'credentials', ...opts }) }));
vi.mock('next-auth/providers/google', () => ({ default: (opts) => ({ id: 'google', ...opts }) }));

const query = vi.fn();
const dbEnabled = vi.fn(() => true);
vi.mock('../../lib/db', () => ({ query: (...a) => query(...a), dbEnabled: () => dbEnabled() }));
const listUserEmailsCached = vi.fn(async () => []);
vi.mock('../../lib/auth/users-repo', () => ({ listUserEmailsCached: () => listUserEmailsCached() }));
const resolveUserRole = vi.fn(async () => null);
vi.mock('../../lib/auth/resolve-role', () => ({ resolveUserRole: (e) => resolveUserRole(e) }));

const HASH = bcrypt.hashSync('correct horse', 4);
const env = { ...process.env };

beforeEach(async () => {
  vi.resetModules();
  query.mockReset();
  dbEnabled.mockReturnValue(true);
  listUserEmailsCached.mockResolvedValue([]);
  resolveUserRole.mockResolvedValue(null);
  process.env.ADMIN_EMAILS = 'boss@dbedc.example';
  delete process.env.AUTH_GOOGLE_ID;
  await import('../../auth.js');
});
afterEach(() => { process.env = { ...env }; });

const authorize = (creds) => config.providers.find((p) => p.id === 'credentials').authorize(creds);

describe('password sign-in', () => {
  it('accepts the right password and returns the row role', async () => {
    query.mockResolvedValue([{ id: 7, email: 'ed@dbedc.example', name: 'Ed', password_hash: HASH, role: 'editor' }]);
    await expect(authorize({ email: ' Ed@DBEDC.example ', password: 'correct horse' }))
      .resolves.toEqual({ id: '7', email: 'ed@dbedc.example', name: 'Ed', role: 'editor' });
    expect(query.mock.calls[0][1]).toEqual(['ed@dbedc.example']);
  });

  it('refuses a wrong password, a row with no hash, an unknown address and blank input', async () => {
    query.mockResolvedValue([{ id: 7, email: 'ed@dbedc.example', password_hash: HASH, role: 'editor' }]);
    await expect(authorize({ email: 'ed@dbedc.example', password: 'wrong' })).resolves.toBeNull();
    query.mockResolvedValue([{ id: 8, email: 'g@dbedc.example', password_hash: null, role: 'editor' }]);
    await expect(authorize({ email: 'g@dbedc.example', password: 'anything' })).resolves.toBeNull();
    query.mockResolvedValue([]);
    await expect(authorize({ email: 'nobody@x.example', password: 'x' })).resolves.toBeNull();
    await expect(authorize({ email: '', password: '' })).resolves.toBeNull();
  });

  it('refuses when the database is not configured, without querying', async () => {
    dbEnabled.mockReturnValue(false);
    await expect(authorize({ email: 'ed@dbedc.example', password: 'correct horse' })).resolves.toBeNull();
    expect(query).not.toHaveBeenCalled();
  });

  it('never invents a role for a row without one', async () => {
    query.mockResolvedValue([{ id: 9, email: 'r@dbedc.example', password_hash: HASH, role: '' }]);
    expect((await authorize({ email: 'r@dbedc.example', password: 'correct horse' })).role).toBeUndefined();
  });
});

describe('callbacks', () => {
  it('lets in the bootstrap list and users rows, and nobody else, for every provider', async () => {
    const { signIn } = config.callbacks;
    await expect(signIn({ user: { email: 'BOSS@dbedc.example' } })).resolves.toBe(true);
    listUserEmailsCached.mockResolvedValue(['ed@dbedc.example']);
    await expect(signIn({ user: { email: 'ed@dbedc.example' } })).resolves.toBe(true);
    await expect(signIn({ user: { email: 'stranger@gmail.com' } })).resolves.toBe(false);
    await expect(signIn({ user: {} })).resolves.toBe(false);
  });

  it('fails closed when the allowlist is empty and the users list cannot be read', async () => {
    process.env.ADMIN_EMAILS = '';
    listUserEmailsCached.mockRejectedValue(new Error('down'));
    await expect(config.callbacks.signIn({ user: { email: 'boss@dbedc.example' } })).resolves.toBe(false);
  });

  it('re-derives isAdmin on every request, so a removed person is refused at once', async () => {
    const { jwt } = config.callbacks;
    listUserEmailsCached.mockResolvedValue(['ed@dbedc.example']);
    let token = await jwt({ token: { email: 'ed@dbedc.example' }, user: { role: 'editor' } });
    expect(token).toMatchObject({ isAdmin: true, role: 'editor' });
    listUserEmailsCached.mockResolvedValue([]);
    token = await jwt({ token });
    expect(token.isAdmin).toBe(false);
  });

  it('takes a Google sign-in role from the users row, not from the provider', async () => {
    resolveUserRole.mockResolvedValue('translator');
    const token = await config.callbacks.jwt({ token: { email: 'boss@dbedc.example' }, user: { email: 'boss@dbedc.example' } });
    expect(token.role).toBe('translator');
  });

  it('copies isAdmin and role onto the session', async () => {
    const session = await config.callbacks.session({ session: { user: {} }, token: { isAdmin: 1, role: 'admin' } });
    expect(session.user).toEqual({ isAdmin: true, role: 'admin' });
  });
});
