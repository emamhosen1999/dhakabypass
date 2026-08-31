import NewsForm from '../../../../../components/admin/NewsForm';

export const dynamic = 'force-dynamic';

export default function AdminNewNewsPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-blue-900">Add News Article</h1>
        <p className="text-gray-600 mt-1">
          Publish a new update, press release, or media coverage item.
        </p>
      </div>

      <NewsForm />
    </div>
  );
}
