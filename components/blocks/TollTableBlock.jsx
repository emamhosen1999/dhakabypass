import { getTollRatesCached } from '../../lib/corridor/cache';
import { formatTaka, classLabel } from '../../lib/corridor/tolls';
import { selectRates, hasSectionColumn, tollCitation } from '../../lib/blocks/tollTable.js';
import { text } from '../../lib/blocks/items.js';
import { t } from '../../lib/i18n/ui';

/**
 * The full toll schedule — a HYBRID block, and the clearest example of why
 * that category exists.
 *
 * THE AMOUNTS ARE NEVER AUTHORED HERE. Every rate is read live from
 * `toll_rates` through the cached reader, so this table, the home page's
 * `toll-preview` and /travel/toll cannot disagree about what a car pays. The
 * block owns presentation only: which section, what order, what the heading
 * says.
 *
 * THE GAZETTE CITATION *IS* AUTHORED HERE, and that is deliberate. Tolls on
 * this corridor are fixed by government gazette notification, and a published
 * rate without its S.R.O. number is a rumour — a legal-accuracy problem, not a
 * missing nicety. Putting the citation on the block that renders the rates is
 * what stops the two drifting: they are one record in the admin, saved
 * together, translated together, and rendered inside one <figure> so a reader
 * (and a screen reader) meets the schedule and its authority as one thing
 * rather than a table and a footnote that may or may not still refer to it.
 *
 * classLabel and formatTaka are shared with /travel/toll and the home page's
 * preview on purpose: a vehicle's published name and the way an amount is
 * written are per-row data, and a second copy of either fallback chain would
 * eventually name the same rate differently on two pages of the same site.
 */
export default async function TollTableBlock({ data, locale }) {
  // A dead query must not produce a stack trace in a browser. rates = []
  // falls through to the authored empty message below — the same shape, and
  // for the same reason, as the page this block replaces.
  let rates = [];
  try { rates = await getTollRatesCached(); } catch { rates = []; }

  const rows = selectRates(rates, data);
  const heading = text(data.heading);
  const intro = text(data.intro);
  const caption = text(data.caption) || t(locale, 'tollCaption');
  const citation = tollCitation(data);
  const withSection = hasSectionColumn(rows);

  const table = (
    <div className="db-scroll-x db-datatable db-tolltable">
      <table className="db-table">
        {/* A real <caption>, always: a screen reader announces what the
            schedule IS before reading a column of prices out of it. */}
        <caption className="db-table-caption">{caption}</caption>
        <thead>
          <tr>
            <th scope="col">{t(locale, 'colVehicle')}</th>
            {withSection ? <th scope="col">{t(locale, 'colSection')}</th> : null}
            <th scope="col" className="db-num">{t(locale, 'colToll')}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id ?? r.vehicle_class}>
              {/* scope="row": a price read out of sequence still carries the
                  vehicle it belongs to, rather than being a bare number. */}
              <th scope="row">{classLabel(r, locale)}</th>
              {withSection ? <td>{text(r.section) || '—'}</td> : null}
              <td className="db-num db-toll-amount">{formatTaka(r.amount_bdt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <section className="db-block">
      {heading ? <h2 className="db-h2">{heading}</h2> : null}
      {intro ? <p className="db-lede">{intro}</p> : null}

      {rows.length === 0 ? (
        /* Never a blank hole. No rows, a mistyped section filter and a
           database that will not answer all land here, and all three say so
           in the operator's own words, falling back to the editable
           `noTollRates` string when none has been authored. */
        <p className="db-empty-inline">{text(data.emptyMessage) || t(locale, 'noTollRates')}</p>
      ) : citation ? (
        /* <figure> is what binds the schedule to its authority: the figcaption
           names the figure, so entering the group announces the notification
           the prices come from. A <p> after the table would be a footnote a
           reader can miss and an editor can leave behind. */
        <figure className="db-tollschedule">
          {table}
          <figcaption className="db-table-note db-toll-provenance">
            {citation.number ? (
              citation.href ? (
                /* The S.R.O. number IS the link text. A link labelled with the
                   URL, or with a generic word, is a link a screen-reader user
                   listing the page's links cannot tell from any other. A plain
                   <a>: these targets are gazette PDFs, never in-app routes. */
                <a className="db-toll-sro" href={citation.href}>{citation.number}</a>
              ) : <span className="db-toll-sro">{citation.number}</span>
            ) : null}
            {citation.date ? <span className="db-toll-srodate">{citation.date}</span> : null}
            {citation.mechanism ? <span className="db-toll-revision">{citation.mechanism}</span> : null}
          </figcaption>
        </figure>
      ) : table}
    </section>
  );
}
