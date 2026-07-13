import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { getContent } from '../lib/content';

export const dynamic = 'force-dynamic';

export default async function NotFound() {
  const c = (await getContent('page.notFound')) || {};

  return (
    <div className="container mx-auto px-4 py-24 text-center">
      <div className="text-7xl md:text-9xl font-bold text-blue-900/15 mb-2">{c.code}</div>
      <h1 className="text-3xl md:text-4xl font-bold text-blue-900 mb-4 uppercase">
        {c.heading}
      </h1>
      <p className="text-gray-600 text-lg max-w-xl mx-auto mb-8">{c.text}</p>
      <Link
        href={c.ctaHref || '/'}
        className="inline-flex items-center justify-center bg-blue-900 hover:bg-blue-800 text-white px-6 py-3 rounded-md transition-all"
      >
        <ArrowLeft width={18} height={18} className="mr-2" />
        {c.ctaLabel}
      </Link>
    </div>
  );
}
