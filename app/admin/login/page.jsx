import { redirect } from 'next/navigation';
import { AuthError } from 'next-auth';
import { auth, signIn } from '../../../auth';

export const dynamic = 'force-dynamic';

const googleEnabled = () =>
  Boolean(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET);

export default async function LoginPage({ searchParams }) {
  const session = await auth();
  if (session?.user?.isAdmin) redirect('/admin');

  const params = await searchParams;
  const error = params?.error;

  async function passwordLogin(formData) {
    'use server';
    try {
      await signIn('credentials', {
        email: formData.get('email'),
        password: formData.get('password'),
        redirectTo: '/admin',
      });
    } catch (err) {
      if (err instanceof AuthError) {
        redirect('/admin/login?error=CredentialsSignin');
      }
      throw err; // redirect() throws internally — must rethrow
    }
  }

  async function googleLogin() {
    'use server';
    await signIn('google', { redirectTo: '/admin' });
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-blue-900 to-blue-700">
      <div className="w-full max-w-md bg-white rounded-xl shadow-2xl p-8">
        <div className="flex flex-col items-center mb-8">
          <img src="/logo.webp" alt="DBEDC" className="w-16 h-16 mb-3" />
          <h1 className="text-2xl font-bold text-blue-900">Admin Sign in</h1>
          <p className="text-sm text-gray-500 mt-1 text-center">
            Manage the Dhaka Bypass Expressway website
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {error === 'AccessDenied'
              ? 'That account is not authorised for admin access.'
              : 'Sign-in failed. Check your email and password.'}
          </div>
        )}

        <form action={passwordLogin} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-1">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              className="w-full px-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-1">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="w-full px-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-blue-900 hover:bg-blue-800 text-white py-2.5 rounded-md font-semibold transition-all"
          >
            Sign in
          </button>
        </form>

        {googleEnabled() && (
          <>
            <div className="flex items-center gap-3 my-6">
              <div className="h-px bg-gray-200 flex-1" />
              <span className="text-xs text-gray-400 uppercase">or</span>
              <div className="h-px bg-gray-200 flex-1" />
            </div>
            <form action={googleLogin}>
              <button
                type="submit"
                className="w-full flex items-center justify-center gap-3 border border-gray-300 hover:bg-gray-50 text-gray-700 py-2.5 rounded-md font-semibold transition-all"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1Z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.65l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z" />
                  <path fill="#FBBC05" d="M5.84 14.11a6.6 6.6 0 0 1 0-4.22V7.05H2.18a11 11 0 0 0 0 9.9l3.66-2.84Z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1a11 11 0 0 0-9.82 6.05l3.66 2.84c.87-2.6 3.3-4.51 6.16-4.51Z" />
                </svg>
                Continue with Google
              </button>
            </form>
          </>
        )}

        <p className="mt-6 text-xs text-center text-gray-400">
          Access is restricted to approved administrators.
        </p>
      </div>
    </div>
  );
}
