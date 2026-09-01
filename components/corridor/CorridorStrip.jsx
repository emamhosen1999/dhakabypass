// components/corridor/CorridorStrip.jsx
import { t } from '../../lib/i18n/ui';

const STATUS_KEY = { open: 'statusOpen', construction: 'statusConstruction', planned: 'statusPlanned' };

/**
 * The schematic corridor. aria-hidden by design: it is a diagram, and
 * InterchangeTable renders the same data as a real table for assistive tech and
 * keyboard users. Status is carried by colour AND hatching AND the text label in
 * that table — never by colour alone.
 */
export default function CorridorStrip({ model, locale }) {
  if (!model || model.bands.length === 0) return null;

  return (
    <div className="db-strip-wrap">
      <div className="db-strip" aria-hidden="true">
        <div className="db-strip-rail">
          {model.bands.map((b) => (
            <span
              key={b.id}
              className={`db-band db-band-${b.status}`}
              style={{ left: `${b.leftPct}%`, width: `${b.widthPct}%` }}
            />
          ))}
        </div>
        <div className="db-strip-markers">
          {model.markers.map((m, i) => (
            <span
              key={m.id}
              className={i % 2 === 1 ? 'db-marker db-marker-alt' : 'db-marker'}
              style={{ left: `${m.leftPct}%` }}
            >
              <span className={`db-marker-pin db-marker-${m.status}`} />
              <span className="db-marker-name">{m.name}</span>
              <span className="db-marker-ch">{m.chainage}</span>
            </span>
          ))}
        </div>
      </div>

      <p className="db-strip-legend">
        {model.legend.map((s) => (
          <span key={s} className="db-legend-item">
            <i className={`db-legend-swatch db-band-${s}`} aria-hidden="true" />
            {t(locale, STATUS_KEY[s] || 'statusPlanned')}
          </span>
        ))}
      </p>
    </div>
  );
}
