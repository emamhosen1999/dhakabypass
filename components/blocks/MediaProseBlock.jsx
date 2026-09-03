import Link from 'next/link';
import { localeHref } from '../../lib/blocks/href.js';
import SiteImage from '../SiteImage.jsx';
import { getMediaByPath } from '../../lib/media/repo.js';

export default async function MediaProseBlock({ data, locale }) {
  let media = null;
  if (data.image) {
    try { media = await getMediaByPath(data.image); } catch { media = null; }
  }
  // Anything that is not exactly 'left' is treated as 'right' so a typo in the
  // admin cannot produce an unstyled third state.
  const left = data.side === 'left';
  return (
    <section className={`db-block db-mediaprose${left ? ' db-mediaprose-left' : ''}`}>
      <div className="db-mediaprose-text">
        <h2 className="db-h2">{data.heading}</h2>
        {data.body ? (
          <div className="db-prose" dangerouslySetInnerHTML={{ __html: data.body }} />
        ) : null}
        {data.linkLabel && data.linkHref ? (
          <p className="db-actions">
            <Link href={localeHref(data.linkHref, locale)} className="db-btn db-btn-secondary">{data.linkLabel}</Link>
          </p>
        ) : null}
      </div>
      {/* db-figure-item, not db-figure: the inner div is the image box and
          already carries db-figure. Putting it on the figure element as well
          painted --db-surface-2 behind the caption, which is the darkest
          light-mode ground on the page and the one this caption's ink cleared
          by the smallest margin. It also left this block's caption styled
          differently from FigureGridBlock's, which wraps with db-figure-item. */}
      {media ? (
        <figure className="db-figure-item db-mediaprose-figure">
          <div className="db-figure db-ratio-photo">
            <SiteImage media={media} locale={locale} sizes="(max-width: 860px) 100vw, 46vw" />
          </div>
          {data.caption ? <figcaption>{data.caption}</figcaption> : null}
        </figure>
      ) : null}
    </section>
  );
}
