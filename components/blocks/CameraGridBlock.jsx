import { listCameras, publicCamera } from '../../lib/cameras/repo.js';
import { formatChainage } from '../../lib/corridor/chainage.js';
import { t } from '../../lib/i18n/ui.js';
import CameraTile from '../cameras/CameraTile.jsx';

const text = (v) => (typeof v === 'string' ? v.trim() : '');
const INTL = { en: 'en-GB', bn: 'bn-BD', zh: 'zh-CN' };
const name = (names, locale) => (names?.[locale] || names?.en || '');

/**
 * The corridor's CCTV cameras (LIVE block). Every camera is a record at
 * /admin/corridor/cameras; this block stores its heading, introduction and
 * empty message. Camera addresses and credentials never reach the page — the
 * tiles load stills and streams through /api/cameras/<id>/….
 */
export default async function CameraGridBlock({ data = {}, locale }) {
  let cameras = [];
  try { cameras = (await listCameras({ activeOnly: true })).map(publicCamera); } catch { cameras = []; }
  const labels = {
    live: t(locale, 'cameraLive'), online: t(locale, 'cameraOnline'), offline: t(locale, 'cameraOffline'),
    sample: t(locale, 'cameraSample'), watch: t(locale, 'cameraWatch'), stop: t(locale, 'cameraStop'),
    updated: t(locale, 'cameraUpdated'), still: t(locale, 'cameraStill'), intl: INTL[locale] || 'en-GB',
  };
  const heading = text(data.heading);
  const intro = text(data.intro);
  const anySample = cameras.some((c) => c.isSample);
  return (
    <section className="db-block db-cameras-block">
      {heading ? <h2 className="db-h2">{heading}</h2> : null}
      {intro ? <p className="db-lede">{intro}</p> : null}
      {anySample ? <p className="db-pending"><span className="db-pending-tag">{t(locale, 'cameraSample')}</span>{t(locale, 'cameraSampleNote')}</p> : null}
      {cameras.length === 0 ? (
        <p className="db-empty-inline">{text(data.emptyMessage) || t(locale, 'camerasNone')}</p>
      ) : (
        <ul className="db-camera-grid">
          {cameras.map((c) => (
            <li key={c.id}>
              <CameraTile
                labels={labels}
                camera={{
                  ...c,
                  name: name(c.names, locale),
                  place: [c.chainage_m !== null ? formatChainage(c.chainage_m) : '', c.direction].filter(Boolean).join(' · '),
                }}
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
