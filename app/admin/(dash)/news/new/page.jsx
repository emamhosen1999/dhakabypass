import NewsForm from '../../../../../components/admin/NewsForm';
import { AdminPage } from '../../../../../components/admin/ui';

export const dynamic = 'force-dynamic';

export default function AdminNewNewsPage() {
  return (
    <AdminPage
      title="Add news article"
      intro={(
        <>
          <p className="text-gray-600 mt-1">
            Publish a new update, press release, or media coverage item.
          </p>
        </>
      )}
    >

      <NewsForm />
    </AdminPage>
  );
}
