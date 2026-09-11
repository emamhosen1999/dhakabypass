import { t } from '../../lib/i18n/ui.js';
import { listGalleryCached } from '../../lib/gallery/cache.js';

const text = (v) => (typeof v === 'string' ? v.trim() : '');

/**
 * What /gallery rendered. Plain <img>, because nothing in this codebase
 * imports next/image and the standalone artifact would need the optimiser
 * running on the shared host. The first four are eager - the first row is
 * above the fold and holds the LCP element; lazy-loading it delays the largest
 * paint by a round trip.
 */
export default async function GalleryGridBlock({ data, locale }) {
  const limit = Math.min(Math.max(Number(data?.limit) || 60, 1), 200);
  let images = [];
  try {
    images = await listGalleryCached(locale, limit);
  } catch { images = []; }

  const heading = text(data?.heading);
  const intro = text(data?.intro);
  const empty = text(data?.emptyMessage) || t(locale, 'galleryEmpty');

  return (
    <section className="db-block db-gallery-block">
      {heading ? <h2 className="db-h2">{heading}</h2> : null}
      {intro ? <p className="db-lede">{intro}</p> : null}
      {images.length === 0 ? (
        <p className="db-empty">{empty}</p>
      ) : (
        <ul className="db-gallery">
          {images.map((img, i) => (
            <li key={img.id} className="db-gallery-item">
              <a href={img.path} className="db-gallery-link">
                <img
                  src={img.path}
                  alt={img.alt}
                  width={img.width || undefined}
                  height={img.height || undefined}
                  loading={i < 4 ? 'eager' : 'lazy'}
                  fetchPriority={i === 0 ? 'high' : undefined}
                  decoding="async"
                />
              </a>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
