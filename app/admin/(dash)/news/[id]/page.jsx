import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getNewsPost } from '../../../../../lib/news';
import NewsForm from '../../../../../components/admin/NewsForm';

export const dynamic = 'force-dynamic';

export default async function AdminEditNewsPage({ params }) {
  const resolvedParams = await params;
  const post = await getNewsPost(resolvedParams.id);

  if (!post) {
    notFound();
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-blue-900">Edit News Article</h1>
        <p className="text-gray-600 mt-1">
          Update article metadata, content, links, or publication status.
        </p>
        <p className="mt-2 text-sm">
          {/* Without this link the translation screen is reachable only by typing
              its URL, and news_translations would stay empty however carefully
              it was built. */}
          <Link href={`/admin/news/${post.id}/translations`} className="text-blue-700 underline">
            Bangla and Chinese translations
          </Link>
        </p>
      </div>

      <NewsForm post={post} />
    </div>
  );
}
