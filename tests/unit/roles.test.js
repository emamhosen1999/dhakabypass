// tests/unit/roles.test.js
import { describe, it, expect } from 'vitest';
import { ROLES, can } from '../../lib/auth/roles.js';

describe('roles', () => {
  it('lets an admin do everything', () => {
    for (const a of ['manage_users','manage_pages','edit_blocks','translate','publish','manage_media']) {
      expect(can(ROLES.ADMIN, a), a).toBe(true);
    }
  });

  it('stops an editor managing users', () => {
    expect(can(ROLES.EDITOR, 'manage_users')).toBe(false);
    expect(can(ROLES.EDITOR, 'manage_pages')).toBe(true);
    expect(can(ROLES.EDITOR, 'publish')).toBe(true);
  });

  it('limits a translator to translating', () => {
    expect(can(ROLES.TRANSLATOR, 'translate')).toBe(true);
    expect(can(ROLES.TRANSLATOR, 'manage_pages')).toBe(false);
    expect(can(ROLES.TRANSLATOR, 'edit_blocks')).toBe(false);
    expect(can(ROLES.TRANSLATOR, 'publish')).toBe(false);
  });

  it('fails closed on unknown roles and actions', () => {
    expect(can('superuser', 'publish')).toBe(false);
    expect(can(ROLES.ADMIN, 'launch_missiles')).toBe(false);
    expect(can(undefined, 'translate')).toBe(false);
  });
});
