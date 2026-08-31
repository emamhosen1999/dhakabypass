// lib/content/slug.js
/** Pure helpers, kept out of the 'use server' module: Next 15 allows only
 *  async exports there, and tests need to import these directly. */
export function normalizeSlug(value) {
  return String(value || '')
    .toLowerCase()
    .split('/')
    .map((part) => part.replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''))
    .filter(Boolean)
    .join('/');
}

export function isValidSlug(value) {
  return /^[a-z0-9]+(?:[-/][a-z0-9]+)*$/.test(String(value || ''));
}
