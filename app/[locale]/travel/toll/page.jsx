import { notFound } from 'next/navigation';
import { isLocale } from '../../../../lib/i18n/locales';
import { alternatesFor } from '../../../../lib/seo/alternates.js';
import { t } from '../../../../lib/i18n/ui';
import { getTollRatesCached, getIllustrativeCached } from '../../../../lib/corridor/cache';
import { formatTaka, classLabel } from '../../../../lib/corridor/tolls';
import { getProhibitedVehicles } from '../../../../lib/settings';
import IllustrativeNotice from '../../../../components/corridor/IllustrativeNotice';

export async function generateMetadata({ params }) {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return {
    title: t(locale, 'travelToll'),
    description: t(locale, 'travelTollIntro'),
    alternates: alternatesFor('/travel/toll', locale),
  };
}

export default async function TollPage({ params }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  // A dead query must not produce a stack trace in a browser — this is a
  // public page on a shared host. rates=[] falls through to the "no toll
  // rates" message below; illustrative defaults true, the same safe
  // direction isDataIllustrative() takes internally when its own read
  // fails. getProhibitedVehicles is excluded from this guard: it already
  // degrades to [] internally (lib/settings.js's getSetting catches its own
  // query) and never rejects.
  let rates = [];
  let illustrative = true;
  try {
    [rates, illustrative] = await Promise.all([
      getTollRatesCached(),
      getIllustrativeCached(),
    ]);
  } catch {
    // Fall through with the safe defaults above.
  }
  const prohibited = await getProhibitedVehicles(locale);

  return (
    <>
      <header className="db-page-head">
        <h1 className="db-h1">{t(locale, 'travelToll')}</h1>
        <p className="db-lede">{t(locale, 'travelTollIntro')}</p>
      </header>

      {illustrative ? <IllustrativeNotice locale={locale} /> : null}

      <section className="db-block">
        {rates.length === 0 ? (
          <p className="db-empty-inline">{t(locale, 'noTollRates')}</p>
        ) : (
          <div className="db-scroll-x">
            <table className="db-table">
              <caption className="db-table-caption">{t(locale, 'tollCaption')}</caption>
              <thead>
                <tr>
                  <th scope="col">{t(locale, 'colVehicle')}</th>
                  <th scope="col">{t(locale, 'colSection')}</th>
                  <th scope="col" className="db-col-right">{t(locale, 'colToll')}</th>
                </tr>
              </thead>
              <tbody>
                {rates.map((r) => (
                  <tr key={r.id}>
                    <th scope="row">{classLabel(r, locale)}</th>
                    <td>{r.section || '—'}</td>
                    <td className="db-num db-toll-amount">{formatTaka(r.amount_bdt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {prohibited.length > 0 ? (
          <div className="db-prohibited">
            <h2 className="db-h2">{t(locale, 'prohibitedVehicles')}</h2>
            <p className="db-lede">{t(locale, 'prohibitedNote')}</p>
            <ul className="db-prohibited-list">
              {prohibited.map((vehicle) => (
                <li key={vehicle}>
                  <span className="db-tag db-tag-alert">{vehicle}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </section>
    </>
  );
}
