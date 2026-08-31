// lib/content/slug.js
/** Pure helpers, kept out of the 'use server' module: Next 15 allows only
 *  async exports there, and tests need to import these directly. */

// pages.slug is VARCHAR(191) (scripts/db-setup-v2.mjs). 150 stays comfortably
// under that so a long title never reaches the database as a raw "Data too
// long" error.
const MAX_SLUG_LENGTH = 150;

export function normalizeSlug(value) {
  const slug = String(value || '')
    .toLowerCase()
    .split('/')
    .map((part) => part.replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''))
    .filter(Boolean)
    .join('/');
  // A hard cut can land on a separator ("-" or "/"); strip it so the result
  // still satisfies isValidSlug.
  return slug.slice(0, MAX_SLUG_LENGTH).replace(/[-/]+$/g, '');
}

export function isValidSlug(value) {
  return /^[a-z0-9]+(?:[-/][a-z0-9]+)*$/.test(String(value || ''));
}
