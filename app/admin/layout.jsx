// RootDocument first: it brings globals.css, which admin.css must follow.
import RootDocument from '../../components/chrome/RootDocument.jsx';
import './admin.css';
import ThemeScript from '../../components/chrome/ThemeScript.jsx';
import { generateRootMetadata } from '../../lib/seo/root-metadata.js';

export const dynamic = 'force-dynamic';

export async function generateMetadata() {
  return {
    ...(await generateRootMetadata('en')),
    title: 'Admin — Dhaka Bypass Expressway',
    description: undefined,
    // never let the admin surface into search results
    robots: { index: false, follow: false },
  };
}

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
    <RootDocument lang="en">
      <div className="db-admin min-h-screen bg-gray-50 text-gray-800">
        <ThemeScript />
        {children}
      </div>
    </RootDocument>
  );
}
