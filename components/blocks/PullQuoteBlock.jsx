import { t } from '../../lib/i18n/ui.js';
const text = (v) => (typeof v === 'string' ? v.trim() : '');

/**
 * A set-apart quotation. <blockquote> with a <cite> in a <figcaption> is the
 * semantic shape assistive technology expects, and `cite` on the blockquote
 * carries the source URL where one is given. The quotation mark is drawn in
 * CSS, not typed, so it never appears twice and never in the wrong script.
 */
export default function PullQuoteBlock({ data }) {
  const quote = text(data?.quote);
  if (!quote) return null;
  const attribution = text(data?.attribution);
  const role = text(data?.role);
  const sourceHref = text(data?.sourceHref);

  return (
    <section className="db-block db-pullquote-block">
      <figure className="db-pullquote">
        <blockquote cite={sourceHref || undefined}>
          {/* Sanitised on save by lib/blocks/form.js — the single chokepoint. */}
          <div className="db-pullquote-text" dangerouslySetInnerHTML={{ __html: quote }} />
        </blockquote>
        {attribution || role ? (
          <figcaption className="db-pullquote-cite">
            {attribution ? <cite>{attribution}</cite> : null}
            {role ? <span className="db-pullquote-role">{role}</span> : null}
            {sourceHref ? <a className="db-pullquote-source" href={sourceHref}>{t(locale, 'quoteSource')} <span aria-hidden="true">↗</span></a> : null}
          </figcaption>
        ) : null}
      </figure>
    </section>
  );
}
