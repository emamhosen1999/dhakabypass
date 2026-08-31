export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Admin — Dhaka Bypass Expressway',
  // never let the admin surface into search results
  robots: { index: false, follow: false },
};

/**
 * Bare wrapper for everything under /admin. The auth guard lives in
 * app/admin/(dash)/layout.jsx so that /admin/login can render unauthenticated
 * without causing a redirect loop.
 */
export default function AdminRootLayout({ children }) {
  return <div className="min-h-screen bg-gray-50 text-gray-800">{children}</div>;
}
