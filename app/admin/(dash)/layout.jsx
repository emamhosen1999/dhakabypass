import Link from 'next/link';
import { Suspense } from 'react';
import AdminNotice from '../../../components/admin/AdminNotice';
import AdminFormGuard from '../../../components/admin/AdminFormGuard';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { auth, signOut } from '../../../auth';
import ThemeToggle from '../../../components/chrome/ThemeToggle.jsx';
import { can } from '../../../lib/auth/roles';
import AdminCurrentNav from '../../../components/admin/AdminCurrentNav';

export const dynamic = 'force-dynamic';

/**
 * `/admin/pages-v2` — the block builder for the localised site — was missing
 * from this list, so the screen that edits every page of the new site was
 * reachable only by typing its URL. It is listed as "Pages" (W1.29: named for
 * what the operator understands, not for how the code was rebuilt).
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
  { href: '/admin', label: 'Dashboard', can: null },
  { href: '/admin/pages-v2', label: 'Pages', can: 'translate' },
  { href: '/admin/news', label: 'News', can: 'translate' },
  { href: '/admin/media', label: 'Media', can: 'manage_media' },
  { href: '/admin/corridor', label: 'Corridor', can: 'edit_blocks' },
  { href: '/admin/messages', label: 'Messages', can: 'manage_users' },
  { href: '/admin/requests', label: 'Requests', can: 'manage_users' },
  { href: '/admin/subscribers', label: 'Sign-ups', can: 'manage_users' },
  { href: '/admin/alerts', label: 'Road alerts', can: 'manage_users' },
  { href: '/admin/menus', label: 'Navigation', can: 'manage_pages' },
  { href: '/admin/translations', label: 'Wording', can: 'translate' },
  { href: '/admin/translation-status', label: 'Translation status', can: 'translate' },
  { href: '/admin/redirects', label: 'Redirects', can: 'manage_pages' },
  { href: '/admin/seo', label: 'Search', can: 'manage_pages' },
  { href: '/admin/insights', label: 'How the site is doing', can: 'manage_users' },
  { href: '/admin/settings', label: 'Settings', can: 'manage_users' },
  { href: '/admin/users', label: 'Staff', can: 'manage_users' },
  { href: '/admin/trash', label: 'Trash', can: null },
  { href: '/admin/activity', label: 'Activity', can: 'manage_users' },
];

/**
 * Guarded admin chrome. Every route in this group requires an authenticated user
 * who is on the ADMIN_EMAILS allowlist — enforced here (server side) rather than
 * in middleware, which runs on the edge runtime where bcrypt/mysql can't.
 */
export default async function DashLayout({ children }) {
  const session = await auth();
  if (!session?.user?.isAdmin) redirect('/admin/login');

  // Present for thirty seconds after an action succeeded (lib/admin/run-action.js).
  const flashCookie = (await cookies()).get('admin_flash')?.value || '';
  const flashKey = flashCookie ? String(Date.now()) : '';
  let flash = null;
  if (flashCookie) {
    try { flash = flashCookie === '1' ? {} : JSON.parse(flashCookie); } catch { flash = {}; }
  }
  // Only the screens this role can use (audit R3): a translator was offered
  // fifteen links and bounced or shown an error by most of them.
  const nav = NAV.filter((n) => !n.can || can(session.user.role, n.can));
  return (
    <>
      <a href="#admin-main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-2 focus:z-50 focus:rounded focus:bg-white focus:px-3 focus:py-2 focus:text-blue-900">Skip to the page</a>
      <header className="bg-blue-900 text-white shadow-md">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-8 min-w-0">
            <Link href="/admin" className="flex items-center gap-2 font-bold shrink-0">
              {/* DBEDC's own emblem, the same file the public header uses. */}
              <img src="/brand/dbedc-mark.webp" alt="" width={43} height={34} className="db-brand-mark db-brand-mark-img" />
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
            {/* The public site's toggle: one choice, both surfaces. */}
            <ThemeToggle />
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
        {/* From md up the screens sit in a wrapping row; below it they fold
            into a Menu disclosure so a tablet or phone sees the page, not two
            screens of links (UI audit UI-ADM-05). The current screen carries
            aria-current (AdminCurrentNav). */}
        <nav aria-label="Admin" className="container mx-auto px-4 pb-2 hidden md:flex flex-wrap gap-1 db-admin-nav">
          {nav.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className="px-3 py-1.5 rounded-md text-sm font-semibold text-blue-100 hover:bg-white/10 hover:text-white aria-[current=page]:bg-white/15 aria-[current=page]:text-white transition-all whitespace-nowrap"
            >
              {n.label}
            </Link>
          ))}
        </nav>
        <details className="container mx-auto px-4 pb-2 md:hidden">
          <summary className="cursor-pointer py-2 text-sm font-semibold text-blue-100">Menu</summary>
          <nav aria-label="Admin" className="grid grid-cols-2 gap-1 pb-2 db-admin-nav">
            {nav.map((n) => (
              <Link key={n.href} href={n.href} className="px-3 py-2 rounded-md text-sm font-semibold text-blue-100 hover:bg-white/10 aria-[current=page]:bg-white/15 aria-[current=page]:text-white">
                {n.label}
              </Link>
            ))}
          </nav>
        </details>
        <AdminCurrentNav />
      </header>
      {/* useSearchParams needs a Suspense boundary above it in a layout. */}
      <Suspense fallback={null}><AdminNotice /></Suspense>
      {/* Confirm before deleting; "Saved." after an action finishes. */}
      <Suspense fallback={null}><AdminFormGuard key={flashKey} flash={flash} /></Suspense>

      <main id="admin-main" tabIndex={-1} className="container mx-auto px-4 py-8">{children}</main>
    </>
  );
}
