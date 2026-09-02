import { notFound } from 'next/navigation';
import { isLocale } from '../../../../lib/i18n/locales';
import { t } from '../../../../lib/i18n/ui';
import {
  getCorridorSummaryCached, getInterchangesCached, getIllustrativeCached, getPublishedLengthKmCached,
} from '../../../../lib/corridor/cache';
import { buildStripModel } from '../../../../lib/corridor/strip';
import CorridorStrip from '../../../../components/corridor/CorridorStrip';
import InterchangeTable from '../../../../components/corridor/InterchangeTable';
import ProgressBar from '../../../../components/corridor/ProgressBar';
import IllustrativeNotice from '../../../../components/corridor/IllustrativeNotice';

export async function generateMetadata({ params }) {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return { title: t(locale, 'travelStatus'), description: t(locale, 'travelStatusIntro') };
}

// Safe defaults for a dead database: an empty corridor renders 0% progress
// and the interchange table's own "nothing published yet" message rather
// than throwing out of the query and taking the page down with it.
// illustrative defaults true — the same safe direction isDataIllustrative()
// takes internally when its own read fails.
const EMPTY_SUMMARY = { extent: { from_m: 0, to_m: 0, length_m: 0 }, openLength: 0, percentOpen: 0, segments: [] };

export default async function StatusPage({ params }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  let summary = EMPTY_SUMMARY;
  let interchanges = [];
  let illustrative = true;
  let publishedLengthKm = null;
  try {
    [summary, interchanges, illustrative, publishedLengthKm] = await Promise.all([
      getCorridorSummaryCached(),
      getInterchangesCached(),
      getIllustrativeCached(),
      getPublishedLengthKmCached(),
    ]);
  } catch {
    // A dead query must not produce a stack trace in a browser — this is a
    // public page on a shared host. Fall through with the safe defaults above.
  }

  const model = buildStripModel({ segments: summary.segments, interchanges, locale });

  return (
    <>
      <header className="db-page-head">
        <h1 className="db-h1">{t(locale, 'travelStatus')}</h1>
        <p className="db-lede">{t(locale, 'travelStatusIntro')}</p>
      </header>

      {illustrative ? <IllustrativeNotice locale={locale} /> : null}

      <section className="db-block">
        <ProgressBar summary={summary} locale={locale} publishedLengthKm={publishedLengthKm} />
      </section>

      <section className="db-block">
        <CorridorStrip model={model} locale={locale} />
        <InterchangeTable
          interchanges={model.markers}
          locale={locale}
          caption={t(locale, 'interchangeCaption')}
        />
      </section>
    </>
  );
}
