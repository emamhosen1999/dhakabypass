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
    expect(can(ROLES.EDITOR, 'translate')).toBe(true);
    expect(can(ROLES.EDITOR, 'manage_media')).toBe(true);
  });

  it('limits a translator to translating', () => {
    expect(can(ROLES.TRANSLATOR, 'translate')).toBe(true);
    expect(can(ROLES.TRANSLATOR, 'manage_pages')).toBe(false);
    expect(can(ROLES.TRANSLATOR, 'edit_blocks')).toBe(false);
    expect(can(ROLES.TRANSLATOR, 'publish')).toBe(false);
    expect(can(ROLES.TRANSLATOR, 'manage_users')).toBe(false);
    expect(can(ROLES.TRANSLATOR, 'manage_media')).toBe(false);
  });

  it('fails closed on unknown roles and actions', () => {
    expect(can('superuser', 'publish')).toBe(false);
    expect(can(ROLES.ADMIN, 'launch_missiles')).toBe(false);
    expect(can(undefined, 'translate')).toBe(false);
    expect(can(null, 'translate')).toBe(false);
    expect(can(ROLES.ADMIN, undefined)).toBe(false);
  });

  it('fails closed on prototype-polluting role names instead of throwing', () => {
    expect(() => can('constructor', 'publish')).not.toThrow();
    expect(can('constructor', 'publish')).toBe(false);
    expect(can('__proto__', 'publish')).toBe(false);
    expect(can('toString', 'publish')).toBe(false);
  });
});
