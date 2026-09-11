import { getCorridorSummaryCached, getIllustrativeCached, getPublishedLengthKmCached } from '../../lib/corridor/cache.js';
import ProgressBar from '../corridor/ProgressBar.jsx';
import IllustrativeNotice from '../corridor/IllustrativeNotice.jsx';

const text = (v) => (typeof v === 'string' ? v.trim() : '');
const EMPTY = { extent: { from_m: 0, to_m: 0, length_m: 0 }, openLength: 0, percentOpen: 0, segments: [] };

/**
 * Reads exactly what /travel/status reads, through the same cached readers,
 * and degrades the same way: a failed query falls through to a zero summary
 * rather than a stack trace on a public page. `illustrative` is the corridor
 * flag saying the segment data is a sample, and the notice it triggers is
 * driven by that flag alone — no block field can hide it.
 */
export default async function ProgressBarBlock({ data, locale }) {
  let summary = EMPTY;
  let illustrative = true;
  let publishedLengthKm = null;
  try {
    [summary, illustrative, publishedLengthKm] = await Promise.all([
      getCorridorSummaryCached(),
      getIllustrativeCached(),
      getPublishedLengthKmCached(),
    ]);
  } catch { /* fall through with the safe defaults */ }

  const heading = text(data?.heading);
  const intro = text(data?.intro);

  return (
    <section className="db-block db-progress-block">
      {heading ? <h2 className="db-h2">{heading}</h2> : null}
      {intro ? <p className="db-lede">{intro}</p> : null}
      {illustrative ? <IllustrativeNotice locale={locale} /> : null}
      <ProgressBar summary={summary} locale={locale} publishedLengthKm={publishedLengthKm} />
    </section>
  );
}
