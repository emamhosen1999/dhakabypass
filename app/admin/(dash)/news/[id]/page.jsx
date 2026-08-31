import { notFound } from 'next/navigation';
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
      </div>

      <NewsForm post={post} />
    </div>
  );
}
