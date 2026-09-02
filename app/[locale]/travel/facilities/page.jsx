import { notFound } from 'next/navigation';
import { isLocale } from '../../../../lib/i18n/locales';
import { t } from '../../../../lib/i18n/ui';
import { getInterchangesCached, getIllustrativeCached } from '../../../../lib/corridor/cache';
import { localeName } from '../../../../lib/corridor/interchanges';
import { formatChainage } from '../../../../lib/corridor/chainage';
import IllustrativeNotice from '../../../../components/corridor/IllustrativeNotice';

export async function generateMetadata({ params }) {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return { title: t(locale, 'travelFacilities'), description: t(locale, 'travelFacilitiesIntro') };
}

export default async function FacilitiesPage({ params }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  // A dead query must not produce a stack trace in a browser — this is a
  // public page on a shared host. interchanges=[] falls through to the "no
  // facilities" message below; illustrative defaults true, the same safe
  // direction isDataIllustrative() takes internally when its own read fails.
  let interchanges = [];
  let illustrative = true;
  try {
    [interchanges, illustrative] = await Promise.all([
      getInterchangesCached(), getIllustrativeCached(),
    ]);
  } catch {
    // Fall through with the safe defaults above.
  }
  const areas = interchanges.filter((i) => i.kind === 'service_area');

  return (
    <>
      <header className="db-page-head">
        <h1 className="db-h1">{t(locale, 'travelFacilities')}</h1>
        <p className="db-lede">{t(locale, 'travelFacilitiesIntro')}</p>
      </header>

      {illustrative ? <IllustrativeNotice locale={locale} /> : null}

      <section className="db-block">
        {areas.length === 0 ? (
          <p className="db-empty-inline">{t(locale, 'noFacilities')}</p>
        ) : (
          <ul className="db-facility-list">
            {areas.map((a) => (
              <li key={a.id} className="db-facility">
                <h2 className="db-facility-name">{localeName(a, locale)}</h2>
                <p className="db-num db-facility-ch">{formatChainage(a.chainage_m)}</p>
                {Array.isArray(a.facilities) && a.facilities.length > 0 ? (
                  <ul className="db-facility-tags">
                    {a.facilities.map((f, i) => (
                      <li key={i} className="db-tag db-tag-accent">{f}</li>
                    ))}
                  </ul>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
