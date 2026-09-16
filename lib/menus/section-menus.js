import { cache } from 'react';
import { query, dbEnabled } from '../db.js';
import { CHROME_MENU_SLUGS, SECTION_MENU_SLUGS } from './slugs.js';

/**
 * The menus a `section-subnav` block may render, read from the database
 * (W8N.3, NAV-IA-02/03, NAV-CMS-01).
 *
 * Every menu an operator has created at /admin/menus EXCEPT the chrome ones:
 * main, cta, footer and legal are the header and the footer, and a block that
 * re-rendered the site navigation halfway down a page would be a second copy
 * of the same links.
 *
 * The built-in list is unioned in, never replaced, so the travel sub-nav keeps
 * working during a database outage — and so this function can be read in a
 * no-database build without special-casing it at the call site.
 */
export const sectionMenuSlugs = cache(async () => {
  const builtIn = [...SECTION_MENU_SLUGS];
  if (!dbEnabled()) return builtIn;
  let rows = [];
  try {
    rows = await query('SELECT slug FROM menus ORDER BY slug') || [];
  } catch {
    return builtIn;
  }
  const fromDb = rows
    .map((r) => String(r.slug || '').trim())
    .filter((slug) => slug && !CHROME_MENU_SLUGS.includes(slug));
  return [...new Set([...builtIn, ...fromDb])];
});
