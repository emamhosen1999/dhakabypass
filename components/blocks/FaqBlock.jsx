import { listItems, text } from '../../lib/blocks/items.js';

/**
 * Questions and answers, built on <details>/<summary>.
 *
 * No script: <details> is operable with Enter and Space from the keyboard in
 * every browser this project supports, survives JavaScript failing to load,
 * and — the reason it beats a scripted accordion here — keeps every answer in
 * the document. A crawler indexes it, Ctrl+F finds it, and printing the page
 * prints the answers. An accordion that mounts its answer on click does none
 * of those things, and this block exists to hold statutory and toll-dispute
 * answers that people arrive at from a search engine.
 */
export default function FaqBlock({ data }) {
  const items = listItems(data.items).filter((item) => text(item.question));
  if (items.length === 0) return null;

  return (
    <section className="db-block">
      {data.heading ? <h2 className="db-h2">{data.heading}</h2> : null}
      {data.intro ? <p className="db-lede">{data.intro}</p> : null}
      <div className="db-faq">
        {items.map((item, i) => (
          <details key={i} className="db-faq-item">
            <summary className="db-faq-q">{text(item.question)}</summary>
            {text(item.answer) ? (
              /* Sanitised on save: lib/blocks/form.js runs every declared
                 `richtext` sub-field of a list row through the same
                 sanitizeHtml() as a top-level rich field. */
              <div className="db-prose db-faq-a" dangerouslySetInnerHTML={{ __html: item.answer }} />
            ) : null}
          </details>
        ))}
      </div>
    </section>
  );
}
