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

  if (blocks.length > 0) return <BlockRenderer blocks={blocks} locale={locale} />;

  return (
    <section className="db-block">
      <h1 className="db-h1">{t(locale, 'notFoundHeading')}</h1>
      <p className="db-lede">{t(locale, 'notFoundBody')}</p>
      <p className="db-actions">
        <a href={`/${locale}`} className="db-btn db-btn-primary">{t(locale, 'notFoundHome')}</a>
      </p>
    </section>
  );
}
