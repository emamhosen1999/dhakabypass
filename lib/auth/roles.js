export const ROLES = { ADMIN: 'admin', EDITOR: 'editor', TRANSLATOR: 'translator' };

/** Explicit grants only. Anything not listed is denied — this fails closed. */
export const PERMISSIONS = {
  [ROLES.ADMIN]: ['manage_users', 'manage_pages', 'edit_blocks', 'translate', 'publish', 'manage_media'],
  [ROLES.EDITOR]: ['manage_pages', 'edit_blocks', 'translate', 'publish', 'manage_media'],
  [ROLES.TRANSLATOR]: ['translate'],
};

export function can(role, action) {
  // Object.hasOwn guards against prototype keys (e.g. role === 'constructor')
  // — a plain `PERMISSIONS[role]` lookup would return an inherited function
  // there instead of undefined, and `.includes` on that would throw.
  if (!Object.hasOwn(PERMISSIONS, role)) return false;
  return PERMISSIONS[role].includes(action);
}
