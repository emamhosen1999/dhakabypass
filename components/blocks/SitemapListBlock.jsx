import Link from 'next/link';
import { listSiteIndexCached } from '../../lib/content/site-index.js';
import { groupSiteIndex } from '../../lib/blocks/sitemapList.js';
import { t } from '../../lib/i18n/ui.js';

const text = (v) => (typeof v === 'string' ? v.trim() : '');

/**
 * Every published page as a link. A LIVE-DATA BLOCK: the list is the `pages`
 * table in the operator's nav order, so it can never point at a page that
 * no longer exists.
 */
export default async function SitemapListBlock({ data, locale }) {
  let pages = [];
  try { pages = await listSiteIndexCached(locale); } catch { pages = []; }

  const heading = text(data?.heading);
  const intro = text(data?.intro);
  // A parentless section (`travel/*` with no `travel` page) is headed by the
  // navigation string of the same name when one exists — navTravel — so the
  // heading is translated. Anything else falls back to the humanised slug.
  const labelFor = (segment) => {
    const key = `nav${segment.charAt(0).toUpperCase()}${segment.slice(1).replace(/-(\w)/g, (_, c) => c.toUpperCase())}`;
    const v = t(locale, key);
    return v === key ? '' : v;
  };
  const groups = groupSiteIndex(pages, data?.group !== 'flat', labelFor);

  return (
    <section className="db-block db-sitemap">
      {heading ? <h2 className="db-h2">{heading}</h2> : null}
      {intro ? <p className="db-lede">{intro}</p> : null}
      {groups.length === 0 ? (
        <p className="db-empty-inline">{t(locale, 'sitemapEmpty')}</p>
      ) : (
        <div className="db-sitemap-groups">
          {groups.map((g) => (
            <div key={g.key} className="db-sitemap-group">
              {g.heading ? (
                g.href
                  ? <h3 className="db-h3"><Link href={g.href}>{g.heading}</Link></h3>
                  : <h3 className="db-h3">{g.heading}</h3>
              ) : null}
              <ul className="db-sitemap-list">
                {g.links.map((l) => (
                  <li key={l.href}><Link href={l.href}>{l.title}</Link></li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
