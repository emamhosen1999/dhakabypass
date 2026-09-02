import Link from 'next/link';
import SiteImage from '../SiteImage.jsx';
import { getMediaByPath } from '../../lib/media/repo.js';

export default async function FigureGridBlock({ data, locale }) {
  const items = Array.isArray(data.items) ? data.items : [];
  // One query per image, resolved together. A missing row yields a skipped
  // tile rather than a broken one — same principle as the corridor tables.
  const resolved = await Promise.all(items.map(async (it) => {
    if (!it || !it.image) return null;
    try { return { media: await getMediaByPath(it.image), caption: it.caption || '' }; }
    catch { return null; }
  }));
  const tiles = resolved.filter((r) => r && r.media);
  if (tiles.length === 0) return null;

  return (
    <section className="db-block">
      {data.heading ? <h2 className="db-h2">{data.heading}</h2> : null}
      {data.intro ? <p className="db-lede">{data.intro}</p> : null}
      <ul className="db-figuregrid">
        {tiles.map((tile, i) => (
          <li key={i}>
            <figure className="db-figure-item">
              <div className="db-figure db-ratio-photo">
                <SiteImage media={tile.media} locale={locale} sizes="(max-width: 700px) 50vw, 30vw" />
              </div>
              {tile.caption ? <figcaption>{tile.caption}</figcaption> : null}
            </figure>
          </li>
        ))}
      </ul>
      {data.linkLabel && data.linkHref ? (
        <p className="db-actions">
          <Link href={data.linkHref} className="db-btn db-btn-secondary">{data.linkLabel}</Link>
        </p>
      ) : null}
    </section>
  );
}
