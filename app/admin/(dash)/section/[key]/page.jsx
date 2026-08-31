import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { getContent } from '../../../../../lib/content';
import { SITE_SECTIONS } from '../../../../../lib/admin-sections';
import { saveSectionAction } from '../../../actions';
import SectionForm from '../../../../../components/admin/SectionForm';

export const dynamic = 'force-dynamic';

export default async function SectionEditor({ params }) {
  const { key } = await params;
  const sectionKey = decodeURIComponent(key);

  const meta = SITE_SECTIONS.find((s) => s.key === sectionKey);
  if (!meta) notFound();

  const data = await getContent(sectionKey);

  return (
    <div>
      <Link
        href="/admin"
        className="inline-flex items-center text-sm text-gray-500 hover:text-blue-900 mb-4"
      >
        <ArrowLeft className="w-4 h-4 mr-1" /> Dashboard
      </Link>

      <h1 className="text-2xl font-bold text-blue-900 mb-1">{meta.title}</h1>
      <p className="text-sm text-gray-500 mb-6">{sectionKey}</p>

      <SectionForm sectionKey={sectionKey} data={data} action={saveSectionAction} />
    </div>
  );
}
