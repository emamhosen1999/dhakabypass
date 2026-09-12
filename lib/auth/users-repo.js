import { cache } from 'react';
import { unstable_cache } from 'next/cache';
import bcrypt from 'bcryptjs';
import { query, dbEnabled } from '../db.js';
import { USERS_TAG } from '../revalidate.js';

/**
 * The `users` table — who may sign in, and as what.
 *
 * Passwords are bcrypt hashes with the same cost the seed script uses; the
 * plain text never leaves the action that received it.
 */
export async function listUsers() {
  if (!dbEnabled()) return [];
  const rows = await query(
    'SELECT id, email, name, role, password_hash IS NOT NULL AS has_password, created_at FROM users ORDER BY role, email',
  );
  return (rows || []).map((r) => ({
    id: r.id, email: r.email, name: r.name || '', role: r.role,
    hasPassword: Boolean(r.has_password), createdAt: r.created_at,
  }));
}

export async function getUserByEmail(email) {
  if (!dbEnabled()) return null;
  const rows = await query('SELECT id, email, name, role FROM users WHERE email = ? LIMIT 1', [email]);
  return rows?.[0] || null;
}

export async function getUserById(id) {
  if (!dbEnabled()) return null;
  const rows = await query('SELECT id, email, name, role FROM users WHERE id = ? LIMIT 1', [id]);
  return rows?.[0] || null;
}

export async function countAdmins() {
  if (!dbEnabled()) return 0;
  const rows = await query("SELECT COUNT(*) AS c FROM users WHERE role = 'admin'");
  return Number(rows?.[0]?.c || 0);
}

export async function createUser({ email, name, role, password }) {
  const hash = await bcrypt.hash(password, 10);
  const res = await query(
    'INSERT INTO users (email, name, role, password_hash) VALUES (?, ?, ?, ?)',
    [email, name, role, hash],
  );
  return res.insertId;
}

export async function setUserRole(id, role) {
  await query('UPDATE users SET role = ? WHERE id = ?', [role, id]);
}

export async function setUserPassword(id, password) {
  const hash = await bcrypt.hash(password, 10);
  await query('UPDATE users SET password_hash = ? WHERE id = ?', [hash, id]);
}

export async function deleteUser(id) {
  await query('DELETE FROM users WHERE id = ?', [id]);
}

/** Every address with a users row, lower-cased. */
export async function listUserEmails() {
  if (!dbEnabled()) return [];
  let rows;
  try {
    rows = await query('SELECT email FROM users');
  } catch {
    // A dead database must not sign anyone in who is not on the bootstrap
    // list — and must not throw inside an auth callback either.
    return [];
  }
  return (rows || []).map((r) => String(r.email || '').toLowerCase());
}

/**
 * Cached, tagged, and re-read within sixty seconds regardless: auth.js asks
 * on every admin request, and the answer must change the moment someone is
 * removed at /admin/users (revalidateUsers) — not merely at their next
 * sign-in.
 */
export const listUserEmailsCached = cache(() =>
  unstable_cache(listUserEmails, ['user-emails'], { tags: [USERS_TAG], revalidate: 60 })(),
);
