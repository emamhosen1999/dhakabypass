import { getCorridorSummaryCached, getInterchangesCached, getPublishedLengthKmCached, getTollRatesCached } from '../../lib/corridor/cache.js';
import { resolveStats, sourcesNeeded } from '../../lib/blocks/liveStats.js';

const safe = async (fn) => { try { return await fn(); } catch { return null; } };

export default async function StatRowBlock({ data }) {
  const need = sourcesNeeded(data.stats);
  const has = (...keys) => keys.some((k) => need.has(k));
  const [summary, publishedLengthKm, tollRates, interchanges] = await Promise.all([
    has('corridor-measured-length', 'corridor-open-length') ? safe(getCorridorSummaryCached) : null,
    has('corridor-published-length') ? safe(getPublishedLengthKmCached) : null,
    has('toll-class-count') ? safe(getTollRatesCached) : null,
    has('interchange-count') ? safe(getInterchangesCached) : null,
  ]);
  const stats = resolveStats(data.stats, { summary, publishedLengthKm, tollRates, interchanges });
  if (stats.length === 0) return null;
  return (
    <section className="db-block db-statrow">
      <dl className="db-statrow-grid">
        {stats.map((s, i) => (
          <div key={i} className="db-stat">
            {/* dt must precede dd for valid HTML and screen-reader order. Visual order is handled by CSS. */}
            <dt className="db-stat-label">{s.label}</dt>
            <dd className="db-stat-value">
              {s.value}
              {s.unit ? <span className="db-stat-unit">{s.unit}</span> : null}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
