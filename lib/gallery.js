import { query, dbEnabled } from './db';
import seed from '../content/gallery.json';

/**
 * Gallery images. Stored in the `gallery_images` table so the admin can
 * upload/reorder/caption/delete them; falls back to the 36 photos shipped in
 * /public/photo before the DB is provisioned.
 */
export async function getGalleryImages() {
  if (!dbEnabled()) return seed;
  try {
    const rows = await query(
      'SELECT id, file, caption, sort_order AS sort FROM gallery_images ORDER BY sort_order ASC, id ASC'
    );
    if (!rows || rows.length === 0) return seed;
    return rows;
  } catch {
    return seed;
  }
}

export const gallerySeed = seed;
