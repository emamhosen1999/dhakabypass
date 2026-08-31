import GalleryGrid from '../../../components/GalleryGrid';
import { getGalleryImages } from '../../../lib/gallery';
import { getContent } from '../../../lib/content';

export const dynamic = 'force-dynamic';

export async function generateMetadata() {
  const c = await getContent('page.gallery');
  return { title: `${c?.heading || 'Project Gallery'} - Dhaka Bypass Expressway` };
}

export default async function GalleryPage() {
  const [c, images] = await Promise.all([
    getContent('page.gallery'),
    getGalleryImages(),
  ]);

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-blue-900 mb-6">{c.heading}</h1>
      <p className="text-gray-700 mb-8">{c.intro}</p>
      <GalleryGrid images={images} />
    </div>
  );
}
