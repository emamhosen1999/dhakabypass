import './admin.css';
import ThemeScript from '../../components/chrome/ThemeScript.jsx';

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
 *
 * `db-admin` is the admin's design language (admin.css): the Tailwind
 * palette the screens are written in, remapped onto the public site's
 * tokens, with dark mode following the same `data-theme` rule as the public
 * site — hence the same ThemeScript, so the choice is applied before paint.
 */
export default function AdminRootLayout({ children }) {
  return (
    <div className="db-admin min-h-screen bg-gray-50 text-gray-800">
      <ThemeScript />
      {children}
    </div>
  );
}
