import { notFound } from 'next/navigation';
import { isLocale } from '../../../../lib/i18n/locales';
import { t } from '../../../../lib/i18n/ui';
import { getPageBySlugCached, getPageBlocksCached } from '../../../../lib/content/cache';
import { getIllustrativeCached } from '../../../../lib/corridor/cache';
import { getProhibitedVehicles } from '../../../../lib/settings';
import BlockRenderer from '../../../../components/blocks/BlockRenderer';
import IllustrativeNotice from '../../../../components/corridor/IllustrativeNotice';

const SLUG = 'travel/rules';

export async function generateMetadata({ params }) {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return { title: t(locale, 'travelRules'), description: t(locale, 'travelRulesIntro') };
}

/**
 * Rules are prose, not data, so this renders CMS blocks. Until an editor creates
 * the page it shows a friendly empty state rather than a 404 — the section
 * navigation links here, and a dead link is worse than a placeholder.
 *
 * Speed limits and procedures in that prose are reconstructed, not supplied by
 * RHD, so IllustrativeNotice appears here exactly as it does on the other
 * corridor pages. The prohibited-vehicles list below it is different in kind —
 * client-confirmed, not reconstructed — so it renders as its own block, after
 * the notice and the prose, with its own heading and the alert tag treatment
 * (matching the toll page), rather than inside the illustrative prose region.
 * That separation is what lets a reader tell which is which.
 */
export default async function RulesPage({ params }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  // A dead query must not produce a stack trace in a browser — this is a
  // public page on a shared host. page=null falls through to the "not
  // published yet" empty state below; illustrative defaults true, the same
  // safe direction isDataIllustrative() takes internally when its own read
  // fails. getProhibitedVehicles is excluded from this guard: it already
  // degrades to [] internally (lib/settings.js's getSetting catches its own
  // query) and never rejects.
  let page = null;
  let illustrative = true;
  try {
    [page, illustrative] = await Promise.all([
      getPageBySlugCached(SLUG),
      getIllustrativeCached(),
    ]);
  } catch {
    // Fall through with the safe defaults above.
  }

  let blocks = [];
  if (page && page.status === 'published') {
    try {
      blocks = await getPageBlocksCached(page.id, SLUG);
    } catch {
      // Fall through to the empty state below.
    }
  }

  const prohibited = await getProhibitedVehicles(locale);

  return (
    <>
      <header className="db-page-head">
        <h1 className="db-h1">{t(locale, 'travelRules')}</h1>
        <p className="db-lede">{t(locale, 'travelRulesIntro')}</p>
      </header>

      {illustrative ? <IllustrativeNotice locale={locale} /> : null}

      {blocks.length === 0 ? (
        <p className="db-empty">{t(locale, 'rulesEmpty')}</p>
      ) : (
        <BlockRenderer blocks={blocks} locale={locale} />
      )}

      {prohibited.length > 0 ? (
        <section className="db-block db-prohibited">
          <h2 className="db-h2">{t(locale, 'prohibitedVehicles')}</h2>
          <p className="db-lede">{t(locale, 'prohibitedNote')}</p>
          <ul className="db-prohibited-list">
            {prohibited.map((vehicle) => (
              <li key={vehicle}>
                <span className="db-tag db-tag-alert">{vehicle}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </>
  );
}
