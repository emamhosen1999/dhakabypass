// components/corridor/ProgressBar.jsx
import { formatKm } from '../../lib/corridor/chainage';
import { t } from '../../lib/i18n/ui';

/**
 * The published progress figure, derived from segments — never hand-entered.
 *
 * The percentage is (and must stay) derived from the measured extent — that
 * is what is arithmetically correct. The denominator shown in the note text
 * is the client's published headline figure (48 km), not the measured
 * extent (47.611 km): the client's ruling was to publish 48 km everywhere
 * and use 47.611 km only internally, on the basis that "nobody sees the
 * difference" — which requires this page not to show the measured
 * denominator directly. `publishedLengthKm` is passed in by the page rather
 * than fetched here so this component stays a pure function of its props.
 */
export default function ProgressBar({ summary, locale, publishedLengthKm }) {
  const pct = summary?.percentOpen ?? 0;
  const totalKm = Number.isFinite(publishedLengthKm)
    ? publishedLengthKm
    : Number(formatKm(summary?.extent?.length_m ?? 0));
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
        {formatKm(summary?.openLength ?? 0)} km / {totalKm} km
      </p>
    </div>
  );
}
