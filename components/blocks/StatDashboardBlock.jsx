import { localeHref } from '../../lib/blocks/href.js';
import { listItems, text } from '../../lib/blocks/items.js';

/**
 * Published statistics — traffic volumes, incident response times, revenue.
 *
 * Deliberately NOT stat-row. stat-row is decorative furniture for the home
 * page ("48 KM", "4 LANES") and carries no claim about when a number was
 * measured. This block publishes figures that a journalist, a lender or RHD
 * may quote, so it always states the date the figures are as at and where
 * they came from. That is why `asOf` is a required field: a figure with no
 * date is not a statistic, it is a boast, and the peer benchmark (B8, A8)
 * is explicit that monthly traffic disclosure is what separates an operator
 * from a brochure.
 *
 * The word "As at" is itself authored (`asOfLabel`) rather than assembled in
 * code — Bangla is authoritative for statutory content and no phrase a
 * visitor reads may originate in a JSX file.
 */
export default function StatDashboardBlock({ data, locale }) {
  const stats = listItems(data.stats).filter((s) => text(s.value) || text(s.label));
  if (stats.length === 0) return null;

  const sourceHref = localeHref(text(data.sourceHref), locale);
  const source = text(data.source);

  return (
    <section className="db-block db-dashboard">
      {data.heading ? <h2 className="db-h2">{data.heading}</h2> : null}
      {data.intro ? <p className="db-lede">{data.intro}</p> : null}
      <dl className="db-statrow-grid db-dashboard-grid">
        {stats.map((s, i) => (
          <div key={i} className="db-stat db-dashboard-stat">
            {/* dt before dd: the project's dl convention. Visual order is CSS's problem. */}
            <dt className="db-stat-label">{text(s.label)}</dt>
            <dd className="db-stat-value">
              {text(s.value)}
              {text(s.unit) ? <span className="db-stat-unit">{text(s.unit)}</span> : null}
              {text(s.note) ? <span className="db-dashboard-note">{text(s.note)}</span> : null}
            </dd>
          </div>
        ))}
      </dl>
      <p className="db-dashboard-prov">
        {text(data.asOfLabel) ? <span className="db-dashboard-aslabel">{text(data.asOfLabel)}</span> : null}
        {text(data.asOf) ? <span className="db-dashboard-asof">{text(data.asOf)}</span> : null}
        {source ? (
          sourceHref
            ? <a className="db-dashboard-source" href={sourceHref}>{source}</a>
            : <span className="db-dashboard-source">{source}</span>
        ) : null}
      </p>
    </section>
  );
}
