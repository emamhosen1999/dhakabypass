import { t } from '../../lib/i18n/ui.js';
import { mapUi } from '../../lib/i18n/map-ui.js';
import { buildMapView } from '../../lib/corridor/view.js';
import { getMapTrafficCached } from '../../lib/corridor/traffic-cache.js';
import { getInterchangesCached, getCorridorRoadsCached } from '../../lib/corridor/cache.js';
import { localeName } from '../../lib/corridor/interchanges.js';
import { getSetting } from '../../lib/settings.js';
import Link from 'next/link';
import CorridorExplorer from '../corridor/CorridorExplorer.jsx';
import { localeHref } from '../../lib/blocks/href.js';
import { orLog } from '../../lib/log.js';
import { placesJsonLd } from '../../lib/seo/organization.js';
import StructuredData from '../chrome/StructuredData.jsx';
import LiveRefresh from '../corridor/LiveRefresh.jsx';
import { newestMeasurement } from '../../lib/corridor/freshness.js';

const text = (v) => (typeof v === 'string' ? v.trim() : '');


const CONDITION_COLOUR = {
  free: 'var(--db-traffic-free)',
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
  let roadCode = '';
  try {
    roadCode = String((await getSetting('corridor.road_code', '')) || '').trim();
  } catch {
    roadCode = '';
  }
  let waypoints = [];
  let sections = [];
  let interchanges = [];
  let geometry = [];
  let geoSource = null;
  let source = 'sample';
  try {
    const [traffic, places] = await Promise.all([
      getMapTrafficCached(),
      getInterchangesCached().catch(orLog('map.interchanges_failed', [])),
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

  let roads = [];
  try { roads = await getCorridorRoadsCached(); } catch { roads = []; }
  const view = buildMapView({
    waypoints, sections, features, geometry, locale, km, waypointName: wpLabel, roads,
  });

  const heading = text(data?.heading);
  const intro = text(data?.intro);
  const compact = data?.layout === 'compact';
  const showLegend = !compact && data?.showLegend !== 'no';
  const linkHref = localeHref(text(data?.linkHref) || 'travel/map', locale);
  const linkLabel = text(data?.linkLabel) || t(locale, 'mapOpenFull');

  const notice = source === 'sample' ? (
    <p className="db-pending">
      <span className="db-pending-tag">{t(locale, 'mapSampleTag')}</span>
      {t(locale, 'mapSampleBody')}
    </p>
  ) : (
    <LiveRefresh
      measuredAt={newestMeasurement(sections)}
      labels={{ live: t(locale, 'liveTag'), justNow: t(locale, 'liveJustNow'), minutesAgo: t(locale, 'liveMinutesAgo') }}
    />
  );
  const schematic = view.ok && !view.hasCentreline ? (
    <p className="db-pending">
      <span className="db-pending-tag">{t(locale, 'mapSchematicTag')}</span>
      {t(locale, 'mapSchematicBody')}
    </p>
  ) : null;
  const explorer = !view.ok ? (
    <p className="db-empty">{t(locale, 'mapNoGeometry')}</p>
  ) : (
    <CorridorExplorer
      mode={compact ? 'compact' : 'full'}
      view={{ ...view, live: source !== 'sample' }}
      ui={{
        ...mapUi(locale),
        // The corridor's national road number, from /admin/corridor.
        roadCode,
        locale: intlLocale,
        kmUnit: t(locale, 'mapKm'),
        mUnit: t(locale, 'mapM'),
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
  );

  /**
   * The open toll plazas as Place nodes (E4). The map is the one component
   * that already knows where they are, so the markup travels with it: an
   * operator who places the map on another page gets it there too, and the
   * stable @id per plaza means the same node is described, not a second one.
   */
  const places = placesJsonLd(interchanges, locale);

  /**
   * The compact band (home page): the words beside the map, not above it.
   * Heading, intro, the live line and the link in one column; the map at the
   * corridor's own proportions in the other. Stacks on a phone.
   */
  if (compact) {
    return (
      <section className="db-block db-map-block db-map-block-compact">
        {places ? <StructuredData data={places} /> : null}
        <div className="db-map-band">
          <div className="db-map-band-text">
            {heading ? <h2 className="db-h2">{heading}</h2> : null}
            {intro ? <p className="db-lede">{intro}</p> : null}
            {notice}
            {schematic}
            {view.ok ? (
              <p className="db-actions db-map-open">
                <Link href={linkHref} className="db-btn db-btn-secondary">{linkLabel}</Link>
              </p>
            ) : null}
          </div>
          <div className="db-map-band-map">{explorer}</div>
        </div>
      </section>
    );
  }

  return (
    <section className="db-block db-map-block">
      {places ? <StructuredData data={places} /> : null}
      {heading ? <h2 className="db-h2">{heading}</h2> : null}
      {intro ? <p className="db-lede">{intro}</p> : null}
      {notice}
      {schematic}
      {explorer}
      {view.ok && showLegend ? (
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
    </section>
  );
}
