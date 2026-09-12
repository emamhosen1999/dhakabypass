import Link from 'next/link';
import { FileText, Image as ImageIcon, Mail, LayoutGrid, Newspaper, Map, Type, ClipboardList } from 'lucide-react';
import { listPages } from '../../../lib/content/pages';
import { listMedia } from '../../../lib/media/repo';
import { getNewsUpdates } from '../../../lib/news';
import { query, dbEnabled } from '../../../lib/db';

export const dynamic = 'force-dynamic';

/**
 * This screen used to describe a website that no longer exists.
 *
 * Its counters read `content` and `gallery_images`, and its two big grids
 * linked into `/admin/section/*` and `/admin/pages/*` — all of which edit the
 * retired `app/(site)/` tree that `next.config.mjs` now 308s away. An operator
 * could spend an afternoon in "Static Pages Copy" and change nothing a visitor
 * can reach. `gallery_images` is worse: no public page reads that table at all.
 *
 * Under it sat the claim "Every heading, paragraph, statistic, news article,
 * and image on the site is editable here", which was false in both directions —
 * it over-promised on what this screen reached, and under-sold the block editor
 * that actually does edit every page.
 *
 * So the counters now count what is live, and every card goes somewhere a
 * change shows up on the public site. The legacy screens still exist at their
 * URLs, because `app/not-found.jsx` still reads the `content` table; they are
 * simply no longer advertised. Deleting them is W6.1.
 */
async function countRows(sql) {
  if (!dbEnabled()) return 0;
  try {
    const rows = await query(sql);
    return rows?.[0]?.c ?? 0;
  } catch {
    return 0;
  }
}

export default async function AdminDashboard() {
  const [pages, media, unread, news, blocks, openRequests] = await Promise.all([
    listPages().catch(() => []),
    listMedia().catch(() => []),
    countRows('SELECT COUNT(*) AS c FROM contact_messages WHERE read_at IS NULL'),
    getNewsUpdates(false).catch(() => []),
    countRows('SELECT COUNT(*) AS c FROM blocks'),
    countRows("SELECT COUNT(*) AS c FROM service_requests WHERE status IN ('new','in_progress')"),
  ]);

  const stats = [
    { icon: LayoutGrid, label: 'Pages', value: pages.length, href: '/admin/pages-v2' },
    { icon: FileText, label: 'Blocks placed', value: blocks, href: '/admin/pages-v2' },
    { icon: ImageIcon, label: 'Images', value: media.length, href: '/admin/media' },
    { icon: Newspaper, label: 'News articles', value: news.length, href: '/admin/news' },
    { icon: Mail, label: 'Unread messages', value: unread, href: '/admin/messages' },
    { icon: ClipboardList, label: 'Open service requests', value: openRequests, href: '/admin/requests' },
  ];

  const hubs = [
    {
      href: '/admin/pages-v2',
      title: 'Pages and blocks',
      icon: LayoutGrid,
      body: 'Build any page from blocks, edit it in English, Bangla and Chinese, and preview it before publishing.',
    },
    {
      href: '/admin/corridor',
      title: 'Corridor',
      icon: Map,
      body: 'Sections, segments, interchanges, waypoints, toll rates and advisories. Change a fact here and every page showing it updates.',
    },
    {
      href: '/admin/news',
      title: 'News and updates',
      icon: Newspaper,
      body: 'Press releases, media coverage and project updates, with translations.',
    },
    {
      href: '/admin/media',
      title: 'Images',
      icon: ImageIcon,
      body: 'Upload and replace photographs, and describe them for readers using a screen reader.',
    },
    {
      href: '/admin/translations',
      title: 'Wording',
      icon: Type,
      body: 'Navigation labels, form labels, page headings and the map legend — the fixed strings around your content.',
    },
    {
      href: '/admin/messages',
      title: 'Contact messages',
      icon: Mail,
      body: 'Enquiries received through the public contact form.',
    },
    {
      href: '/admin/requests',
      title: 'Service requests',
      icon: ClipboardList,
      body: 'Grievances, toll disputes, breakdown calls and lost & found reports, each with a tracking number and a deadline.',
    },
  ];

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-bold text-blue-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">
          Pages are built from blocks and edited in three languages. Facts that appear in more than
          one place — toll rates, interchanges, section status — are edited once under Corridor.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {stats.map((s) => (
          <Link key={s.label} href={s.href}>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 h-full hover:border-orange-400 hover:shadow transition-all">
              <s.icon className="w-6 h-6 text-orange-500 mb-3" />
              <div className="text-2xl font-bold text-blue-900 tabular-nums">{s.value}</div>
              <div className="text-sm text-gray-500 mt-0.5">{s.label}</div>
            </div>
          </Link>
        ))}
      </div>

      <section>
        <h2 className="text-lg font-bold text-blue-900 mb-3">Where things are edited</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {hubs.map((h) => (
            <Link
              key={h.href}
              href={h.href}
              className="bg-white rounded-lg border border-gray-200 p-5 hover:border-orange-400 hover:shadow-sm transition-all"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-gray-800">{h.title}</span>
                <h.icon className="w-5 h-5 text-orange-500" />
              </div>
              <p className="text-xs text-gray-500">{h.body}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
