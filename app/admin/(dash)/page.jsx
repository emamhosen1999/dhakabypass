import Link from 'next/link';
import { FileText, Image as ImageIcon, Mail, LayoutGrid, Newspaper } from 'lucide-react';
import { getAllContent } from '../../../lib/content';
import { getGalleryImages } from '../../../lib/gallery';
import { getNewsUpdates } from '../../../lib/news';
import { query, dbEnabled } from '../../../lib/db';
import { SITE_SECTIONS, PAGE_SECTIONS } from '../../../lib/admin-sections';

export const dynamic = 'force-dynamic';

async function messageCount() {
  if (!dbEnabled()) return 0;
  try {
    const rows = await query('SELECT COUNT(*) AS c FROM contact_messages WHERE read_at IS NULL');
    return rows?.[0]?.c ?? 0;
  } catch {
    return 0;
  }
}

export default async function AdminDashboard() {
  const [content, images, unread, news] = await Promise.all([
    getAllContent(),
    getGalleryImages(),
    messageCount(),
    getNewsUpdates(false),
  ]);

  const fieldCount = Object.values(content).reduce(
    (sum, v) => sum + (v && typeof v === 'object' ? Object.keys(v).length : 0),
    0
  );

  const stats = [
    { icon: LayoutGrid, label: 'Editable sections', value: Object.keys(content).length },
    { icon: FileText, label: 'Editable fields', value: fieldCount },
    { icon: Newspaper, label: 'News articles', value: news.length, href: '/admin/news' },
    { icon: ImageIcon, label: 'Gallery photos', value: images.length, href: '/admin/gallery' },
    { icon: Mail, label: 'Unread messages', value: unread, href: '/admin/messages' },
  ];

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-bold text-blue-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">
          Every heading, paragraph, statistic, news article, and image on the site is editable here.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {stats.map((s) => {
          const Card = (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 h-full hover:border-orange-400 hover:shadow transition-all">
              <s.icon className="w-6 h-6 text-orange-500 mb-3" />
              <div className="text-2xl font-bold text-blue-900">{s.value}</div>
              <div className="text-sm text-gray-500 mt-0.5">{s.label}</div>
            </div>
          );
          return s.href ? (
            <Link key={s.label} href={s.href}>
              {Card}
            </Link>
          ) : (
            <div key={s.label}>{Card}</div>
          );
        })}
      </div>

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-blue-900">Dynamic Content Hubs</h2>
        </div>
        <div className="grid sm:grid-cols-3 gap-3">
          <Link
            href="/admin/news"
            className="bg-white rounded-lg border border-gray-200 p-5 hover:border-orange-400 hover:shadow-sm transition-all"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-gray-800">News &amp; Updates</span>
              <Newspaper className="w-5 h-5 text-orange-500" />
            </div>
            <p className="text-xs text-gray-500">Manage press releases, media coverage, and post articles.</p>
          </Link>
          <Link
            href="/admin/gallery"
            className="bg-white rounded-lg border border-gray-200 p-5 hover:border-orange-400 hover:shadow-sm transition-all"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-gray-800">Photo Gallery</span>
              <ImageIcon className="w-5 h-5 text-orange-500" />
            </div>
            <p className="text-xs text-gray-500">Upload, caption, reorder, and remove project images.</p>
          </Link>
          <Link
            href="/admin/messages"
            className="bg-white rounded-lg border border-gray-200 p-5 hover:border-orange-400 hover:shadow-sm transition-all"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-gray-800">Contact Messages</span>
              <Mail className="w-5 h-5 text-orange-500" />
            </div>
            <p className="text-xs text-gray-500">View inquiries received through the public contact form.</p>
          </Link>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-bold text-blue-900 mb-3">Site &amp; Home Sections</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {SITE_SECTIONS.map((s) => (
            <Link
              key={s.key}
              href={`/admin/section/${encodeURIComponent(s.key)}`}
              className="bg-white rounded-lg border border-gray-200 p-4 hover:border-orange-400 hover:shadow-sm transition-all"
            >
              <div className="font-semibold text-gray-800">{s.title}</div>
              <div className="text-xs text-gray-400 mt-1">{s.key}</div>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-bold text-blue-900 mb-3">Static Pages Copy</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {PAGE_SECTIONS.map((p) => {
            const n = Object.keys(content[p.key] || {}).length;
            return (
              <Link
                key={p.key}
                href={`/admin/pages/${p.slug}`}
                className="bg-white rounded-lg border border-gray-200 p-4 hover:border-orange-400 hover:shadow-sm transition-all"
              >
                <div className="font-semibold text-gray-800">{p.title}</div>
                <div className="text-xs text-gray-400 mt-1">{n} editable fields</div>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
