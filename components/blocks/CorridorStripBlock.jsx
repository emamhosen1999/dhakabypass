import { getCorridorSummaryCached, getInterchangesCached } from '../../lib/corridor/cache.js';
import { buildStripModel } from '../../lib/corridor/strip.js';
import CorridorStrip from '../corridor/CorridorStrip.jsx';

const text = (v) => (typeof v === 'string' ? v.trim() : '');
const EMPTY = { extent: { from_m: 0, to_m: 0, length_m: 0 }, openLength: 0, percentOpen: 0, segments: [] };

/** Same readers and same degradation as /travel/status; see ProgressBarBlock. */
export default async function CorridorStripBlock({ data, locale }) {
  let summary = EMPTY;
  let interchanges = [];
  try {
    [summary, interchanges] = await Promise.all([getCorridorSummaryCached(), getInterchangesCached()]);
  } catch { /* safe defaults */ }

  const model = buildStripModel({ segments: summary.segments, interchanges, locale });
  const heading = text(data?.heading);
  const intro = text(data?.intro);

  return (
    <section className="db-block db-strip-block">
      {heading ? <h2 className="db-h2">{heading}</h2> : null}
      {intro ? <p className="db-lede">{intro}</p> : null}
      <CorridorStrip model={model} locale={locale} />
    </section>
  );
}
