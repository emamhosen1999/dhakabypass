import { getMediaByPath } from '../../lib/media/repo.js';
import SiteImage from '../SiteImage.jsx';

/**
 * Cards. `items[].image` is an optional picture above the title (audit 3.1:
 * the field was declared and offered in the editor, and never rendered). A
 * path with no media row is skipped rather than rendered broken.
 */
export default async function CardGridBlock({ data, locale }) {
  const items = Array.isArray(data.items) ? data.items : [];
  if (items.length === 0) return null;
  const media = await Promise.all(items.map(async (c) => {
    const path = c && typeof c.image === 'string' ? c.image.trim() : '';
    if (!path) return null;
    try { return await getMediaByPath(path); } catch { return null; }
  }));
  return (
    <section className="db-block">
      {data.heading ? <h2 className="db-h2">{data.heading}</h2> : null}
      {data.intro ? <p className="db-lede">{data.intro}</p> : null}
      <ul className="db-cardgrid">
        {items.map((c, i) => (
          <li key={i} className={`db-card${media[i] ? ' db-card-hasimage' : ''}`}>
            {media[i] ? (
              <div className="db-card-image">
                <SiteImage media={media[i]} locale={locale} sizes="(max-width: 700px) 100vw, 30vw" />
              </div>
            ) : null}
            {c && c.meta ? <p className="db-card-meta">{c.meta}</p> : null}
            <h3 className="db-card-title">{c ? c.title : ''}</h3>
            {c && c.body ? <p className="db-card-body">{c.body}</p> : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
