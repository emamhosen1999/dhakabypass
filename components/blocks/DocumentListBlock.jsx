import { localeHref } from '../../lib/blocks/href.js';
import { listItems, text } from '../../lib/blocks/items.js';

/**
 * The downloads centre, and the body of every disclosure page.
 *
 * Format and size sit INSIDE the link. A screen-reader user listing the links
 * on a downloads page hears "Toll rate card, PDF, 240 KB" rather than four
 * identical "Toll rate card" links, and a reader on a metered connection in
 * Gazipur can see what a file will cost before tapping it.
 *
 * Both are authored strings rather than anything derived from the file: the
 * size has to be legible in Bangla and Chinese, and a byte count formatted in
 * code would be English-only units in the one place this site is required to
 * be Bangla-first.
 *
 * A plain <a>, not next/link: these targets are files under /uploads and
 * external gazette PDFs, never in-app routes.
 */
export default function DocumentListBlock({ data, locale }) {
  const documents = listItems(data.documents).filter((doc) => text(doc.title));
  if (documents.length === 0) return null;

  return (
    <section className="db-block">
      {data.heading ? <h2 className="db-h2">{data.heading}</h2> : null}
      {data.intro ? <p className="db-lede">{data.intro}</p> : null}
      <ul className="db-doclist">
        {documents.map((doc, i) => {
          const href = localeHref(text(doc.file), locale);
          const title = <span className="db-doc-title">{text(doc.title)}</span>;
          const meta = (
            <>
              {text(doc.fileType) ? <span className="db-doc-type">{text(doc.fileType)}</span> : null}
              {text(doc.fileSize) ? <span className="db-doc-size">{text(doc.fileSize)}</span> : null}
            </>
          );
          return (
            <li key={i} className="db-doc">
              {href ? (
                <a className="db-doc-link" href={href}>{title}{meta}</a>
              ) : (
                /* A document announced but not yet uploaded stays visible as
                   text. A link to nowhere is worse than a line that says the
                   paper exists and is not published yet. */
                <p className="db-doc-link db-doc-unlinked">{title}{meta}</p>
              )}
              {text(doc.description) ? <p className="db-doc-desc">{text(doc.description)}</p> : null}
              {text(doc.date) ? <p className="db-doc-date">{text(doc.date)}</p> : null}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
