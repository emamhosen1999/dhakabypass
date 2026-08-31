import Link from 'next/link';
import { getAllContent } from '../../../../lib/content';
import { PAGE_SECTIONS } from '../../../../lib/admin-sections';

export const dynamic = 'force-dynamic';

export default async function PagesIndex() {
  const content = await getAllContent();

  return (
    <div>
      <h1 className="text-2xl font-bold text-blue-900 mb-1">Pages</h1>
      <p className="text-gray-600 mb-6">
        Edit the copy and imagery of each page. Fields are grouped by the section they
        appear in on the live page.
      </p>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {PAGE_SECTIONS.map((p) => {
          const n = Object.keys(content[p.key] || {}).length;
          return (
            <Link
              key={p.key}
              href={`/admin/pages/${p.slug}`}
              className="bg-white rounded-lg border border-gray-200 p-5 hover:border-orange-400 hover:shadow-sm transition-all"
            >
              <div className="font-semibold text-gray-800">{p.title}</div>
              <div className="text-xs text-gray-400 mt-1">{n} editable fields</div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
