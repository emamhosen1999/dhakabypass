/**
 * The menus this site renders.
 *
 * A plain module rather than an export from the admin's actions file: a
 * `'use server'` file may export async functions ONLY, so a constant there
 * fails the build with "A 'use server' file can only export async functions,
 * found object". lib/errors.js carries the same note for the same reason.
 */
export const MENU_SLUGS = ['main', 'footer'];
