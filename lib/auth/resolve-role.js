import { query, dbEnabled } from '../db';

/**
 * Looks up a user's role from the `users` table by email.
 *
 * Returns the role string, or `null` if there is no matching row (or the
 * database is unavailable). Callers must treat `null` as "no role", never
 * substitute a default — `can(null, ...)` already fails closed.
 */
export async function resolveUserRole(email) {
  if (!email || !dbEnabled()) return null;
  const rows = await query('SELECT role FROM users WHERE email = ? LIMIT 1', [
    String(email).toLowerCase().trim(),
  ]);
  return rows?.[0]?.role || null;
}
