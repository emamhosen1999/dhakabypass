import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import Credentials from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { query, dbEnabled } from './lib/db';

/**
 * Admin auth: Google OAuth + email/password, JWT sessions (no session table).
 *
 * Access is gated by an explicit ADMIN_EMAILS allowlist — signing in with Google
 * is NOT enough on its own, otherwise anyone with a Google account could reach
 * the admin. Both providers are checked against the same list.
 */

export function allowedAdmins() {
  return (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isAllowedAdmin(email) {
  if (!email) return false;
  const list = allowedAdmins();
  // Fail closed: an empty allowlist grants nobody access.
  if (list.length === 0) return false;
  return list.includes(String(email).toLowerCase());
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
      if (!isAllowedAdmin(email)) return null;
      if (!dbEnabled()) return null;

      const rows = await query(
        'SELECT id, email, name, password_hash FROM admin_users WHERE email = ? LIMIT 1',
        [email]
      );
      const user = rows?.[0];
      if (!user?.password_hash) return null;

      const ok = await bcrypt.compare(password, user.password_hash);
      if (!ok) return null;

      return { id: String(user.id), email: user.email, name: user.name || user.email };
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
      return isAllowedAdmin(user?.email);
    },
    async jwt({ token }) {
      token.isAdmin = isAllowedAdmin(token.email);
      return token;
    },
    async session({ session, token }) {
      if (session.user) session.user.isAdmin = Boolean(token.isAdmin);
      return session;
    },
  },
  trustHost: true,
});
