import { ROLES } from './roles.js';

/**
 * The rules of the staff screen, as pure functions (W1.17).
 *
 * Kept out of the 'use server' actions file so they are testable without a
 * session, and out of the repo so the database never has to know who is
 * asking.
 */

export const ROLE_VALUES = Object.freeze(Object.values(ROLES));
export const isRole = (v) => ROLE_VALUES.includes(v);

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const MIN_PASSWORD = 12;

export const normaliseEmail = (v) => String(v || '').trim().toLowerCase();

/** `{ ok: true, value }` or `{ ok: false, error }` for a new staff member. */
export function validateNewUser({ email, name, role, password }) {
  const e = normaliseEmail(email);
  if (!e || e.length > 191 || !EMAIL_RE.test(e)) return { ok: false, error: 'Enter a valid email address.' };
  if (!isRole(role)) return { ok: false, error: 'Choose a role.' };
  const p = String(password || '');
  if (p.length < MIN_PASSWORD) return { ok: false, error: `The password must be at least ${MIN_PASSWORD} characters.` };
  return { ok: true, value: { email: e, name: String(name || '').trim().slice(0, 191), role, password: p } };
}

/**
 * May `actor` remove or demote `target`?
 *
 * Two things must never happen through this screen: an admin locking
 * themselves out, and the last admin being removed so that nobody can add
 * one back. `adminCount` counts users rows with role admin; the bootstrap
 * addresses in ADMIN_EMAILS still sign in whatever happens here, but they
 * are not counted, because an operator looking at this screen cannot see
 * them and must not be told "there is another admin" about one they cannot
 * name.
 */
export function canRemoveOrDemote({ actorEmail, target, adminCount }) {
  if (!target) return { ok: false, error: 'That person is no longer on the list.' };
  if (normaliseEmail(actorEmail) === normaliseEmail(target.email)) {
    return { ok: false, error: 'You cannot remove or demote your own account. Ask another administrator.' };
  }
  if (target.role === ROLES.ADMIN && adminCount <= 1) {
    return { ok: false, error: 'This is the only administrator. Make someone else an administrator first.' };
  }
  return { ok: true };
}
