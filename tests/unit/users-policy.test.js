import { describe, it, expect } from 'vitest';
import { validateNewUser, canRemoveOrDemote, MIN_PASSWORD, ROLE_VALUES } from '../../lib/auth/users-policy.js';

describe('validateNewUser', () => {
  it('normalises the address and accepts a real role and a long enough password', () => {
    const r = validateNewUser({ email: '  Editor@Example.com ', name: ' Rina ', role: 'editor', password: 'x'.repeat(MIN_PASSWORD) });
    expect(r.ok).toBe(true);
    expect(r.value).toMatchObject({ email: 'editor@example.com', name: 'Rina', role: 'editor' });
  });

  it('refuses a bad address, an unknown role and a short password', () => {
    expect(validateNewUser({ email: 'nope', role: 'editor', password: 'x'.repeat(20) }).ok).toBe(false);
    expect(validateNewUser({ email: 'a@b.co', role: 'owner', password: 'x'.repeat(20) }).ok).toBe(false);
    expect(validateNewUser({ email: 'a@b.co', role: 'editor', password: 'short' }).ok).toBe(false);
    expect(validateNewUser({ email: 'a@b.co', role: 'constructor', password: 'x'.repeat(20) }).ok).toBe(false);
  });

  it('exposes exactly the three roles the permission table knows', () => {
    expect([...ROLE_VALUES].sort()).toEqual(['admin', 'editor', 'translator']);
  });
});

describe('canRemoveOrDemote', () => {
  const admin = { id: 1, email: 'A@x.com', role: 'admin' };
  const editor = { id: 2, email: 'e@x.com', role: 'editor' };

  it('never lets an administrator remove their own account', () => {
    expect(canRemoveOrDemote({ actorEmail: 'a@x.com', target: admin, adminCount: 3 }).ok).toBe(false);
  });

  it('never removes the last administrator', () => {
    expect(canRemoveOrDemote({ actorEmail: 'b@x.com', target: admin, adminCount: 1 }).ok).toBe(false);
    expect(canRemoveOrDemote({ actorEmail: 'b@x.com', target: admin, adminCount: 2 }).ok).toBe(true);
  });

  it('lets an administrator remove an editor, and refuses a vanished target', () => {
    expect(canRemoveOrDemote({ actorEmail: 'a@x.com', target: editor, adminCount: 1 }).ok).toBe(true);
    expect(canRemoveOrDemote({ actorEmail: 'a@x.com', target: null, adminCount: 1 }).ok).toBe(false);
  });
});
