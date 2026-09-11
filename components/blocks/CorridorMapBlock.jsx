import { t } from '../../lib/i18n/ui.js';
import { mapUi } from '../../lib/i18n/map-ui.js';
import { buildMapView } from '../../lib/corridor/view.js';
import { getMapTrafficCached } from '../../lib/corridor/traffic-cache.js';
import { getInterchangesCached } from '../../lib/corridor/cache.js';
import { localeName } from '../../lib/corridor/interchanges.js';
import CorridorExplorer from '../corridor/CorridorExplorer.jsx';

const text = (v) => (typeof v === 'string' ? v.trim() : '');

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
 * The interactive corridor map, as a block.
 *
 * This is the middle of app/[locale]/travel/map/page.jsx lifted out: the same
 * cached readers, the same buildMapView(), the same CorridorExplorer, the same
 * two honesty notices. It exists so the map can be placed on any page — and so
 * /travel/map can become a block document whose page file W1.8 deletes.
 *
 * Two things stay exactly as the page had them, deliberately:
 *
 *   THE HONESTY NOTICES ARE NOT CONFIGURABLE. "Sample data" appears whenever
 *   the traffic source is `sample`; "Schematic" appears whenever the drawn line
 *   is eight surveyed points and not a centreline. Both are driven by the data
 *   and there is no block field that reaches them. A coloured road drawn from
 *   sample data, presented without the label, is a claim about traffic that
 *   nobody measured.
 *
 *   THE WHOLE DRAWING IS FORMATTED ON THE SERVER. CorridorExplorer is a client
 *   component and cannot be handed a translation function, so every label and
 *   every distance is a string by the time it crosses the boundary — which is
 *   also what keeps the client bundle free of the 546-string UI catalogue.
 */
export default async function CorridorMapBlock({ data, locale }) {
  let waypoints = [];
  let sections = [];
  let interchanges = [];
  let geometry = [];
  let geoSource = null;
  let source = 'sample';
  try {
    const [traffic, places] = await Promise.all([
      getMapTrafficCached(),
      getInterchangesCached().catch(() => []),
    ]);
    ({ waypoints, sections, geometry, geoSource, source } = traffic);
    interchanges = places;
  } catch { /* fall through to the no-geometry state */ }

  const features = (interchanges || []).map((i) => ({
    id: i.id, lat: i.lat, lng: i.lng, chainage_m: i.chainageM ?? i.chainage_m,
    kind: i.kind, status: i.status, name: localeName(i, locale),
  }));

  const intlLocale = locale === 'bn' ? 'bn-BD' : locale === 'zh' ? 'zh-CN' : 'en-GB';
  const dec = (n, digits) => new Intl.NumberFormat(intlLocale, {
    minimumFractionDigits: digits, maximumFractionDigits: digits,
  }).format(n);
  const km = (metres, digits = 1) => `${dec(metres / 1000, digits)} ${t(locale, 'mapKm')}`;
  const wpLabel = (code) => {
    const w = (waypoints || []).find((x) => String(x.code) === String(code));
    const names = w && w.names ? (typeof w.names === 'string' ? JSON.parse(w.names) : w.names) : null;
    const name = names ? (names[locale] || names.en) : null;
    return name || `${t(locale, 'mapWaypoint')} ${code}`;
  };

  const view = buildMapView({
    waypoints, sections, features, geometry, locale, km, waypointName: wpLabel,
  });

  const heading = text(data?.heading);
  const intro = text(data?.intro);
  const showLegend = data?.showLegend !== 'no';

  return (
    <section className="db-block db-map-block">
      {heading ? <h2 className="db-h2">{heading}</h2> : null}
      {intro ? <p className="db-lede">{intro}</p> : null}

      {source === 'sample' ? (
        <p className="db-pending">
          <span className="db-pending-tag">{t(locale, 'mapSampleTag')}</span>
          {t(locale, 'mapSampleBody')}
        </p>
      ) : null}
      {view.ok && !view.hasCentreline ? (
        <p className="db-pending">
          <span className="db-pending-tag">{t(locale, 'mapSchematicTag')}</span>
          {t(locale, 'mapSchematicBody')}
        </p>
      ) : null}

      {!view.ok ? (
        <p className="db-empty">{t(locale, 'mapNoGeometry')}</p>
      ) : (
        <>
          <CorridorExplorer
            view={view}
            ui={{
              ...mapUi(locale),
              locale: intlLocale,
              kmUnit: t(locale, 'mapKm'),
              mUnit: locale === 'bn' ? 'মি' : locale === 'zh' ? '米' : 'm',
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
          {showLegend ? (
            <div className="db-map-legends">
              <ul className="db-map-legend">
                {CONDITION_KEYS.map((k) => (
                  <li key={k}>
                    <span className="db-map-swatch" style={{ background: CONDITION_COLOUR[k] }} aria-hidden="true" />
                    {t(locale, `traffic_${k}`)}
                  </li>
                ))}
              </ul>
              <ul className="db-map-legend db-map-legend-points">
                <li><span className="db-map-key db-map-key-terminal" aria-hidden="true" />{t(locale, 'mapKeyTerminal')}</li>
                <li><span className="db-map-key db-map-key-wp" aria-hidden="true" />{t(locale, 'mapKeyWaypoint')}</li>
                <li><span className="db-map-key db-map-key-toll" aria-hidden="true" />{t(locale, 'kindTollPlaza')}</li>
                <li><span className="db-map-key db-map-key-bridge" aria-hidden="true" />{t(locale, 'kindBridge')}</li>
                <li><span className="db-map-key db-map-key-pending" aria-hidden="true" />{t(locale, 'statusConstruction')}</li>
              </ul>
            </div>
          ) : null}
        </>
      )}
    </section>
  );
}
