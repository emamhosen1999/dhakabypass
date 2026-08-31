export const ROLES = { ADMIN: 'admin', EDITOR: 'editor', TRANSLATOR: 'translator' };

/** Explicit grants only. Anything not listed is denied — this fails closed. */
export const PERMISSIONS = {
  [ROLES.ADMIN]: ['manage_users', 'manage_pages', 'edit_blocks', 'translate', 'publish', 'manage_media'],
  [ROLES.EDITOR]: ['manage_pages', 'edit_blocks', 'translate', 'publish', 'manage_media'],
  [ROLES.TRANSLATOR]: ['translate'],
};

export function can(role, action) {
  const granted = PERMISSIONS[role];
  if (!granted) return false;
  return granted.includes(action);
}
