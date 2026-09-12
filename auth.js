import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import Credentials from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { query, dbEnabled } from './lib/db';
import { resolveUserRole } from './lib/auth/resolve-role';
import { listUserEmailsCached } from './lib/auth/users-repo';

/**
 * Admin auth: Google OAuth + email/password, JWT sessions (no session table).
 *
 * Access is gated by an allowlist — signing in with Google is NOT enough on
 * its own, otherwise anyone with a Google account could reach the admin. Both
 * providers are checked against the same list.
 *
 * The list has two halves (W1.17):
 *
 *   1. ADMIN_EMAILS — the BOOTSTRAP addresses, from the environment. They can
 *      always sign in and cannot be removed from /admin/users, which is what
 *      makes it impossible to lock every administrator out through the admin.
 *   2. the `users` table — everyone added at /admin/users. This is what lets
 *      an administrator add or remove an editor without SSH, an .env edit and
 *      a restart, which was the only way before.
 *
 * Fail closed: an address on neither list is refused, and a database that
 * will not answer leaves only the bootstrap list in force.
 */

export function allowedAdmins() {
  return (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

/** The bootstrap half only — synchronous, environment-backed. */
export function isAllowedAdmin(email) {
  if (!email) return false;
  const list = allowedAdmins();
  // Fail closed: an empty allowlist grants nobody access.
  if (list.length === 0) return false;
  return list.includes(String(email).toLowerCase());
}

/**
 * Both halves. Re-derived on every admin request (jwt callback), so a person
 * removed at /admin/users is refused on their next request — revalidateUsers
 * drops the cached list — rather than at their next sign-in.
 */
export async function isPermitted(email) {
  if (!email) return false;
  if (isAllowedAdmin(email)) return true;
  if (!dbEnabled()) return false;
  try {
    return (await listUserEmailsCached()).includes(String(email).toLowerCase());
  } catch {
    return false;
  }
}

const providers = [
  Credentials({
    name: 'Email and password',
    credentials: {
      email: { label: 'Email', type: 'email' },
      password: { label: 'Password', type: 'password' },
    },
    async authorize(creds) {
      const email = String(creds?.email || '').toLowerCase().trim();
      const password = String(creds?.password || '');
      if (!email || !password) return null;
      if (!dbEnabled()) return null;
      // No allowlist pre-check: a users row with a password hash IS the
      // second half of the allowlist, and the bootstrap half also needs a row
      // to have a password to compare.

      const rows = await query(
        'SELECT id, email, name, password_hash, role FROM users WHERE email = ? LIMIT 1',
        [email]
      );
      const user = rows?.[0];
      if (!user?.password_hash) return null;

      const ok = await bcrypt.compare(password, user.password_hash);
      if (!ok) return null;

      return {
        id: String(user.id),
        email: user.email,
        name: user.name || user.email,
        // Deliberately NO default here. `users.role` is NOT NULL with a DB
        // default today, but that is an invariant of a different file
        // (scripts/db-setup-v2.mjs) with nothing tying it to this one. If a
        // row ever has no role — a nullable column, a renamed field, a
        // SELECT that drops it — this must degrade to "no role", not quietly
        // grant editor (manage_pages, edit_blocks, publish, manage_media).
        // undefined here falls through jwt()'s resolveUserRole() and then to
        // undefined, on which can() already fails closed.
        role: user.role || undefined,
      };
    },
  }),
];

// Google is optional — only enabled when credentials are configured.
if (process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET) {
  providers.push(
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    })
  );
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers,
  session: { strategy: 'jwt' },
  pages: { signIn: '/admin/login', error: '/admin/login' },
  callbacks: {
    // The allowlist is enforced here for EVERY provider.
    async signIn({ user }) {
      return isPermitted(user?.email);
    },
    async jwt({ token, user }) {
      token.isAdmin = await isPermitted(token.email);
      // The role is resolved once, at sign-in (when `user` is present), for
      // EVERY provider — not just Credentials — so a Google sign-in cannot
      // inherit a stronger role than the matching `users` row grants. It
      // then rides on the token for the life of the session: we do NOT
      // re-query on every request, since that would put a DB hit on every
      // page view on a memory-limited shared host. A role change in `users`
      // only takes effect the next time the user signs in. `isAdmin` is the
      // immediate revocation path instead — it is re-derived from the
      // allowlist (ADMIN_EMAILS plus the cached, tagged `users` list) on
      // every request, independent of the cached role.
      // If no `users` row matches, token.role is left undefined; can()
      // already fails closed on an undefined role.
      if (user) {
        token.role = user.role || (await resolveUserRole(token.email)) || undefined;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.isAdmin = Boolean(token.isAdmin);
        session.user.role = token.role;
      }
      return session;
    },
  },
  trustHost: true,
});
