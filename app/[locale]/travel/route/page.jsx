import { notFound } from 'next/navigation';
import { isLocale } from '../../../../lib/i18n/locales';
import { t } from '../../../../lib/i18n/ui';
import { alternatesFor } from '../../../../lib/seo/alternates.js';
import {
  getCorridorSummaryCached, getInterchangesCached, getIllustrativeCached,
} from '../../../../lib/corridor/cache';
import { buildStripModel } from '../../../../lib/corridor/strip';
import CorridorStrip from '../../../../components/corridor/CorridorStrip';
import InterchangeTable from '../../../../components/corridor/InterchangeTable';
import IllustrativeNotice from '../../../../components/corridor/IllustrativeNotice';

export async function generateMetadata({ params }) {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return {
    title: t(locale, 'travelRoute'),
    description: t(locale, 'travelRouteIntro'),
    alternates: alternatesFor('/travel/route', locale),
  };
}

// Safe defaults for a dead database, matching the status/toll pages: an empty
// corridor renders 0% and the interchange table's own "nothing published
// yet" message rather than throwing out of the query and taking the page
// down with it. illustrative defaults true — the same safe direction
// isDataIllustrative() takes internally when its own read fails.
const EMPTY_SUMMARY = { extent: { from_m: 0, to_m: 0, length_m: 0 }, openLength: 0, percentOpen: 0, segments: [] };

export default async function RoutePage({ params }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  let summary = EMPTY_SUMMARY;
  let interchanges = [];
  let illustrative = true;
  try {
    [summary, interchanges, illustrative] = await Promise.all([
      getCorridorSummaryCached(), getInterchangesCached(), getIllustrativeCached(),
    ]);
  } catch {
    // A dead query must not produce a stack trace in a browser — this is a
    // public page on a shared host. Fall through with the safe defaults above.
  }

  const model = buildStripModel({ segments: summary.segments, interchanges, locale });
  const entries = model.markers.filter((m) => m.kind === 'interchange' || m.kind === 'toll_plaza');

  return (
    <>
      <header className="db-page-head">
        <h1 className="db-h1">{t(locale, 'travelRoute')}</h1>
        <p className="db-lede">{t(locale, 'travelRouteIntro')}</p>
      </header>

      {illustrative ? <IllustrativeNotice locale={locale} /> : null}

      <section className="db-block">
        <CorridorStrip model={model} locale={locale} />
        <InterchangeTable
          interchanges={entries}
          locale={locale}
          caption={t(locale, 'routeCaption')}
        />
      </section>

      {/* The geographic map is deliberately absent: it is gated on official
          corridor geometry from the design consultant. Drawing invented
          coordinates would contradict the provisional-data notice above. */}
    </>
  );
}
