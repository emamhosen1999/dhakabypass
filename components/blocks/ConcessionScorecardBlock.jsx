import { localeHref } from '../../lib/blocks/href.js';
import { text } from '../../lib/blocks/items.js';
import { termProgress, scorecardRows } from '../../lib/blocks/scorecard.js';
import { t } from '../../lib/i18n/ui';
import ScrollArrows from '../chrome/ScrollArrows.jsx';

const INTL = { bn: 'bn-BD', zh: 'zh-CN' };

/**
 * The concession's term as a bar that moves by itself, and the indicators
 * DBEDC reports against, target beside actual, each with its source and
 * as-at date. Nothing is computed from an indicator: the only arithmetic is
 * days between two dates. A blank "achieved" cell reads "not yet
 * published"; a block with no rows and no term dates reads the empty
 * message, so an operator who places it early sees what is missing.
 */
export default function ConcessionScorecardBlock({ data = {}, locale }) {
  const intlLocale = INTL[locale] || 'en-GB';
  const nf = new Intl.NumberFormat(intlLocale);
  const df = new Intl.DateTimeFormat(intlLocale, { dateStyle: 'long', timeZone: 'UTC' });
  const term = termProgress(data.termStart, data.termEnd);
  const rows = scorecardRows(data.rows);
  const heading = text(data.heading);
  const intro = text(data.intro);

  if (!term && rows.length === 0) {
    return (
      <section className="db-block db-scorecard">
        {heading ? <h2 className="db-h2">{heading}</h2> : null}
        {intro ? <p className="db-lede">{intro}</p> : null}
        <p className="db-pending">
          <span className="db-pending-tag">{t(locale, 'pendingTag')}</span>
          {text(data.emptyMessage) || t(locale, 'scorecardEmpty')}
        </p>
      </section>
    );
  }

  const pending = <span className="db-scorecard-pending">{t(locale, 'pendingTag')}</span>;

  return (
    <section className="db-block db-scorecard">
      {heading ? <h2 className="db-h2">{heading}</h2> : null}
      {intro ? <p className="db-lede">{intro}</p> : null}

      {term ? (
        <div className="db-scorecard-term">
          <div className="db-progress-head">
            <span className="db-progress-value">{`${nf.format(term.percent)}%`}</span>
            <span className="db-progress-label">{text(data.termLabel) || t(locale, 'scorecardTerm')}</span>
          </div>
          <div
            className="db-progress-rail"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={term.percent}
            aria-label={text(data.termLabel) || t(locale, 'scorecardTerm')}
          >
            <span className="db-progress-fill" style={{ width: `${term.percent}%` }} />
          </div>
          <p className="db-progress-note">
            {t(locale, 'scorecardTermDates').replace('{start}', df.format(term.start)).replace('{end}', df.format(term.end))}
            {' · '}
            {t(locale, 'scorecardTermDays')
              .replace('{elapsed}', nf.format(term.elapsedDays))
              .replace('{remaining}', nf.format(term.remainingDays))}
            {text(data.termSource) ? <span className="db-scorecard-source">{` · ${text(data.termSource)}`}</span> : null}
          </p>
        </div>
      ) : null}

      {rows.length ? (
        <>
          <ScrollArrows locale={locale} />
          <div className="db-scroll-x" tabIndex={0} aria-label={t(locale, 'scorecardCaption')}>
            <table className="db-table db-scorecard-table">
              <caption className="db-table-caption">{t(locale, 'scorecardCaption')}</caption>
              <thead>
                <tr>
                  <th scope="col">{t(locale, 'scorecardIndicator')}</th>
                  <th scope="col" className="db-num">{t(locale, 'scorecardTarget')}</th>
                  <th scope="col" className="db-num">{t(locale, 'scorecardActual')}</th>
                  <th scope="col">{t(locale, 'scorecardAsOf')}</th>
                  <th scope="col">{t(locale, 'quoteSource')}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => {
                  const href = localeHref(r.sourceHref, locale);
                  return (
                    <tr key={i}>
                      <th scope="row">{r.indicator}</th>
                      <td className="db-num">{r.target ? `${r.target}${r.unit ? ` ${r.unit}` : ''}` : '—'}</td>
                      <td className="db-num">{r.actual ? `${r.actual}${r.unit ? ` ${r.unit}` : ''}` : pending}</td>
                      <td>{r.asOf || '—'}</td>
                      <td>{r.source ? (href ? <a href={href}>{r.source}</a> : r.source) : '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <p className="db-pending">
          <span className="db-pending-tag">{t(locale, 'pendingTag')}</span>
          {text(data.emptyMessage) || t(locale, 'scorecardEmpty')}
        </p>
      )}
    </section>
  );
}
