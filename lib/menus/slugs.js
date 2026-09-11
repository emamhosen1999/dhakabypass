/**
 * The menus this site renders.
 *
 * A plain module rather than an export from the admin's actions file: a
 * `'use server'` file may export async functions ONLY, so a constant there
 * fails the build with "A 'use server' file can only export async functions,
 * found object". lib/errors.js carries the same note for the same reason.
 */
export const MENU_SLUGS = ['main', 'footer', 'travel'];

/**
 * The menus a `section-subnav` block may render. The header and footer
 * menus are chrome and not offered: a block that re-rendered the main
 * navigation halfway down a page would be a second copy of the same links.
 */
export const SECTION_MENU_SLUGS = ['travel'];
