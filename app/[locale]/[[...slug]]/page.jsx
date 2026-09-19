import { notFound, permanentRedirect } from 'next/navigation';
import { redirectOrNotFound } from '../../../lib/redirects/resolve.js';
import { isLocale } from '../../../lib/i18n/locales.js';
import { getPageBySlugCached, getPageBlocksCached } from '../../../lib/content/cache.js';
import { resolveTranslation } from '../../../lib/content/resolve.js';
import { alternatesFor } from '../../../lib/seo/alternates.js';
import { pathForSlug, HOME_PATH } from '../../../lib/seo/routes.js';
import { routeMetaFor } from '../../../lib/seo/cache.js';
import { applyRouteMeta } from '../../../lib/seo/route-meta.js';
import { getSeoSettingsCached } from '../../../lib/seo/cache.js';
import { brandedTitle } from '../../../lib/seo/settings.js';
import { withSocialCard } from '../../../lib/seo/social.js';
import { t } from '../../../lib/i18n/ui.js';
import { HOME_SLUG, NOT_FOUND_SLUG } from '../../../lib/content/slug.js';
import BlockRenderer from '../../../components/blocks/BlockRenderer.jsx';
import Breadcrumbs from '../../../components/chrome/Breadcrumbs.jsx';
import StructuredData from '../../../components/chrome/StructuredData.jsx';
import { breadcrumbJsonLd } from '../../../lib/seo/organization.js';

/**
 * THE ONLY PUBLIC CONTENT RENDERER.
 *
 * Every public page — the home page included — is a `pages` row and a list of
 * blocks. This file is an OPTIONAL catch-all (`[[...slug]]`) so that `/en` and
 * `/en/travel/toll` are the same code path: an empty slug is the `home` row,
 * anything else is the row whose slug is the path. The home page used to have
 * its own file, app/[locale]/page.jsx, which force-hoisted hero blocks and
 * rendered a hardcoded corridor section between two BlockRenderer calls. That
 * section is now four blocks in the `home` document (18-home-corridor.sql),
 * and the file is gone — which is what makes "no content is hardcoded" a
 * property of the tree rather than a promise.
 *
 * The two routes that remain as code under app/[locale]/ are the declared
 * exceptions in the plan ("W1.8 (rewritten)"): /news/[slug] is a template,
 * /preview/[id] is staff-only. /travel, once a bare redirect() file, is a
 * `redirects` row (21-travel-redirect.sql) that lands in redirectOrNotFound
 * below like any other operator-configured move.
 */

/**
 * `/en/home` is not a URL. The home row renders at `/en` and nowhere else;
 * letting it also answer at `/en/home` would publish the front page twice and
 * split whatever ranking it earns. A permanent redirect rather than a 404,
 * because a reader who typed it meant the home page.
 *
 * `/en/not-found` is not a URL either: that row is the 404 document, rendered
 * by app/[locale]/not-found.jsx with a 404 status. Asking for it by name
 * 404s — which renders it, with the right status.
 */

async function load(params) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) return null;
  const parts = Array.isArray(slug) ? slug : [];
  const isHome = parts.length === 0;
  const page = await getPageBySlugCached(isHome ? HOME_SLUG : parts.join('/'));
  // The home page never returns null for a valid locale: a missing or draft
  // home row is the "nothing created yet" state, not a 404 — see the component.
  return page || isHome ? { locale, page, isHome, parts } : null;
}

/**
 * THE DOCUMENT WINS. This is the boundary `route_meta` must not cross.
 *
 * Every page rendered here has a `pages` row, and its title and description
 * live on `page_translations.seo_title` / `seo_description` - written on the
 * same screen where the page's blocks are edited. A `route_meta` row that ALSO
 * carried a title for these URLs would be a second source of truth for one
 * fact, and an operator looking at the two screens would have no way to tell
 * which one the page was actually using.
 *
 * So `applyRouteMeta` only FILLS what the document left empty, and only
 * OVERRIDES the two things `page_translations` has no column for: `robots` and
 * `canonical`. That is what an operator gains here - the ability to mark a
 * published page noindex, or point its canonical at another URL, without
 * asking for a deploy.
 *
 * Since W1.8 every ordinary public route is a block document, so this function
 * is where nearly all of the site's metadata is built.
 */
export async function generateMetadata({ params }) {
  const loaded = await load(params);
  // An unsupported locale segment is a 404 — no alternates for a URL that
  // does not resolve.
  if (!loaded) return {};

  // hreflang is a statement about which URLs EXIST, not about what they say.
  // A draft or missing page here 404s in the component below, so it declares
  // no alternates at all — publishing them would advertise three dead URLs to
  // a crawler — and no route_meta either: a directive about a URL that 404s is
  // a statement about nothing.
  //
  // The home route is the exception. It returns 200 in all three locales
  // whether or not the row is published (an unpublished home renders the
  // "nothing created yet" message rather than 404ing), so its alternates are
  // declared unconditionally and the content-dependent metadata is layered on.
  const published = loaded.page?.status === 'published';
  if (!published && !loaded.isHome) return {};
  if (loaded.page?.slug === NOT_FOUND_SLUG) return {};

  const path = loaded.isHome ? HOME_PATH : pathForSlug(loaded.page.slug);
  const alternates = alternatesFor(path, loaded.locale);
  if (!published) return { alternates };

  const rows = loaded.page.translations.map((tr) => ({
    locale: tr.locale, status: tr.status,
    data: { title: tr.seo_title || tr.title, description: tr.seo_description, ogImage: tr.og_image },
  }));
  const resolved = resolveTranslation(rows, loaded.locale);
  const base = resolved
    ? { title: resolved.data.title, description: resolved.data.description, alternates }
    : { alternates };
  const meta = applyRouteMeta(base, await routeMetaFor(path, loaded.locale));
  // A share card on every page: description from the page or its first
  // prose, image from the page, its first picture, or the site default.
  let blocks = [];
  let site = {};
  try {
    [blocks, site] = await Promise.all([
      getPageBlocksCached(loaded.page.id, loaded.page.slug, loaded.locale),
      getSeoSettingsCached(loaded.locale),
    ]);
  } catch { blocks = []; site = {}; }
  // The locale layout appends the road name (E2). A title that already carries
  // it — the home page, or one an editor typed the brand into — is marked
  // absolute instead of repeating it.
  if (typeof meta.title === 'string' && site.siteTitle) {
    meta.title = brandedTitle(meta.title, site.siteTitle);
  }
  return withSocialCard(meta, {
    page: { title: resolved?.data.title, description: resolved?.data.description, ogImage: resolved?.data.ogImage },
    site: { title: site.siteTitle, description: site.siteDescription, ogImage: site.ogImage },
    blocks, locale: loaded.locale, path,
  });
}

export default async function CmsPage({ params, searchParams }) {
  const loaded = await load(params);
  // A URL whose first segment is not a locale — /old-economic-impact,
  // /project/overview — lands here rather than in app/[...unmatched], because
  // `[locale]` is a dynamic segment and Next prefers it. This is therefore
  // where an operator-configured redirect has to be checked, and it 404s
  // exactly as before when none matches.
  //
  // An unpublished page is NOT redirect-eligible — it exists and the operator
  // has chosen not to show it, which is a 404, not a move.
  if (!loaded) {
    const { locale: segment, slug: rest } = await params;
    await redirectOrNotFound(`/${[segment, ...(rest || [])].join('/')}`);
  }

  const { locale, page, isHome, parts } = loaded;

  if (!isHome && parts.length === 1 && parts[0] === HOME_SLUG) {
    permanentRedirect(`/${locale}`);
  }
  if (!isHome && parts.length === 1 && parts[0] === NOT_FOUND_SLUG) notFound();

  // Unlike every other document, an unpublished or missing home page does NOT
  // 404. The home route is the site's front door — a draft home (or one that
  // hasn't been created yet, which is the DB default: pages.status DEFAULTS to
  // 'draft', so a row created outside the admin lands as draft) reads to an
  // operator as "nothing published yet", not "this URL doesn't exist". It must
  // still never render draft content, so status is checked before any blocks
  // are fetched.
  if (!page || page.status !== 'published') {
    if (isHome) return <p className="db-empty">{t(locale, 'homeNotCreated')}</p>;
    notFound();
  }

  const blocks = await getPageBlocksCached(page.id, page.slug, locale);
  // The page's place under its parent, for search engines (concession audit
  // CON-SEO-D-02): home, then the parent page, then this one, each titled in
  // the reader's language from page_translations.
  const crumbs = await breadcrumbsFor(page, locale);
  // Handed on unawaited — see the note in BlockRenderer. A block document
  // carrying INT.2's toll calculator answers a journey straight out of the
  // query string, with no JavaScript; every other document — the home page
  // included — ignores this and renders exactly as it did.
  return (
    <>
      <StructuredData data={breadcrumbJsonLd(crumbs)} />
      {/* The same trail the structured data above publishes, drawn for the
          reader as well as the crawler (W8N.4). */}
      <Breadcrumbs crumbs={crumbs} locale={locale} />
      {/* A commitment page not yet approved by counsel says so (W8C.2). */}
      {page.legal_status === 'review' ? (
        <aside className="db-block db-legal-review" role="note">
          <p className="db-pending"><span className="db-pending-tag">{t(locale, 'legalReviewTag')}</span>{t(locale, 'legalReviewBody')}</p>
        </aside>
      ) : null}
      <BlockRenderer blocks={blocks} locale={locale} searchParams={searchParams} />
    </>
  );
}

const titleOf = (page, locale) => {
  const rows = (page?.translations || []).map((tr) => ({ locale: tr.locale, status: tr.status, data: { title: tr.title } }));
  return resolveTranslation(rows, locale)?.data.title || page?.slug || '';
};

async function breadcrumbsFor(page, locale) {
  if (!page || page.slug === HOME_SLUG) return [];
  const crumbs = [{ name: t(locale, 'navHome'), path: `/${locale}` }];
  const parentSlug = page.slug.includes('/') ? page.slug.slice(0, page.slug.lastIndexOf('/')) : '';
  if (parentSlug) {
    try {
      const parent = await getPageBySlugCached(parentSlug);
      if (parent?.status === 'published') crumbs.push({ name: titleOf(parent, locale), path: `/${locale}/${parent.slug}` });
    } catch { /* no parent page: two crumbs */ }
  }
  crumbs.push({ name: titleOf(page, locale), path: `/${locale}/${page.slug}` });
  return crumbs;
}
