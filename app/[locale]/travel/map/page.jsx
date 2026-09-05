import { notFound } from 'next/navigation';
import { isLocale } from '../../../../lib/i18n/locales.js';
import { t } from '../../../../lib/i18n/ui.js';
import { mapUi } from '../../../../lib/i18n/map-ui.js';
import { alternatesFor } from '../../../../lib/seo/alternates.js';
import CorridorExplorer from '../../../../components/corridor/CorridorExplorer.jsx';
import { buildMapView } from '../../../../lib/corridor/view.js';
import { trafficDistribution, overallCondition } from '../../../../lib/corridor/map.js';
import {
  peakVehicles, monthOnMonthChange,
} from '../../../../lib/corridor/traffic.js';
import { getMapTrafficCached } from '../../../../lib/corridor/traffic-cache.js';
import { getInterchangesCached } from '../../../../lib/corridor/cache.js';
import { localeName } from '../../../../lib/corridor/interchanges.js';

export async function generateMetadata({ params }) {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return {
    title: t(locale, 'mapHeading'),
    description: t(locale, 'mapIntro'),
    alternates: alternatesFor('/travel/map', locale),
  };
}

const CONDITION_COLOUR = {
  free: 'var(--db-open)',
  moderate: 'var(--db-traffic-moderate)',
  slow: 'var(--db-traffic-slow)',
  heavy: 'var(--db-alert)',
  closed: 'var(--db-ink-3)',
  unknown: 'var(--db-rule-2)',
};
const CONDITION_KEYS = ['free', 'moderate', 'slow', 'heavy', 'closed', 'unknown'];

/**
 * The corridor map.
 *
 * Specified from the start — "schematic corridor strip everywhere + one real
 * interactive map on the route page" — and deferred only because the geometry
 * did not exist. It does now: every coordinate drawn here comes from DBEDC's
 * own survey workbook or from an imported road centreline, and nothing between
 * the real points is invented.
 *
 * TWO CLAIMS ON THIS PAGE ARE LABELLED, because both are things a reader would
 * otherwise take as measured fact:
 *
 *   - the traffic conditions, while `corridor.traffic_source` is 'sample';
 *   - the alignment, while no road centreline has been imported and the line is
 *     the surveyed-waypoint polyline rather than the road's real curvature.
 *
 * A congestion colour and a road's shape are both claims a driver will act on.
 */
export default async function CorridorMapPage({ params }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  // Settled independently: the map must still draw if the traffic feed is
  // unreadable, and the facts panel must still fill if the map cannot.
  let waypoints = [];
  let sections = [];
  let interchanges = [];
  let monthly = [];
  let geometry = [];
  let geoSource = null;
  let source = 'sample';
  let monthlySource = 'sample';
  try {
    const [traffic, places] = await Promise.all([getMapTrafficCached(), getInterchangesCached().catch(() => [])]);
    ({ waypoints, sections, monthly, geometry, geoSource, source, monthlySource } = traffic);
    interchanges = places;
  } catch {
    // Every reader above already degrades on its own; this is the last guard.
  }

  const features = (interchanges || []).map((i) => ({
    id: i.id, lat: i.lat, lng: i.lng, chainage_m: i.chainageM ?? i.chainage_m,
    kind: i.kind, status: i.status, name: localeName(i, locale),
  }));

  const intlLocale = locale === 'bn' ? 'bn-BD' : locale === 'zh' ? 'zh-CN' : 'en-GB';
  const nf = new Intl.NumberFormat(intlLocale);
  const mf = new Intl.DateTimeFormat(intlLocale, { month: 'short', timeZone: 'UTC' });
  /**
   * Every number on this page goes through the reader's own formatter.
   *
   * `(m / 1000).toFixed(1)` printed Latin digits and a hardcoded "km", so a
   * Bengali reader got Bengali numerals in one panel and "0.0–2.3 km" in the
   * next, and a Chinese reader got 公里 on the scale bar and "km" in the list
   * beside it. The distance is the same fact in all three languages; only the
   * digits and the unit change, and neither belongs in the JSX.
   */
  const dec = (n, digits) => new Intl.NumberFormat(intlLocale, {
    minimumFractionDigits: digits, maximumFractionDigits: digits,
  }).format(n);
  const km = (metres, digits = 1) => `${dec(metres / 1000, digits)} ${t(locale, 'mapKm')}`;
  const pct = (n, digits = 0) => new Intl.NumberFormat(intlLocale, {
    style: 'percent', minimumFractionDigits: digits, maximumFractionDigits: digits,
    signDisplay: digits > 0 ? 'exceptZero' : 'auto',
  }).format(n / 100);
  // `2026-08` -> the reader's own short month name. Parsed as UTC explicitly:
  // `new Date('2026-08-01')` is UTC midnight, which in a negative-offset server
  // timezone formats as July.
  const monthLabel = (ym) => {
    const [y, m] = String(ym).split('-').map(Number);
    if (!y || !m) return String(ym);
    return mf.format(new Date(Date.UTC(y, m - 1, 1)));
  };

  const wpLabel = (code) => {
    const w = (waypoints || []).find((x) => String(x.code) === String(code));
    const names = w && w.names ? (typeof w.names === 'string' ? JSON.parse(w.names) : w.names) : null;
    const name = names ? (names[locale] || names.en) : null;
    return name || `${t(locale, 'mapWaypoint')} ${code}`;
  };

  // The whole drawing, formatted on the server: the interactive shell is a
  // client component and cannot be handed a translation function.
  const view = buildMapView({
    waypoints, sections, features, geometry, locale, km, waypointName: wpLabel,
  });

  const distribution = trafficDistribution(view.ok ? view.sections : []);
  const overall = overallCondition(distribution.map((d) => ({ condition: d.condition, lengthM: d.metres })));
  const totalKm = distribution.reduce((n, d) => n + d.metres, 0) / 1000;
  const peak = peakVehicles(monthly);
  const change = monthOnMonthChange(monthly);

  return (
    <>
      <link rel="preload" as="image" href="/maps/corridor-geography.webp" fetchPriority="high" />
      <section className="db-block">
        <p className="db-eyebrow">{t(locale, 'travelRoute')}</p>
        <h1 className="db-h1">{t(locale, 'mapHeading')}</h1>
        <p className="db-lede">{t(locale, 'mapIntro')}</p>

        {/* The label that keeps the colouring honest. Sample conditions are
            still conditions to a reader looking at a coloured road. */}
        {source === 'sample' || (monthly.length > 0 && monthlySource === 'sample') ? (
          <p className="db-pending">
            <span className="db-pending-tag">{t(locale, 'mapSampleTag')}</span>
            {t(locale, 'mapSampleBody')}
          </p>
        ) : null}

        {/* And the label that keeps the LINE honest. Eight surveyed points over
            47.6 km drawn as an alignment is a polyline, and a polyline
            presented as a survey is the same class of claim as an invented
            figure. */}
        {view.ok && !view.hasCentreline ? (
          <p className="db-pending">
            <span className="db-pending-tag">{t(locale, 'mapSchematicTag')}</span>
            {t(locale, 'mapSchematicBody')}
          </p>
        ) : null}
      </section>

      <section className="db-block">
        {!view.ok ? (
          <p className="db-empty">{t(locale, 'mapNoGeometry')}</p>
        ) : (
          <>
            {/* The map and its section list are one thing: the list is the
                map's key, its accessible equivalent and its control surface,
                so they share a component and a grid. Everything else on the
                page is commentary and sits below them. */}
            <CorridorExplorer
                view={view}
                ui={{
                  ...mapUi(locale),
                  locale:intlLocale, kmUnit:t(locale,'mapKm'), mUnit:locale==='bn'?'মি':locale==='zh'?'米':'m',
                  zoomIn: t(locale, 'mapZoomIn'),
                  zoomOut: t(locale, 'mapZoomOut'),
                  resetView: t(locale, 'mapResetView'),
                  resetShort: t(locale, 'mapResetShort'),
                  selectHint: t(locale, 'mapSelectHint'),
                  sectionStatus: t(locale, 'mapSectionStatus'),
                  noSections: t(locale, 'mapNoSections'),
                  attribution: geoSource ? geoSource.attribution : '',
                }}
            />

            <div className="db-map-layout">
              <div>
              {/* Both halves of the legend. The line colours were explained and
                  the point symbols were not, so a reader saw amber and white
                  dots along the road with nothing saying what they were. */}
              <ul className="db-map-legend">
                {CONDITION_KEYS.map((k) => (
                  <li key={k}>
                    <span className="db-map-swatch" style={{ background: CONDITION_COLOUR[k] }} aria-hidden="true" />
                    {t(locale, `traffic_${k}`)}
                  </li>
                ))}
              </ul>
              <ul className="db-map-legend db-map-legend-points">
                <li>
                  <span className="db-map-key db-map-key-terminal" aria-hidden="true" />
                  {t(locale, 'mapKeyTerminal')}
                </li>
                <li>
                  <span className="db-map-key db-map-key-wp" aria-hidden="true" />
                  {t(locale, 'mapKeyWaypoint')}
                </li>
                <li>
                  <span className="db-map-key db-map-key-toll" aria-hidden="true" />
                  {t(locale, 'kindTollPlaza')}
                </li>
                <li>
                  <span className="db-map-key db-map-key-bridge" aria-hidden="true" />
                  {t(locale, 'kindBridge')}
                </li>
                {/* Most of the named facilities are not open yet. Drawing them
                    like the open ones would tell a driver they can use a toll
                    plaza that is still a construction site. */}
                <li>
                  <span className="db-map-key db-map-key-pending" aria-hidden="true" />
                  {t(locale, 'statusConstruction')}
                </li>
              </ul>

              {distribution.length ? (
                <div className="db-panel" style={{ marginTop: 20 }}>
                  <h2 className="db-panel-title">{t(locale, 'mapDistribution')}</h2>
                  {/* Widths are proportional to DISTANCE, not to section count —
                      "30% moderate" has to mean 30% of the journey. */}
                  <div className="db-dist" role="img"
                       aria-label={distribution.map((d) => `${t(locale, `traffic_${d.condition}`)} ${pct(d.percent)}`).join(', ')}>
                    {distribution.map((d) => (
                      <span key={d.condition}
                            style={{ width: `${d.percent}%`, background: CONDITION_COLOUR[d.condition] }} />
                    ))}
                  </div>
                  <ul className="db-distkey">
                    {distribution.map((d) => (
                      <li key={d.condition}>
                        <b>{pct(d.percent)}</b> {t(locale, `traffic_${d.condition}`)}
                        <span className="db-sectionmeta">{km(d.metres)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>

            <div>
              <div className="db-panel">
                <h2 className="db-panel-title">{t(locale, 'mapCorridorInfo')}</h2>
                <ul className="db-facts">
                  <li><span className="k">{t(locale, 'mapStartPoint')}</span><span className="v">{wpLabel('S')}</span></li>
                  <li><span className="k">{t(locale, 'mapEndPoint')}</span><span className="v">{wpLabel('E')}</span></li>
                  <li><span className="k">{t(locale, 'mapMeasuredLength')}</span><span className="v">{km(totalKm * 1000, 3)}</span></li>
                  <li><span className="k">{t(locale, 'mapSections')}</span><span className="v">{nf.format(view.sections.length)}</span></li>
                  <li>
                    {/* Named for what it is. `overallCondition` returns the
                        WORST condition affecting a meaningful share of the
                        corridor, not a mean — a label saying "overall" invited
                        a reader to assume the average, and then "Closed" looked
                        like a bug rather than one genuinely closed section. */}
                    <span className="k">{t(locale, 'mapWorst')}</span>
                    <span className="v">{t(locale, `traffic_${overall}`)}</span>
                  </li>
                </ul>
              </div>

              {monthly.length ? (
                <div className="db-panel">
                  <h2 className="db-panel-title">{t(locale, 'mapMonthlyFlow')}</h2>
                  <p className="db-sectionmeta" style={{ marginBottom: 10 }}>
                    {t(locale, 'mapMonthlyFlowNote')}
                  </p>
                  {/* The bars start at zero, which is the honest baseline and
                      also means twelve months within 13% of each other look
                      nearly level. The peak is printed so a reader can
                      calibrate what the height represents, rather than the
                      chart being truncated to manufacture drama. */}
                  <p className="db-flow-peak">{t(locale, 'mapPeak')}: {nf.format(peak)}</p>
                  <div className="db-flow" role="img"
                       aria-label={monthly.map((m) => `${monthLabel(m.month)}: ${nf.format(m.vehicles)}`).join('; ')}>
                    {monthly.map((m) => (
                      <div key={m.month} className="db-flow-col">
                        <div className="db-flow-bar" style={{ height: `${Math.max(2, (m.vehicles / peak) * 100)}%` }} />
                        {/* "09 10 11 12 01 02" was a row of numbers that could
                            be months or anything else, and gave no clue that
                            the run crossed a year boundary. */}
                        <span className="db-flow-label">{monthLabel(m.month)}</span>
                      </div>
                    ))}
                  </div>
                  <ul className="db-facts" style={{ marginTop: 14 }}>
                    <li>
                      <span className="k">{t(locale, 'mapLatestMonth')}</span>
                      <span className="v">{nf.format(monthly[monthly.length - 1].vehicles)}</span>
                    </li>
                    {change != null ? (
                      <li>
                        <span className="k">{t(locale, 'mapMonthChange')}</span>
                        <span className="v" style={{ color: change >= 0 ? 'var(--db-open)' : 'var(--db-alert)' }}>
                          {pct(change, 1)}
                        </span>
                      </li>
                    ) : null}
                  </ul>
                </div>
              ) : null}
              </div>
            </div>
          </>
        )}
      </section>
    </>
  );
}
