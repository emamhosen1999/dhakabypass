import { countMissing } from './resolve.js';
import { LOCALES, DEFAULT_LOCALE } from '../i18n/locales.js';

/** Per-page translation coverage, for the admin dashboard. */
export function summarizeTranslations(pagesWithBlocks) {
  return (pagesWithBlocks || []).map((page) => {
    const rows = (page.blocks || []).map((b) => b.translations || []);
    const missing = {};
    for (const locale of LOCALES) {
      if (locale === DEFAULT_LOCALE) continue;
      missing[locale] = countMissing(rows, locale);
    }
    return { pageId: page.id, slug: page.slug, title: page.title, total: rows.length, missing };
  });
}
