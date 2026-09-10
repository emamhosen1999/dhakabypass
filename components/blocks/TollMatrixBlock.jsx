import { getTollMatrixCached, getInterchangesCached } from '../../lib/corridor/cache';
import { formatTaka, classLabel } from '../../lib/corridor/tolls';
import { localeName } from '../../lib/corridor/interchanges';
import { formatKm } from '../../lib/corridor/chainage';
import { buildMatrix, hasCitation } from '../../lib/corridor/toll-matrix';
import { text } from '../../lib/blocks/items.js';
import { t } from '../../lib/i18n/ui';
import IllustrativeNotice from '../corridor/IllustrativeNotice';

/**
 * The origin–destination fare matrix: what a driver pays entering at one toll
 * plaza and leaving at another.
 *
 * ---------------------------------------------------------------------------
 * THE PROVISIONAL NOTICE IS THE POINT OF THIS COMPONENT
 * ---------------------------------------------------------------------------
 * `toll_od_rates` ships seeded with fares COMPUTED from DBEDC's own published
 * formula, so INT.2's calculator has a matrix to be built against. A computed
 * fare shown as though it were the gazetted charge is worse than showing
 * nothing: a driver budgets ৳260 and is charged ৳400 at the plaza.
 *
 * So the notice is not a sentence an operator authored and could delete. It is
 * driven by `is_provisional` — a STORED GENERATED column over `sro_number`
 * that no UPDATE can write — read straight off each row. There is no block
 * field that reaches it, no `if (data.…)` guarding it, and it disappears
 * only when EVERY fare on screen carries the S.R.O. citation that makes it
 * authoritative. `isProvisional()` fails towards the warning, so a row this
 * component cannot positively confirm is treated as provisional.
 *
 * `aria-describedby` binds the notice to the table itself. A banner above a
 * grid of prices is easy to scroll past and easy for a screen reader to leave
 * behind; described by the table, it is announced on entering the prices,
 * before a single one of them is read out.
 *
 * ---------------------------------------------------------------------------
 * NO NEW VISITOR-FACING COPY
 * ---------------------------------------------------------------------------
 * The row and column headers are the plazas' own names from `interchanges` —
 * data, in the reader's language, not chrome. The heading, intro, caption and
 * empty message are authored block fields. Everything else reuses strings that
 * already exist in all three locales: `provisional`, `provisionalBody`,
 * `tollCaption`, `noTollRates`, `mapKm`. Nothing was added to lib/i18n/ui.js,
 * which since W1.6 is fallback-only.
 *
 * ---------------------------------------------------------------------------
 * THIS BLOCK DISPLAYS. IT DOES NOT CALCULATE.
 * ---------------------------------------------------------------------------
 * The interactive origin/destination picker is INT.2. What is here is the
 * server-rendered table that picker will be an enhancement over — the house
 * pattern the corridor map, TabsBlock and FaqBlock all follow: the fare must
 * not depend on a bundle loading.
 */
export default async function TollMatrixBlock({ data, locale }) {
  // A dead query must not produce a stack trace in a browser. Both readers
  // fall through to the authored empty message, exactly as TollTableBlock does.
  let rates = [];
  let points = [];
  try {
    [rates, points] = await Promise.all([getTollMatrixCached(), getInterchangesCached()]);
  } catch { rates = []; points = []; }

  const matrix = buildMatrix(rates, points, data);
  const heading = text(data.heading);
  const intro = text(data.intro);
  const caption = text(data.caption) || t(locale, 'tollCaption');
  const km = t(locale, 'mapKm');

  if (matrix.points.length === 0) {
    return (
      <section className="db-block">
        {heading ? <h2 className="db-h2">{heading}</h2> : null}
        {intro ? <p className="db-lede">{intro}</p> : null}
        {/* Never a blank hole: no fares, a class filter that matches nothing
            and a database that will not answer all land here. */}
        <p className="db-empty-inline">{text(data.emptyMessage) || t(locale, 'noTollRates')}</p>
      </section>
    );
  }

  const noticeId = `toll-matrix-provisional-${matrix.vehicleClass}`;
  const className = classLabel(matrix.rows[0], locale);

  // Distinct citations across the fares actually on screen. Rendered by S.R.O.
  // number, which is also the link text — an S.R.O. number is a good
  // accessible name; a bare URL is not.
  const citations = [];
  for (const row of matrix.rows) {
    if (!hasCitation(row)) continue;
    if (citations.some((c) => c.number === row.sro_number)) continue;
    citations.push({ number: row.sro_number, date: row.sro_date, href: row.sro_link });
  }

  return (
    <section className="db-block">
      {heading ? <h2 className="db-h2">{heading}</h2> : null}
      {intro ? <p className="db-lede">{intro}</p> : null}

      {/* <figure> binds the schedule to its provenance — the warning above it
          and the citation beneath it are part of the same object as the
          prices, not a banner and a footnote either of which could be left
          behind when the other changed. */}
      <figure className="db-tollschedule">
        {matrix.anyProvisional ? (
          <IllustrativeNotice locale={locale} id={noticeId} />
        ) : null}

        <div className="db-scroll-x db-datatable db-tolltable">
          <table
            className="db-table"
            aria-describedby={matrix.anyProvisional ? noticeId : undefined}
          >
            {/* A real <caption>, always, naming the vehicle class the grid is
                for: a matrix of taka with no statement of whose taka they are
                is unreadable to anyone not looking at the heading. */}
            <caption className="db-table-caption">
              {caption}
              {className ? ` · ${className}` : ''}
            </caption>
            <thead>
              <tr>
                {/* The empty corner cell of a two-way matrix. It heads the
                    column of ORIGINS, so it is a <td>, not a <th> with
                    nothing in it for a screen reader to announce. */}
                <td />
                {matrix.points.map((p) => (
                  <th key={p.id} scope="col">{localeName(p, locale) || p.names?.en || ''}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {matrix.points.map((origin) => (
                <tr key={origin.id}>
                  {/* scope="row": a fare read out of sequence still carries
                      the plaza it is charged from. */}
                  <th scope="row">{localeName(origin, locale) || origin.names?.en || ''}</th>
                  {matrix.points.map((destination) => {
                    const fare = matrix.cell(origin.id, destination.id);
                    if (!fare) {
                      // The diagonal, and any pair with no published fare. An
                      // em dash, not a blank cell and never an interpolated
                      // guess.
                      return <td key={destination.id} className="db-num">—</td>;
                    }
                    // Fare over distance, both in tabular figures so the
                    // columns compare by eye — which is the entire job of a
                    // matrix. `.db-toll-amount` and `.db-num` are the classes
                    // the toll table and the interchange table already use;
                    // no new token, no new colour, and the <br> keeps the two
                    // figures apart without one.
                    return (
                      <td key={destination.id} className="db-num">
                        <span className="db-toll-amount">{formatTaka(fare.amount_bdt)}</span>
                        <br />
                        <span className="db-num">{formatKm(fare.distance_m)} {km}</span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {citations.length > 0 ? (
          <figcaption className="db-table-note db-toll-provenance">
            {citations.map((c) => (
              <span key={c.number}>
                {c.href ? (
                  /* A plain <a>: these targets are gazette PDFs, never
                     in-app routes. */
                  <a className="db-toll-sro" href={c.href}>{c.number}</a>
                ) : <span className="db-toll-sro">{c.number}</span>}
                {c.date ? <span className="db-toll-srodate">{c.date}</span> : null}
              </span>
            ))}
          </figcaption>
        ) : null}
      </figure>
    </section>
  );
}
