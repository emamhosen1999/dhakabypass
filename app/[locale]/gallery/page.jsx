import { notFound } from 'next/navigation';
import { isLocale } from '../../../lib/i18n/locales.js';
import { t } from '../../../lib/i18n/ui.js';
import { alternatesFor } from '../../../lib/seo/alternates.js';
import { listGalleryCached } from '../../../lib/gallery/cache.js';

export async function generateMetadata({ params }) {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return {
    title: t(locale, 'galleryHeading'),
    description: t(locale, 'galleryIntro'),
    alternates: alternatesFor('/gallery', locale),
  };
}

/**
 * The gallery.
 *
 * Plain <img> rather than next/image. Nothing in this codebase imports
 * next/image today, and the deployment readiness review flags why that matters:
 * `sharp`'s native bindings are traced into the standalone artifact, so the
 * first component to touch the image optimiser makes the build platform-specific
 * — a Windows-built artifact would throw on the Linux host. The images are
 * already WebP and none is larger than 1024px, so the optimiser would have
 * little to do; taking on that constraint for it would be a poor trade.
 *
 * No lightbox. A modal needs focus trapping, an escape route, scroll locking and
 * a history entry to be usable with a keyboard or a screen reader, and every one
 * of those is a thing to get wrong. Each image links to itself instead, so the
 * browser's own viewer does the job — with pinch-zoom, back, and download all
 * working exactly as the reader already expects.
 */
export default async function GalleryPage({ params }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  let images = [];
  try {
    images = await listGalleryCached(locale, 60);
  } catch {
    // A dead database must not 500 a public page. The empty state below is the
    // same one an empty gallery gets, which is correct: both mean "nothing to
    // show", and only one of them is anybody's fault.
    images = [];
  }

  return (
    <>
      <section className="db-block">
        <p className="db-eyebrow">{t(locale, 'navGallery')}</p>
        <h1 className="db-h1">{t(locale, 'galleryHeading')}</h1>
        <p className="db-lede">{t(locale, 'galleryIntro')}</p>
      </section>

      <section className="db-block">
        {images.length === 0 ? (
          <p className="db-empty">{t(locale, 'galleryEmpty')}</p>
        ) : (
          <ul className="db-gallery">
            {images.map((img) => (
              <li key={img.id} className="db-gallery-item">
                <a href={img.path} className="db-gallery-link">
                  <img
                    src={img.path}
                    // An image with no alt text is announced by a screen reader
                    // as its filename, which is worse than being skipped. Empty
                    // alt marks it decorative and skips it; every row here does
                    // have localised alt, so this is the guard, not the norm.
                    alt={img.alt}
                    width={img.width || undefined}
                    height={img.height || undefined}
                    loading="lazy"
                    decoding="async"
                    className="db-gallery-img"
                  />
                </a>
                {img.alt ? <p className="db-gallery-caption">{img.alt}</p> : null}
                {img.credit ? <p className="db-gallery-credit">{img.credit}</p> : null}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="db-block">
        <p className="db-pending">
          <span className="db-pending-tag">{t(locale, 'pendingTag')}</span>
          {t(locale, 'galleryResolutionNote')}
        </p>
      </section>
    </>
  );
}
