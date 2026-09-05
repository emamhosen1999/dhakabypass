import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth, signOut } from '../../../auth';

export const dynamic = 'force-dynamic';

/**
 * `/admin/pages-v2` — the block builder for the localised site — was missing
 * from this list, so the screen that edits every page of the new site was
 * reachable only by typing its URL. It is listed as "Content" to distinguish it
 * from "Pages", which edits the legacy site's sections.
 */
const NAV = [
  { href: '/admin', label: 'Dashboard' },
  { href: '/admin/pages-v2', label: 'Content' },
  { href: '/admin/news', label: 'News' },
  { href: '/admin/media', label: 'Media' },
  { href: '/admin/corridor', label: 'Corridor' },
  { href: '/admin/messages', label: 'Messages' },
  { href: '/admin/redirects', label: 'Redirects' },
  { href: '/admin/settings', label: 'Settings' },
  { href: '/admin/pages', label: 'Legacy' },
];

/**
 * Guarded admin chrome. Every route in this group requires an authenticated user
 * who is on the ADMIN_EMAILS allowlist — enforced here (server side) rather than
 * in middleware, which runs on the edge runtime where bcrypt/mysql can't.
 */
export default async function DashLayout({ children }) {
  const session = await auth();
  if (!session?.user?.isAdmin) redirect('/admin/login');

  return (
    <>
      <header className="bg-blue-900 text-white shadow-md">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-8 min-w-0">
            <Link href="/admin" className="flex items-center gap-2 font-bold shrink-0">
              <img src="/logo.webp" alt="" className="w-8 h-8 bg-white rounded p-0.5" />
              <span className="whitespace-nowrap">DBEDC Admin</span>
            </Link>
            <nav className="hidden md:flex items-center gap-1">
              {NAV.map((n) => (
                <Link
                  key={n.href}
                  href={n.href}
                  className="px-3 py-2 rounded-md text-sm font-semibold text-blue-100 hover:bg-white/10 hover:text-white transition-all whitespace-nowrap"
                >
                  {n.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Link
              href="/"
              target="_blank"
              className="hidden sm:inline text-sm text-blue-100 hover:text-white transition-all whitespace-nowrap"
            >
              View site ↗
            </Link>
            <span className="hidden lg:inline text-sm text-blue-200 truncate max-w-[200px]">
              {session.user.email}
            </span>
            <form
              action={async () => {
                'use server';
                await signOut({ redirectTo: '/admin/login' });
              }}
            >
              <button
                type="submit"
                className="px-3 py-1.5 text-sm rounded-md bg-white/10 hover:bg-white/20 transition-all whitespace-nowrap"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>

        {/* mobile nav */}
        <nav className="md:hidden flex items-center gap-1 px-4 pb-3 overflow-x-auto">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className="px-3 py-1.5 rounded-md text-sm font-semibold text-blue-100 bg-white/10 whitespace-nowrap"
            >
              {n.label}
            </Link>
          ))}
        </nav>
      </header>

      <main className="container mx-auto px-4 py-8">{children}</main>
    </>
  );
}
