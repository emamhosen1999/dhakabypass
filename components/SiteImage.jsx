import { mediaAlt } from '../lib/media/repo.js';

/**
 * The only way an image reaches a page.
 *
 * width/height are always present so the browser reserves the box before the
 * bytes arrive — the legacy library is low-resolution and loads fast, which
 * makes an unreserved box shift the page under the reader.
 *
 * focal_x/focal_y drive object-position so a cropped hero keeps its subject.
 * alt="" is written explicitly for a decorative image: omitting alt makes a
 * screen reader read the filename instead.
 */
export default function SiteImage({ media, locale, sizes, className, priority = false, style }) {
  if (!media || !media.path) return null;
  const fx = Number(media.focal_x);
  const fy = Number(media.focal_y);
  const x = Number.isFinite(fx) ? Math.round(fx * 100) : 50;
  const y = Number.isFinite(fy) ? Math.round(fy * 100) : 50;
  return (
    <img
      src={media.path}
      alt={mediaAlt(media, locale)}
      width={media.width || undefined}
      height={media.height || undefined}
      sizes={sizes}
      className={className}
      loading={priority ? 'eager' : 'lazy'}
      decoding={priority ? 'sync' : 'async'}
      fetchPriority={priority ? 'high' : undefined}
      style={{ objectPosition: `${x}% ${y}%`, ...style }}
    />
  );
}
