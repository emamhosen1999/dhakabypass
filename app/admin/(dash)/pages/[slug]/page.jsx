import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import { getContent } from '../../../../../lib/content';
import { PAGE_SECTIONS, getPageSchema } from '../../../../../lib/admin-sections';
import { saveSectionAction } from '../../../actions';
import PageFieldsForm from '../../../../../components/admin/PageFieldsForm';

export const dynamic = 'force-dynamic';

export default async function PageEditor({ params }) {
  const { slug } = await params;
  const meta = PAGE_SECTIONS.find((p) => p.slug === slug);
  if (!meta) notFound();

  const [data, schema] = await Promise.all([
    getContent(meta.key),
    Promise.resolve(getPageSchema(slug)),
  ]);

  const livePath = '/' + meta.key.replace(/^page\./, '');

  return (
    <div>
      <Link
        href="/admin/pages"
        className="inline-flex items-center text-sm text-gray-500 hover:text-blue-900 mb-4"
      >
        <ArrowLeft className="w-4 h-4 mr-1" /> Pages
      </Link>

      <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-blue-900 mb-1">{meta.title}</h1>
          <p className="text-sm text-gray-500">
            {Object.keys(data || {}).length} editable fields
          </p>
        </div>
        <Link
          href={livePath}
          target="_blank"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-900 hover:text-blue-700"
        >
          View live page <ExternalLink className="w-4 h-4" />
        </Link>
      </div>

      <PageFieldsForm
        sectionKey={meta.key}
        data={data || {}}
        schema={schema}
        action={saveSectionAction}
      />
    </div>
  );
}
