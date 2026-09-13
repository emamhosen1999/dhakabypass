import Link from 'next/link';
import { localeHref } from '../../lib/blocks/href.js';
import { getInterchangesCached } from '../../lib/corridor/cache';
import { localeName, localeConnectsTo } from '../../lib/corridor/interchanges';
import { formatChainage } from '../../lib/corridor/chainage';
import { kindKey, statusKey, statusTagClass } from '../../lib/corridor/interchange-labels';
import { selectInterchanges, visibleColumns } from '../../lib/blocks/interchangeTable.js';
import { text } from '../../lib/blocks/items.js';
import { t } from '../../lib/i18n/ui';

/**
 * Every interchange, toll plaza, bridge and service area on the corridor —
 * the table a driver actually reads to find their exit.
 *
 * A LIVE-DATA BLOCK. Nothing here is typed twice: the names, chainages, kinds,
 * statuses and facilities all come from the `interchanges` records edited at
 * /admin/corridor/interchanges, which is what stops Kanchan interchange being
 * one thing on the map, another on the route page and a third here. The block
 * chooses the order and the columns, and nothing else.
 *
 * The kind and status label keys are shared with
 * components/corridor/InterchangeTable.jsx through
 * lib/corridor/interchange-labels.js, so the fixed-layout table on
 * /travel/status and this block cannot name the same record differently while
 * both exist.
 *
 * Location is always the row's <th scope="row">. Every other column can be
 * switched off, but not that one: a wayfinding table whose rows have no
 * identifying header is a grid of bare values to a screen-reader user, and
 * status read out of sequence would carry no place with it.
 */
export default async function InterchangeTableBlock({ data, locale }) {
  // A dead query must not produce a stack trace in a browser: [] falls through
  // to the authored empty message below.
  let records = [];
  try { records = await getInterchangesCached(); } catch { records = []; }

  const rows = selectInterchanges(records, data, (r) => localeName(r, locale), (r) => localeConnectsTo(r, locale));
  const show = visibleColumns(data);
  const heading = text(data.heading);
  const intro = text(data.intro);
  const caption = text(data.caption) || t(locale, 'interchangeCaption');
  const linkLabel = text(data.linkLabel);
  const linkHref = text(data.linkHref);

  return (
    <section className="db-block">
      {heading ? <h2 className="db-h2">{heading}</h2> : null}
      {intro ? <p className="db-lede">{intro}</p> : null}

      {rows.length === 0 ? (
        /* Nothing published, everything filtered out, and a database that
           will not answer all land here, in the operator's own words —
           falling back to the editable `noInterchanges` string. */
        <p className="db-empty-inline">{text(data.emptyMessage) || t(locale, 'noInterchanges')}</p>
      ) : (
        <div className="db-scroll-x db-interchangetable">
          <table className="db-table">
            <caption className="db-table-caption">{caption}</caption>
            <thead>
              <tr>
                <th scope="col">{t(locale, 'colLocation')}</th>
                {show.chainage ? <th scope="col">{t(locale, 'colChainage')}</th> : null}
                {show.type ? <th scope="col">{t(locale, 'colType')}</th> : null}
                {show.connects ? <th scope="col">{t(locale, 'colConnects')}</th> : null}
                {show.status ? <th scope="col">{t(locale, 'colStatus')}</th> : null}
                {show.facilities ? <th scope="col">{t(locale, 'travelFacilities')}</th> : null}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <th scope="row">{r.name}</th>
                  {show.chainage ? <td className="db-num">{formatChainage(r.chainageM)}</td> : null}
                  {show.type ? <td>{t(locale, kindKey(r.kind))}</td> : null}
                  {show.connects ? <td>{r.connectsTo || '—'}</td> : null}
                  {show.status ? (
                    <td>
                      {/* The word, so the tag's colour is never the only
                          carrier of whether a junction is open. */}
                      <span className={`db-tag db-tag-${statusTagClass(r.status)}`}>
                        {t(locale, statusKey(r.status))}
                      </span>
                    </td>
                  ) : null}
                  {show.facilities ? (
                    <td>
                      {r.facilities.length === 0 ? '—' : (
                        /* A list, not a run of prose: a screen reader
                           announces how many facilities a junction has before
                           reading them. Reuses .db-pin-amenities, which
                           already resets .db-tag's uppercase for
                           operator-authored, per-locale strings. */
                        <ul className="db-pin-amenities">
                          {r.facilities.map((f, n) => <li key={n} className="db-tag">{f}</li>)}
                        </ul>
                      )}
                    </td>
                  ) : null}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {linkLabel && linkHref ? (
        <p className="db-actions">
          <Link href={localeHref(linkHref, locale)} className="db-btn db-btn-secondary">{linkLabel}</Link>
        </p>
      ) : null}
    </section>
  );
}
