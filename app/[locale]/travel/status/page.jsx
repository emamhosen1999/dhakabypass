import { notFound } from 'next/navigation';
import { isLocale } from '../../../../lib/i18n/locales';
import { t } from '../../../../lib/i18n/ui';
import {
  getCorridorSummaryCached, getInterchangesCached, getIllustrativeCached,
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

export default async function StatusPage({ params }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const [summary, interchanges, illustrative] = await Promise.all([
    getCorridorSummaryCached(),
    getInterchangesCached(),
    getIllustrativeCached(),
  ]);

  const model = buildStripModel({ segments: summary.segments, interchanges, locale });

  return (
    <>
      <header className="db-page-head">
        <h1 className="db-h1">{t(locale, 'travelStatus')}</h1>
        <p className="db-lede">{t(locale, 'travelStatusIntro')}</p>
      </header>

      {illustrative ? <IllustrativeNotice locale={locale} /> : null}

      <section className="db-block">
        <ProgressBar summary={summary} locale={locale} />
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
