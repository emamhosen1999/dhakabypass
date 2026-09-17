import { getInterchangesCached, getCorridorSummaryCached } from '../../lib/corridor/cache';
import { getCorridorGeometryCached, getSectionStatusCached } from '../../lib/corridor/traffic-cache';
import { getContactDetailsCached } from '../../lib/settings-cache.js';
import { localeName } from '../../lib/corridor/interchanges';
import { kindKey, statusKey, statusTagClass } from '../../lib/corridor/interchange-labels.js';
import { formatChainage, formatKm } from '../../lib/corridor/chainage';
import { LOCATE_KEYS, locate } from '../../lib/corridor/locate.js';
import { waypointNames } from '../../lib/blocks/trafficStatus.js';
import { text } from '../../lib/blocks/items.js';
import { t } from '../../lib/i18n/ui';
import EmergencyNumbers from '../contact/EmergencyNumbers.jsx';
import KmFinderLocate from './KmFinderLocate.jsx';

const INTL = { bn: 'bn-BD', zh: 'zh-CN' };

/**
 * Where am I on the expressway.
 *
 * A real GET form, answered on the server from the query string, so a driver
 * on the hard shoulder with a weak signal and no JavaScript still gets the
 * answer, and the answer has an address they can read out or send. The
 * client button only fills the same form from the browser's position.
 *
 * Everything printed is a record: chainages and names from `interchanges`,
 * the centreline from `corridor_geometry`, open or not from `segments`, the
 * corridor's end names from `corridor_waypoints`, the numbers from settings.
 */
export default async function KmFinderBlock({ data = {}, locale, searchParams, blockId }) {
  let geometry = [];
  let interchanges = [];
  let segments = [];
  let waypoints = [];
  let details = {};
  const settled = await Promise.allSettled([
    getCorridorGeometryCached(), getInterchangesCached(), getCorridorSummaryCached(),
    getSectionStatusCached(), getContactDetailsCached(locale),
  ]);
  if (settled[0].status === 'fulfilled' && Array.isArray(settled[0].value)) geometry = settled[0].value;
  if (settled[1].status === 'fulfilled' && Array.isArray(settled[1].value)) interchanges = settled[1].value;
  if (settled[2].status === 'fulfilled' && Array.isArray(settled[2].value?.segments)) segments = settled[2].value.segments;
  if (settled[3].status === 'fulfilled' && Array.isArray(settled[3].value?.waypoints)) waypoints = settled[3].value.waypoints;
  if (settled[4].status === 'fulfilled' && settled[4].value) details = settled[4].value;

  let search = null;
  try { search = searchParams ? await searchParams : null; } catch { search = null; }
  const result = locate({ query: search || {}, geometry, interchanges, segments });

  const intlLocale = INTL[locale] || 'en-GB';
  const nf = new Intl.NumberFormat(intlLocale, { maximumFractionDigits: 1 });
  const km = (metres) => `${nf.format(Number(formatKm(Math.round(metres))))} ${t(locale, 'mapKm')}`;

  const names = waypointNames(waypoints);
  // "Naojor (corridor start)" is the waypoint's full name; as a direction,
  // "towards Naojor" is what a driver says, so a trailing bracket goes.
  const endName = (code) => {
    const map = names[code];
    const value = map && (map[locale] || map.en);
    return typeof value === 'string' && value.trim() ? value.trim().replace(/\s*[(（][^()（）]*[)）]\s*$/, '') : '';
  };
  // The corridor's two ends, by their waypoint names (Naojor, Madanpur in
  // each language). The first and last by chainage are the ends whatever
  // codes they carry.
  const ordered = [...waypoints].filter((w) => Number.isFinite(Number(w?.chainage_m)))
    .sort((a, b) => Number(a.chainage_m) - Number(b.chainage_m));
  const startName = ordered.length ? endName(ordered[0].code) : '';
  const finishName = ordered.length ? endName(ordered[ordered.length - 1].code) : '';

  const base = `db-locate-${blockId ?? 'block'}`;
  const formId = `${base}-form`;
  const label = {
    marker: text(data.markerLabel) || t(locale, 'locateLabel'),
    submit: text(data.submitLabel) || t(locale, 'locateSubmit'),
    use: text(data.locationLabel) || t(locale, 'locateUseLocation'),
  };
  const heading = text(data.heading);
  const intro = text(data.intro);
  const note = text(data.note);
  const nameOf = (row) => localeName(row, locale) || row?.names?.en || '';

  const exitLine = (hit, place) => (
    <>
      <dt>{t(locale, 'locateTowards').replace('{place}', place || '—')}</dt>
      <dd>
        {hit ? (
          <>
            <span className="db-locate-name">{nameOf(hit.row)}</span>
            <span className="db-sectionmeta">
              {`${formatChainage(Number(hit.row.chainage_m))} · ${km(hit.distanceM)} · `}
              <span className={`db-tag db-tag-${statusTagClass(hit.row.status)}`}>{t(locale, statusKey(hit.row.status))}</span>
            </span>
          </>
        ) : t(locale, 'locateNone')}
      </dd>
    </>
  );

  let answer = null;
  if (result.status === 'invalid') {
    answer = <p className="db-form-error" role="alert">{t(locale, 'locateInvalid')}</p>;
  } else if (result.status === 'beyond') {
    answer = (
      <p className="db-form-error" role="alert">
        {t(locale, 'locateBeyond').replace('{from}', formatChainage(0)).replace('{to}', formatChainage(Math.round(result.lengthM)))}
      </p>
    );
  } else if (result.status === 'off-road') {
    answer = <p className="db-form-error" role="alert">{t(locale, 'locateOffRoad').replace('{n}', nf.format(result.offsetM / 1000))}</p>;
  } else if (result.status === 'no-geometry') {
    answer = <p className="db-form-error" role="alert">{t(locale, 'mapNoGeometry')}</p>;
  } else if (result.status === 'located') {
    const seg = result.segment;
    answer = (
      <div className="db-locate-answer db-form-result" aria-live="polite">
        <p className="db-locate-here">
          <span className="db-locate-here-label">{t(locale, 'locateYouAre')}</span>
          <strong className="db-locate-chainage" lang="en">{formatChainage(result.chainageM)}</strong>
          {result.offsetM !== null ? (
            <span className="db-sectionmeta">{t(locale, 'locateOffset').replace('{n}', nf.format(result.offsetM))}</span>
          ) : null}
        </p>
        <dl className="db-locate-facts">
          <dt>{t(locale, 'locateStretch')}</dt>
          <dd>
            {seg ? (
              <span className={`db-tag db-tag-${statusTagClass(seg.status)}`}>{t(locale, statusKey(seg.status))}</span>
            ) : t(locale, 'traffic_unknown')}
          </dd>
          <dt>{t(locale, 'locateNearestPlaza')}</dt>
          <dd>
            {result.nearestPlaza ? (
              <>
                <span className="db-locate-name">{nameOf(result.nearestPlaza.row)}</span>
                <span className="db-sectionmeta">{`${formatChainage(Number(result.nearestPlaza.row.chainage_m))} · ${km(result.nearestPlaza.distanceM)}`}</span>
              </>
            ) : t(locale, 'locateNone')}
          </dd>
          {exitLine(result.towardsStart, startName)}
          {exitLine(result.towardsEnd, finishName)}
          {result.structures.length ? (
            <>
              <dt>{t(locale, 'locateNearby')}</dt>
              <dd>
                <ul className="db-locate-list">
                  {result.structures.map(({ row, distanceM }) => (
                    <li key={row.id}>
                      {`${nameOf(row)} (${t(locale, kindKey(row.kind))}) · ${km(distanceM)}`}
                    </li>
                  ))}
                </ul>
              </dd>
            </>
          ) : null}
        </dl>
        {note ? <p className="db-form-note">{note}</p> : null}
      </div>
    );
  }

  const showEmergency = data.showEmergency !== 'no';

  return (
    <section className="db-block db-locate">
      {heading ? <h2 className="db-h2">{heading}</h2> : null}
      {intro ? <p className="db-lede">{intro}</p> : null}

      <form className="db-form db-locate-form" method="get" id={formId}>
        <div className="db-field">
          <label className="db-label" htmlFor={`${formId}-km`}>{label.marker}</label>
          <input
            className="db-input"
            id={`${formId}-km`}
            name={LOCATE_KEYS.marker}
            type="text"
            inputMode="decimal"
            autoComplete="off"
            defaultValue={result.marker}
            aria-describedby={`${formId}-hint`}
            aria-invalid={result.status === 'invalid' ? 'true' : undefined}
          />
          <p className="db-form-note" id={`${formId}-hint`}>{t(locale, 'locateHint')}</p>
        </div>
        <div className="db-locate-actions">
          <button type="submit" className="db-btn db-btn-primary">{label.submit}</button>
          <KmFinderLocate
            formId={formId}
            keys={LOCATE_KEYS}
            labels={{ use: label.use, busy: t(locale, 'locateLocating'), denied: t(locale, 'locateDenied') }}
          />
        </div>
      </form>

      {answer}

      {showEmergency ? (
        details.emergency || details.nationalEmergency ? (
          <div className="db-footer-emergency db-emergency-strip db-locate-emergency">
            <EmergencyNumbers locale={locale} emergency={details.emergency} national={details.nationalEmergency} />
          </div>
        ) : (
          <p className="db-pending">
            <span className="db-pending-tag">{t(locale, 'pendingTag')}</span>
            {t(locale, 'locateNoNumbers')}
          </p>
        )
      ) : null}
    </section>
  );
}
