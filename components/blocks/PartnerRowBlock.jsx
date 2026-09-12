import Link from 'next/link';
import { getMediaByPath, mediaAlt } from '../../lib/media/repo.js';
import { localeHref } from '../../lib/blocks/href.js';

/**
 * The concession partners. A logo, when the partner has one in the media
 * library, sits above the name at a fixed height; the name and role are
 * always printed, so a reader with images off or a screen reader loses
 * nothing. The logo's alt is the library's description, or the name.
 */
export default async function PartnerRowBlock({ data, locale }) {
  const items = Array.isArray(data.items) ? data.items : [];
  if (items.length === 0) return null;

  const logos = await Promise.all(items.map(async (p) => {
    const path = p && typeof p.logo === 'string' ? p.logo.trim() : '';
    if (!path) return null;
    try { return await getMediaByPath(path); } catch { return null; }
  }));

  return (
    <section className="db-block">
      {data.heading ? <h2 className="db-h2">{data.heading}</h2> : null}
      {data.intro ? <p className="db-lede">{data.intro}</p> : null}
      <dl className="db-partners">
        {items.map((p, i) => {
          const media = logos[i];
          const name = p ? p.name : '';
          const href = p && typeof p.href === 'string' && p.href.trim() ? localeHref(p.href.trim(), locale) : '';
          return (
            <div key={i} className="db-partner">
              {media ? (
                <div className="db-partner-logo">
                  <img
                    src={media.path} alt={mediaAlt(media, locale) || name}
                    width={media.width || undefined} height={media.height || undefined}
                    loading="lazy" decoding="async"
                  />
                </div>
              ) : null}
              {/* dt precedes dd: the project's dl convention, set in Task 17 of
                  the foundations plan. Visual order is CSS's problem, not the DOM's. */}
              <dt className="db-partner-name">{href ? <Link href={href}>{name}</Link> : name}</dt>
              <dd className="db-partner-role">
                {p && p.role ? p.role : ''}
                {p && p.share ? <span className="db-partner-share">{p.share}</span> : null}
              </dd>
            </div>
          );
        })}
      </dl>
    </section>
  );
}
