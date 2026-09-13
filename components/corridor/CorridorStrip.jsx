// components/corridor/CorridorStrip.jsx
import { t } from '../../lib/i18n/ui';

const STATUS_KEY = { open: 'statusOpen', construction: 'statusConstruction', planned: 'statusPlanned' };
const INTL = { en: 'en-GB', bn: 'bn-BD', zh: 'zh-CN' };

function openingText(band, locale) {
  if (!band.openingDate) return '';
  const [y, mo, d] = band.openingDate.split('-').map(Number);
  const date = new Intl.DateTimeFormat(INTL[locale] || 'en-GB', { dateStyle: 'long', timeZone: 'UTC' })
    .format(new Date(Date.UTC(y, mo - 1, d)));
  return t(locale, band.status === 'open' ? 'segmentOpened' : 'segmentExpected').replace('{date}', date);
}


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
      {/* --rows drives the strip's height: the number of label rows is a
          property of the DATA (how tightly this corridor's markers cluster),
          not a constant, so the CSS cannot know it in advance. */}
      <div className="db-strip" aria-hidden="true" style={{ '--rows': model.rowCount }}>
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
          {model.markers.map((m) => (
            <span
              key={m.id}
              className="db-marker"
              style={{ left: `${m.leftPct}%`, '--row': m.row }}
            >
              <span className={`db-marker-pin db-marker-${m.status}`} />
              <span className="db-marker-name">{m.name}</span>
              <span className="db-marker-ch">{m.chainage}</span>
            </span>
          ))}
        </div>
      </div>

      {/* The same segments as text, with their status and opening date —
          what the diagram above cannot say to a screen reader or in words. */}
      <ul className="db-strip-segments">
        {model.bands.map((b) => {
          const when = openingText(b, locale);
          return (
            <li key={b.id}>
              <i className={`db-legend-swatch db-band-${b.status}`} aria-hidden="true" />
              <span className="db-strip-seg-name">{b.label || `${b.fromChainage} – ${b.toChainage}`}</span>
              {' '}<span className="db-strip-seg-ch">{b.fromChainage} – {b.toChainage}</span>
              {' · '}{t(locale, STATUS_KEY[b.status] || 'statusPlanned')}
              {when ? <>{' · '}<span className="db-strip-seg-date">{when}</span></> : null}
            </li>
          );
        })}
      </ul>

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
