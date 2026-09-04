import { describe, it, expect } from 'vitest';
import { can, ROLES } from '../../lib/auth/roles.js';

/**
 * The legacy admin tree gates on these permissions. The point of the test is
 * the NEGATIVE case: before this was fixed, `requireAdmin()` checked only
 * `isAdmin`, so a translator could publish news to the public site and read
 * and delete every row of contact_messages.
 *
 * Asserting the permission strings here means a future rename of a role or a
 * permission fails in CI rather than silently widening access -- `can()` fails
 * closed, so a typo'd permission denies everyone and a REMOVED one denies
 * nobody, and only one of those is visible without a test.
 */
const LEGACY_ACTION_PERMISSIONS = {
  saveSectionAction: 'manage_pages',
  saveGalleryAction: 'manage_media',
  deleteGalleryImageAction: 'manage_media',
  deleteMessageAction: 'manage_users',
  toggleMessageReadAction: 'manage_users',
  saveNewsAction: 'publish',
  deleteNewsAction: 'publish',
};

describe('legacy admin action permissions', () => {
  it('every gated action names a permission that actually exists', () => {
    // A permission string nothing grants would lock out admins too, which is a
    // different bug but just as real.
    for (const [action, perm] of Object.entries(LEGACY_ACTION_PERMISSIONS)) {
      expect(can(ROLES.ADMIN, perm), `admin should be able to ${perm} (${action})`).toBe(true);
    }
  });

  it('denies a translator every one of them', () => {
    for (const [action, perm] of Object.entries(LEGACY_ACTION_PERMISSIONS)) {
      expect(can(ROLES.TRANSLATOR, perm), `translator must NOT ${perm} (${action})`).toBe(false);
    }
  });

  it('lets an editor manage content but not personal data', () => {
    expect(can(ROLES.EDITOR, 'manage_pages')).toBe(true);
    expect(can(ROLES.EDITOR, 'manage_media')).toBe(true);
    expect(can(ROLES.EDITOR, 'publish')).toBe(true);
    // contact_messages holds submitted personal data; deleting it is admin-only.
    expect(can(ROLES.EDITOR, 'manage_users')).toBe(false);
  });

  it('denies a user with no role at all', () => {
    // Someone on ADMIN_EMAILS with no `users` row resolves to role undefined.
    for (const perm of Object.values(LEGACY_ACTION_PERMISSIONS)) {
      expect(can(undefined, perm)).toBe(false);
      expect(can(null, perm)).toBe(false);
      expect(can('', perm)).toBe(false);
    }
  });

  it('denies a role named after an Object prototype key', () => {
    for (const perm of Object.values(LEGACY_ACTION_PERMISSIONS)) {
      expect(can('constructor', perm)).toBe(false);
      expect(can('__proto__', perm)).toBe(false);
      expect(can('toString', perm)).toBe(false);
    }
  });
});
