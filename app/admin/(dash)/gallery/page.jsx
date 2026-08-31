import { getGalleryImages } from '../../../../lib/gallery';
import { saveGalleryAction, deleteGalleryImageAction } from '../../actions';
import GalleryManager from '../../../../components/admin/GalleryManager';

export const dynamic = 'force-dynamic';

export default async function AdminGallery() {
  const images = await getGalleryImages();

  return (
    <div>
      <h1 className="text-2xl font-bold text-blue-900 mb-1">Gallery</h1>
      <p className="text-gray-600 mb-6">
        Upload, caption, reorder and remove the photos shown on{' '}
        <a href="/gallery" target="_blank" className="text-blue-900 font-semibold hover:underline">
          /gallery
        </a>
        . Lower “order” numbers appear first.
      </p>

      <GalleryManager
        images={images}
        saveAction={saveGalleryAction}
        deleteAction={deleteGalleryImageAction}
      />
    </div>
  );
}
