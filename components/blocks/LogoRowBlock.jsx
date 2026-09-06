import { localeHref } from '../../lib/blocks/href.js';
import { listItems, text } from '../../lib/blocks/items.js';

/**
 * Partner and stakeholder marks — RHD, UDC, SDIG/SRBG, DBEDC.
 *
 * Every mark sits on .db-logo-tile, which is a FIXED light panel in both
 * themes and never inherits --db-surface. Two measured reasons, from UI-8:
 * the SDIG/SRBG raster carries a hard white panel that shows as a bright
 * rectangle on any dark ground, and the DBEDC blue measures 3.06:1 against
 * the dark plate, where the wordmark all but disappears. Neither is fixable
 * by a colour choice on our side, because these are other companies' brands
 * and we hold them only as raster.
 *
 * The tile also reserves its own height, so a mark with no intrinsic
 * dimensions in the media table cannot shift the page as it loads. These
 * files live in public/brand and are not media-library rows, which is why
 * this is a plain <img> rather than SiteImage.
 *
 * The alt text is the authored partner name, per locale — it is the mark's
 * accessible name, so it must not be blank and must not be a filename.
 */
export default function LogoRowBlock({ data, locale }) {
  const items = listItems(data.items).filter((item) => text(item.logo));
  if (items.length === 0) return null;

  return (
    <section className="db-block">
      {data.heading ? <h2 className="db-h2">{data.heading}</h2> : null}
      {data.intro ? <p className="db-lede">{data.intro}</p> : null}
      <ul className="db-logorow">
        {items.map((item, i) => {
          const name = text(item.name);
          const href = localeHref(text(item.href), locale);
          const mark = (
            <span className="db-logo-tile">
              <img src={text(item.logo)} alt={name} loading="lazy" decoding="async" />
            </span>
          );
          return (
            <li key={i} className="db-logo-item">
              {href ? <a className="db-logo-link" href={href}>{mark}</a> : mark}
              {text(item.role) ? <p className="db-logo-role">{text(item.role)}</p> : null}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
