import Link from 'next/link';
import { t } from '../../lib/i18n/ui.js';
import { listGalleryCached, countGalleryCached } from '../../lib/gallery/cache.js';
import { pageOf, pageLinks } from '../../lib/blocks/paging.js';

const text = (v) => (typeof v === 'string' ? v.trim() : '');

/**
 * What /gallery rendered, paginated (INT.6). Plain <img>, because nothing in
 * this codebase imports next/image and the standalone artifact would need
 * the optimiser running on the shared host. The first four are eager - the
 * first row is above the fold and holds the LCP element; lazy-loading it
 * delays the largest paint by a round trip.
 *
 * Pages are `?page=N` links rendered on the server, so more than one page of
 * photographs is reachable with no JavaScript; each picture remains a native
 * link to its own file, the browser's viewer doing the zoom and the download.
 * `searchParams` is awaited only here, which is what makes THIS document
 * per-request and leaves every other one prerendered.
 */
export default async function GalleryGridBlock({ data, locale, searchParams }) {
  const perPage = Math.min(Math.max(Number(data?.limit) || 60, 1), 200);
  let search = null;
  try { search = searchParams ? await searchParams : null; } catch { search = null; }
  let total = 0;
  try { total = await countGalleryCached(); } catch { total = 0; }
  const page = pageOf(search?.page, total, perPage);

  let images = [];
  try {
    images = await listGalleryCached(locale, perPage, (page - 1) * perPage);
  } catch { images = []; }

  const heading = text(data?.heading);
  const intro = text(data?.intro);
  const empty = text(data?.emptyMessage) || t(locale, 'galleryEmpty');
  const links = pageLinks(page, total, perPage);

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
      {links.length > 1 ? (
        <nav className="db-paging" aria-label={t(locale, 'pagingLabel')}>
          <ol className="db-paging-list">
            {links.map((n) => (
              <li key={n}>
                {n === page
                  ? <span className="db-paging-current" aria-current="page">{n}</span>
                  : <Link href={n === 1 ? '?' : `?page=${n}`} className="db-paging-link">{n}</Link>}
              </li>
            ))}
          </ol>
        </nav>
      ) : null}
    </section>
  );
}
