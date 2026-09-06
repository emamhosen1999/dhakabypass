import SiteImage from '../SiteImage.jsx';
import { getMediaByPath } from '../../lib/media/repo.js';
import { listItems, text } from '../../lib/blocks/items.js';

/**
 * Milestone completion, 0-100, or null for an entry that has none. Anything
 * outside the range is treated as unset rather than clamped: a bar drawn from
 * a typo is a claim about a construction programme.
 */
function percent(value) {
  if (value === '' || value === null || value === undefined) return null;
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 && n <= 100 ? n : null;
}

/**
 * The project chronology — concession signed, financial close, sections
 * opened. An <ol>, because a chronology has an order and a screen reader
 * should announce how many entries there are and which one it is on.
 *
 * The printed date is authored per locale, because a Bangla page must show a
 * Bangla date rather than an English one formatted by code. The optional
 * `datetime` is the machine-readable ISO value behind it, identical in all
 * three locales, so <time> carries something a parser can use without forcing
 * the translator to encode it.
 */
export default async function TimelineBlock({ data, locale }) {
  const items = listItems(data.items).filter((item) => text(item.date) || text(item.title));
  if (items.length === 0) return null;

  const images = await Promise.all(items.map(async (item) => {
    if (!text(item.image)) return null;
    try { return await getMediaByPath(item.image); } catch { return null; }
  }));

  return (
    <section className="db-block">
      {data.heading ? <h2 className="db-h2">{data.heading}</h2> : null}
      {data.intro ? <p className="db-lede">{data.intro}</p> : null}
      <ol className="db-timeline">
        {items.map((item, i) => (
          <li key={i} className="db-timeline-item">
            {text(item.date) ? (
              <p className="db-timeline-date">
                {text(item.datetime)
                  /* Lower-case `datetime` on purpose. React 19 writes a
                     host attribute under the prop name it was given, so
                     `dateTime` reaches the page as dateTime="…" — valid,
                     because HTML attribute names are case-insensitive, but
                     not the name the spec uses and not what a reader of the
                     source or a byte-level test expects. */
                  ? <time datetime={text(item.datetime)}>{text(item.date)}</time>
                  : text(item.date)}
              </p>
            ) : null}
            {text(item.title) ? <h3 className="db-timeline-title">{text(item.title)}</h3> : null}
            {images[i] ? (
              <div className="db-figure db-ratio-photo db-timeline-figure">
                <SiteImage media={images[i]} locale={locale} sizes="(max-width: 700px) 100vw, 40vw" />
              </div>
            ) : null}
            {text(item.description) ? (
              /* Description HTML is sanitised on save — lib/blocks/form.js
                 runs the declared `richtext` sub-fields of every list row
                 through the same sanitizeHtml() as a top-level rich field. */
              <div className="db-prose db-timeline-body" dangerouslySetInnerHTML={{ __html: item.description }} />
            ) : null}
            {percent(item.progress) !== null ? (
              /* A milestone under construction. The bar carries its own value
                 through role="progressbar" — a screen reader announces the
                 percentage — and it is named by the milestone the operator
                 authored, so no word here originates in this file. */
              <div
                className="db-timeline-progress db-progress-rail"
                role="progressbar"
                aria-valuenow={percent(item.progress)}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={text(item.title) || undefined}
              >
                <span className="db-progress-fill" style={{ width: `${percent(item.progress)}%` }} />
              </div>
            ) : null}
          </li>
        ))}
      </ol>
    </section>
  );
}
