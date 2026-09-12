import { auth } from '../../auth';
import { can } from './roles';
import { validationError } from '../errors.js';

/**
 * The authorization chokepoint for every pages-v2 / translations admin
 * action: `isAdmin` is checked FIRST (it's re-derived from ADMIN_EMAILS on
 * every request, so revocation is immediate and independent of the cached
 * role), then `can(role, action)`.
 *
 * Deliberately a plain module, NOT part of a 'use server' file. Exporting
 * this from a 'use server' module would make it an independently
 * addressable server-action endpoint — callable directly with an arbitrary
 * `action` string and returning the caller's own session object. It isn't a
 * user-facing action itself, just a helper every action calls first.
 */
export async function assertCan(action) {
  const session = await auth();
  // validationError: these two sentences are for the operator, and that is
  // the only kind of message a production build lets through (lib/admin/run-action.js).
  if (!session?.user?.isAdmin) throw validationError('Sign in to continue');
  if (!can(session.user.role, action)) {
    throw validationError(`Your role cannot ${action.replace(/_/g, ' ')}`);
  }
  return session;
}
