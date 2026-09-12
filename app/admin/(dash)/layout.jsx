import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth, signOut } from '../../../auth';

export const dynamic = 'force-dynamic';

/**
 * `/admin/pages-v2` — the block builder for the localised site — was missing
 * from this list, so the screen that edits every page of the new site was
 * reachable only by typing its URL. It is listed as "Content".
 *
 * `/admin/pages` ("Legacy"), `/admin/section/[key]` and `/admin/gallery` are
 * NO LONGER LISTED. They edit the `content` and `gallery_images` tables, which
 * feed the retired `app/(site)/` tree that `redirects()` in `next.config.mjs`
 * now 308s away — and in the gallery's case, a table no public page reads at
 * all. An operator could work in them all afternoon and change nothing a
 * visitor can see. The routes still resolve, because `app/not-found.jsx` still
 * reads the `content` table; they are simply not advertised. Deleting them is
 * W6.1.
 *
 * `/admin/translations` had the same problem and is now listed as "Wording":
 * it edits the 182 fixed strings — navigation labels, form labels, page
 * headings, the map legend — that used to be changeable only by a developer.
 * "Translations" was the wrong word for it, since most visits to that screen
 * are to change the English.
 *
 * "Search" is /admin/seo — per-page search settings (W1.7). Named for what the
 * operator is trying to do rather than "SEO", which is jargon for the one thing
 * most visits here are about: keeping a page out of search results.
 */
const NAV = [
  { href: '/admin', label: 'Dashboard' },
  { href: '/admin/pages-v2', label: 'Content' },
  { href: '/admin/news', label: 'News' },
  { href: '/admin/media', label: 'Media' },
  { href: '/admin/corridor', label: 'Corridor' },
  { href: '/admin/messages', label: 'Messages' },
  { href: '/admin/requests', label: 'Requests' },
  { href: '/admin/subscribers', label: 'Sign-ups' },
  { href: '/admin/menus', label: 'Navigation' },
  { href: '/admin/translations', label: 'Wording' },
  { href: '/admin/redirects', label: 'Redirects' },
  { href: '/admin/seo', label: 'Search' },
  { href: '/admin/settings', label: 'Settings' },
  { href: '/admin/users', label: 'Staff' },
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

        {/* Its own row, wrapping, on every screen size. Thirteen screens no
            longer fit beside the brand at 1280px, and a horizontally scrolling
            strip hides half of them on a phone. */}
        <nav aria-label="Admin" className="container mx-auto px-4 pb-2 flex flex-wrap gap-1">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className="px-3 py-1.5 rounded-md text-sm font-semibold text-blue-100 hover:bg-white/10 hover:text-white transition-all whitespace-nowrap"
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
