import { notFound, permanentRedirect } from 'next/navigation';
import { redirectOrNotFound } from '../../../lib/redirects/resolve.js';
import { isLocale } from '../../../lib/i18n/locales.js';
import { getPageBySlugCached, getPageBlocksCached } from '../../../lib/content/cache.js';
import { resolveTranslation } from '../../../lib/content/resolve.js';
import { alternatesFor } from '../../../lib/seo/alternates.js';
import { pathForSlug, HOME_PATH } from '../../../lib/seo/routes.js';
import { routeMetaFor } from '../../../lib/seo/cache.js';
import { applyRouteMeta } from '../../../lib/seo/route-meta.js';
import { t } from '../../../lib/i18n/ui.js';
import BlockRenderer from '../../../components/blocks/BlockRenderer.jsx';

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
 */
const HOME_SLUG = 'home';

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

  const path = loaded.isHome ? HOME_PATH : pathForSlug(loaded.page.slug);
  const alternates = alternatesFor(path, loaded.locale);
  if (!published) return { alternates };

  const rows = loaded.page.translations.map((tr) => ({
    locale: tr.locale, status: tr.status,
    data: { title: tr.seo_title || tr.title, description: tr.seo_description },
  }));
  const resolved = resolveTranslation(rows, loaded.locale);
  const base = resolved
    ? { title: resolved.data.title, description: resolved.data.description, alternates }
    : { alternates };
  return applyRouteMeta(base, await routeMetaFor(path, loaded.locale));
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

  const blocks = await getPageBlocksCached(page.id, page.slug);
  // Handed on unawaited — see the note in BlockRenderer. A block document
  // carrying INT.2's toll calculator answers a journey straight out of the
  // query string, with no JavaScript; every other document — the home page
  // included — ignores this and renders exactly as it did.
  return <BlockRenderer blocks={blocks} locale={locale} searchParams={searchParams} />;
}
