import Link from 'next/link';
import { Plus, Edit2, Trash2, Globe, Calendar, ExternalLink } from 'lucide-react';
import { getNewsUpdates } from '../../../../lib/news';
import { deleteNewsAction } from '../../actions';

export const dynamic = 'force-dynamic';

function formatDate(dateStr) {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

export default async function AdminNewsPage() {
  const news = await getNewsUpdates(false);

  return (
    <div>
      <div className="flex items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-blue-900">News &amp; Updates</h1>
          <p className="text-gray-600 mt-1">
            Manage press releases, media coverage, and project milestones shown on{' '}
            <a
              href="/latest-updates"
              target="_blank"
              className="text-blue-900 font-semibold hover:underline"
            >
              /latest-updates
            </a>
            .
          </p>
        </div>
        <Link
          href="/admin/news/new"
          className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2.5 rounded-md font-semibold text-sm transition-all shrink-0"
        >
          <Plus className="w-4 h-4" />
          Add Article
        </Link>
      </div>

      {news.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <Globe className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No news articles found.</p>
          <Link
            href="/admin/news/new"
            className="inline-flex items-center gap-2 text-orange-500 font-semibold text-sm mt-3 hover:underline"
          >
            Create your first article
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-100 overflow-hidden shadow-sm">
          {news.map((item) => (
            <div
              key={item.id || item.slug}
              className="p-5 hover:bg-gray-50/70 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2.5 flex-wrap mb-1.5">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                    {item.category || 'Operations'}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                      item.is_published
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {item.is_published ? 'Published' : 'Draft'}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-gray-400">
                    <Calendar className="w-3.5 h-3.5" />
                    {formatDate(item.published_at)}
                  </span>
                  {item.source && (
                    <span className="text-xs text-gray-500 font-medium">
                      via {item.source}
                    </span>
                  )}
                </div>
                <h3 className="font-bold text-gray-900 text-base line-clamp-1">{item.title}</h3>
                <p className="text-sm text-gray-500 line-clamp-2 mt-1">{item.excerpt}</p>
              </div>

              <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                {item.url && (
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 text-gray-400 hover:text-blue-900 rounded-md hover:bg-gray-100 transition-all"
                    title="View Source Link"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
                <Link
                  href={`/admin/news/${item.id}`}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-100 text-sm font-semibold transition-all"
                >
                  <Edit2 className="w-3.5 h-3.5 text-blue-900" />
                  Edit
                </Link>
                <form action={deleteNewsAction}>
                  <input type="hidden" name="id" value={item.id} />
                  <button
                    type="submit"
                    aria-label="Delete article"
                    className="p-2 text-red-500 hover:text-red-700 rounded-md hover:bg-red-50 transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </form>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
