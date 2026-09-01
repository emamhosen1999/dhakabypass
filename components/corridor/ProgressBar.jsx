// components/corridor/ProgressBar.jsx
import { formatKm } from '../../lib/corridor/chainage';
import { t } from '../../lib/i18n/ui';

/** The published progress figure, derived from segments — never hand-entered. */
export default function ProgressBar({ summary, locale }) {
  const pct = summary?.percentOpen ?? 0;
  return (
    <div className="db-progress">
      <div className="db-progress-head">
        <span className="db-progress-value">{pct}%</span>
        <span className="db-progress-label">{t(locale, 'openToTraffic')}</span>
      </div>
      <div
        className="db-progress-rail"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={t(locale, 'openToTraffic')}
      >
        <span className="db-progress-fill" style={{ width: `${pct}%` }} />
      </div>
      <p className="db-progress-note">
        {formatKm(summary?.openLength ?? 0)} km / {formatKm(summary?.extent?.length_m ?? 0)} km
      </p>
    </div>
  );
}
