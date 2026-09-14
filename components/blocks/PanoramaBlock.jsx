import { getMediaByPath, mediaAlt } from '../../lib/media/repo.js';
import { t } from '../../lib/i18n/ui.js';
import PanoramaViewer from './PanoramaViewer.jsx';

const text = (v) => (typeof v === 'string' ? v.trim() : '');

/**
 * A 360° view (W5.10): one panoramic photograph from the media library, with
 * its description as the accessible name. The caption says where it was taken.
 */
export default async function PanoramaBlock({ data = {}, locale }) {
  const path = text(data.image);
  if (!path) return null;
  let media = null;
  try { media = await getMediaByPath(path); } catch { media = null; }
  const alt = (media && mediaAlt(media, locale)) || text(data.caption) || text(data.heading);
  return (
    <section className="db-block db-pano-block">
      {text(data.heading) ? <h2 className="db-h2">{text(data.heading)}</h2> : null}
      {text(data.intro) ? <p className="db-lede">{text(data.intro)}</p> : null}
      <figure className="db-pano-figure">
        <PanoramaViewer src={path} alt={alt} autoRotate={data.autoRotate !== 'no'}
          labels={{ hint: t(locale, 'panoHint'), play: t(locale, 'panoPlay'), pause: t(locale, 'panoPause') }} />
        {text(data.caption) ? <figcaption>{text(data.caption)}</figcaption> : null}
      </figure>
    </section>
  );
}
