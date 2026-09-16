import { getRequestLocale } from '../../lib/i18n/request-locale.js';
import { getPageBySlugCached, getPageBlocksCached } from '../../lib/content/cache.js';
import { NOT_FOUND_SLUG } from '../../lib/content/slug.js';
import { t } from '../../lib/i18n/ui.js';
import BlockRenderer from '../../components/blocks/BlockRenderer.jsx';

/**
 * The localised 404 — a block document (W1.19).
 *
 * The page an operator edits is the `pages` row with slug `not-found`. It is
 * rendered here, inside the locale chrome, with the 404 status Next attaches
 * to a not-found boundary, so a missing URL looks like the rest of the site
 * and still tells a crawler the truth. The old app/not-found.jsx read the
 * dead `content` table and was English-only under every locale.
 *
 * When the row is missing or unpublished — a fresh install before
 * 23-not-found.sql, or an operator who unpublished it — the ui_strings
 * fallback renders, so a 404 can never itself be a blank page.
 */
/**
 * Its own title (W8N.6, NAV-WAY-04). Every other page names itself in the tab
 * and in a bookmark; the 404 inherited the home page's, so a reader with six
 * tabs open could not tell which one had failed.
 */
export async function generateMetadata() {
  const locale = getRequestLocale();
  return { title: t(locale, 'notFoundHeading'), robots: { index: false, follow: true } };
}

export default async function LocaleNotFound() {
  const locale = getRequestLocale();

  let page = null;
  let blocks = [];
  try {
    page = await getPageBySlugCached(NOT_FOUND_SLUG);
    if (page?.status === 'published') blocks = await getPageBlocksCached(page.id, NOT_FOUND_SLUG, locale);
  } catch {
    blocks = [];
  }

  /**
   * The way out, under whatever the page says: a search field and the site map
   * (W8N.6, NAV-WAY-04). A 404 whose only exit is the home page makes the
   * reader start their journey again from the top.
   */
  const waysOut = (
    <section className="db-block db-notfound-help">
      <form className="db-search-form" role="search" action={`/${locale}/search`}>
        <label className="db-search-label" htmlFor="db-404-q">{t(locale, 'searchLabel')}</label>
        <div className="db-search-row">
          <input id="db-404-q" className="db-search-input" type="search" name="q" autoComplete="off" />
          <button type="submit" className="db-btn db-btn-primary">{t(locale, 'searchButton')}</button>
        </div>
      </form>
      <p className="db-actions">
        <a href={`/${locale}`} className="db-btn">{t(locale, 'notFoundHome')}</a>
        <a href={`/${locale}/sitemap`} className="db-btn">{t(locale, 'navSitemap')}</a>
      </p>
    </section>
  );

  if (blocks.length > 0) {
    return (
      <>
        <BlockRenderer blocks={blocks} locale={locale} />
        {waysOut}
      </>
    );
  }

  return (
    <>
    <section className="db-block">
      <h1 className="db-h1">{t(locale, 'notFoundHeading')}</h1>
      <p className="db-lede">{t(locale, 'notFoundBody')}</p>
    </section>
    {waysOut}
    </>
  );
}
