import { notFound } from 'next/navigation';
import Link from 'next/link';
import { isLocale } from '../../lib/i18n/locales.js';
import { getPageBySlugCached, getPageBlocksCached } from '../../lib/content/cache.js';
import { resolveTranslation } from '../../lib/content/resolve.js';
import { alternatesFor } from '../../lib/seo/alternates.js';
import BlockRenderer from '../../components/blocks/BlockRenderer.jsx';
import {
  getCorridorSummaryCached, getInterchangesCached, getTollRatesCached, getIllustrativeCached,
  getPublishedLengthKmCached,
} from '../../lib/corridor/cache';
import { buildStripModel } from '../../lib/corridor/strip';
import { formatTaka } from '../../lib/corridor/tolls';
import CorridorStrip from '../../components/corridor/CorridorStrip';
import InterchangeTable from '../../components/corridor/InterchangeTable';
import ProgressBar from '../../components/corridor/ProgressBar';
import IllustrativeNotice from '../../components/corridor/IllustrativeNotice';
import { t } from '../../lib/i18n/ui';

// Safe defaults for a dead database, mirroring app/[locale]/travel/status/page.jsx:
// the home page is the most-visited route on a memory-limited shared host, so a
// dead query must render a degraded page rather than take the whole front door
// down with it. illustrative defaults true — the same safe direction
// isDataIllustrative() takes internally when its own read fails.
const EMPTY_SUMMARY = { extent: { from_m: 0, to_m: 0, length_m: 0 }, openLength: 0, percentOpen: 0, segments: [] };

async function load(params) {
  const { locale } = await params;
  if (!isLocale(locale)) return null;
  const page = await getPageBySlugCached('home');
  return { locale, page };
}

// Mirrors the content check below: metadata for a draft/missing home must
// not disagree with what actually renders, and it must not read fields off
// a page that isn't published.
export async function generateMetadata({ params }) {
  const loaded = await load(params);
  // An unsupported locale segment is a 404 — no alternates for a URL that
  // does not resolve.
  if (!loaded) return {};

  // hreflang is a statement about which URLs EXIST, not about what they say.
  // Unlike the title and description below it does not depend on the page
  // being published: this route returns 200 in all three locales either way
  // (an unpublished home renders the "nothing created yet" message rather
  // than 404ing — see the component). And it does not depend on a locale
  // having its own translation either: a missing bn row falls back to English
  // and /bn still renders. So the alternates are declared unconditionally
  // from here on, and the metadata that IS content-dependent is layered on.
  const alternates = alternatesFor('/', loaded.locale);
  if (loaded.page?.status !== 'published') return { alternates };

  const rows = loaded.page.translations.map((tr) => ({
    locale: tr.locale, status: tr.status,
    data: { title: tr.seo_title || tr.title, description: tr.seo_description },
  }));
  const resolved = resolveTranslation(rows, loaded.locale);
  return resolved
    ? { title: resolved.data.title, description: resolved.data.description, alternates }
    : { alternates };
}

export default async function LocaleHome({ params }) {
  const loaded = await load(params);
  if (!loaded) notFound(); // bad/unsupported locale segment — genuinely not found

  const { locale, page } = loaded;

  // Unlike /[locale]/[...slug], an unpublished or missing home page does NOT
  // 404 here. The home route is the site's front door — a draft home (or one
  // that hasn't been created yet, which is the DB default: pages.status
  // DEFAULTS to 'draft', so a row created outside the admin — a seed script,
  // manual SQL, a future import — lands as draft) reads to an operator as
  // "nothing published yet", not "this URL doesn't exist". It must still
  // never render draft content, so status is checked before any blocks are
  // fetched.
  if (!page || page.status !== 'published') {
    return <p className="db-empty">No home page has been created yet.</p>;
  }

  const blocks = await getPageBlocksCached(page.id, 'home');

  let summary = EMPTY_SUMMARY;
  let interchanges = [];
  let rates = [];
  let illustrative = true;
  let publishedLengthKm = null;
  try {
    [summary, interchanges, rates, illustrative, publishedLengthKm] = await Promise.all([
      getCorridorSummaryCached(), getInterchangesCached(), getTollRatesCached(), getIllustrativeCached(),
      getPublishedLengthKmCached(),
    ]);
  } catch {
    // A dead query must not produce a stack trace in a browser — this is the
    // most-visited page on the site. Fall through with the safe defaults above.
  }
  const model = buildStripModel({ segments: summary.segments, interchanges, locale });
  // The car rate is the one most visitors are looking for.
  const topRate = rates.find((r) => r.vehicle_class === 'car') || rates[0] || null;

  // The hero is the masthead and sits above the corridor summary; everything
  // else sits below it, so the first actionable thing on the page is always
  // the live status of the road.
  const heroBlocks = blocks.filter((b) => b.type === 'hero');
  const restBlocks = blocks.filter((b) => b.type !== 'hero');

  return (
    <>
      <BlockRenderer blocks={heroBlocks} locale={locale} />
      {summary.segments.length === 0 ? null : (
        <section className="db-block">
          <h2 className="db-h2">{t(locale, 'homeCorridorHeading')}</h2>
          {illustrative ? <IllustrativeNotice locale={locale} /> : null}
          <ProgressBar summary={summary} locale={locale} publishedLengthKm={publishedLengthKm} />
          <CorridorStrip model={model} locale={locale} />
          <InterchangeTable interchanges={model.markers.slice(0, 5)} locale={locale} />
          <p className="db-actions">
            <Link href={`/${locale}/travel/toll`} className="db-btn db-btn-primary">
              {t(locale, 'seeAllTolls')}{topRate ? ` — ${formatTaka(topRate.amount_bdt)}` : ''}
            </Link>
            <Link href={`/${locale}/travel/route`} className="db-btn db-btn-secondary">
              {t(locale, 'seeRoute')}
            </Link>
          </p>
        </section>
      )}
      <BlockRenderer blocks={restBlocks} locale={locale} />
    </>
  );
}
