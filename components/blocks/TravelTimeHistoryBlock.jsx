import { getSectionStatusCached, getTrafficHistoryCached } from '../../lib/corridor/traffic-cache';
import { bucketHistory, hasEnough, HOURS, DAY_TYPES } from '../../lib/corridor/history.js';
import { conditionColour, conditionLabelKey, CONDITION_RANK } from '../../lib/corridor/conditions.js';
import { selectSections, waypointNames } from '../../lib/blocks/trafficStatus.js';
import { text } from '../../lib/blocks/items.js';
import { t } from '../../lib/i18n/ui';
import ScrollArrows from '../chrome/ScrollArrows.jsx';

const INTL = { bn: 'bn-BD', zh: 'zh-CN' };
const DAY_TYPE_KEY = { weekday: 'historyWeekdays', weekend: 'historyWeekend' };

/**
 * How the road usually runs at each hour, per section: the median measured
 * speed, coloured by the condition most measurements at that hour reported.
 * The word for the condition is in the cell as well, for readers who cannot
 * tell the colours apart and for print.
 *
 * Every figure is a measurement the refresh kept; a cell with too few is a
 * dash. There is no design speed and no assumed free-flow figure anywhere in
 * this block.
 */
export default async function TravelTimeHistoryBlock({ data = {}, locale }) {
  const days = Number.isFinite(Number(data.days)) && Number(data.days) > 0 ? Number(data.days) : 90;
  let status = { sections: [], waypoints: [] };
  let rows = [];
  const [statusResult, historyResult] = await Promise.allSettled([
    getSectionStatusCached(), getTrafficHistoryCached(days),
  ]);
  if (statusResult.status === 'fulfilled' && statusResult.value) status = statusResult.value;
  if (historyResult.status === 'fulfilled' && Array.isArray(historyResult.value)) rows = historyResult.value;

  const heading = text(data.heading);
  const intro = text(data.intro);
  const head = (
    <>
      {heading ? <h2 className="db-h2">{heading}</h2> : null}
      {intro ? <p className="db-lede">{intro}</p> : null}
    </>
  );

  const sections = selectSections(status.sections, { sections: data.sections, sort: 'corridor' });
  const bucketed = bucketHistory(rows, { minSamples: data.minSamples });
  const shown = sections.filter((s) => bucketed.sections.has(Number(s.id)));

  if (!hasEnough(bucketed) || shown.length === 0) {
    return (
      <section className="db-block db-history">
        {head}
        <p className="db-empty-inline">{text(data.emptyMessage) || t(locale, 'historyNotEnough')}</p>
      </section>
    );
  }

  const intlLocale = INTL[locale] || 'en-GB';
  const nf = new Intl.NumberFormat(intlLocale);
  const df = new Intl.DateTimeFormat(intlLocale, { dateStyle: 'medium', timeZone: 'Asia/Dhaka' });
  const names = waypointNames(status.waypoints);
  const nameOf = (code) => {
    const map = names[code];
    const value = map && (map[locale] || map.en);
    return typeof value === 'string' && value.trim() ? value.trim() : `${t(locale, 'mapWaypoint')} ${code}`;
  };
  const basis = t(locale, 'historyBasis')
    .replace('{n}', nf.format(bucketed.samples))
    .replace('{from}', bucketed.from ? df.format(bucketed.from) : '')
    .replace('{to}', bucketed.to ? df.format(bucketed.to) : '');

  const present = new Set();
  for (const s of shown) {
    for (const type of DAY_TYPES) {
      for (const cell of bucketed.sections.get(Number(s.id))[type]) if (cell) present.add(cell.condition);
    }
  }
  const legend = [...present].sort((a, b) => CONDITION_RANK[a] - CONDITION_RANK[b]);

  return (
    <section className="db-block db-history">
      {head}
      <p className="db-history-basis">{basis}</p>
      {shown.map((s) => {
        const byType = bucketed.sections.get(Number(s.id));
        const title = `${nameOf(s.fromCode)} — ${nameOf(s.toCode)}`;
        return (
          <div key={s.id} className="db-history-section">
            <h3 className="db-history-title">{title}</h3>
            <ScrollArrows locale={locale} />
            <div className="db-scroll-x" tabIndex={0} aria-label={title}>
              <table className="db-table db-history-table">
                <caption className="db-visually-hidden">{`${title}: ${t(locale, 'historyCaption')}`}</caption>
                <thead>
                  <tr>
                    <th scope="col">{t(locale, 'historyHour')}</th>
                    {HOURS.map((h) => (
                      <th key={h} scope="col" className="db-num db-history-hour">{nf.format(h)}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {DAY_TYPES.map((type) => (
                    <tr key={type}>
                      <th scope="row">{t(locale, DAY_TYPE_KEY[type])}</th>
                      {byType[type].map((cell, h) => (cell ? (
                        <td
                          key={h}
                          className="db-num db-history-cell"
                          style={{ boxShadow: `inset 0 -4px 0 ${conditionColour(cell.condition)}` }}
                          title={`${t(locale, conditionLabelKey(cell.condition))} · ${nf.format(cell.n)}`}
                        >
                          {nf.format(cell.speed)}
                          <span className="db-visually-hidden">{` ${t(locale, 'mapKmh')}, ${t(locale, conditionLabelKey(cell.condition))}`}</span>
                        </td>
                      ) : (
                        <td key={h} className="db-num db-history-cell db-history-empty">—</td>
                      )))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
      <ul className="db-map-legend db-statuslegend">
        <li>{t(locale, 'historyUnit')}</li>
        {legend.map((c) => (
          <li key={c}>
            <i className="db-map-swatch" style={{ background: conditionColour(c) }} aria-hidden="true" />
            {t(locale, conditionLabelKey(c))}
          </li>
        ))}
      </ul>
    </section>
  );
}
