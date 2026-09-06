import { isPlainObject } from '../json.js';

/**
 * The guard every list-backed block runs before it reads a key off a row.
 *
 * A `list` field is stored as raw JSON and validated only as "is an array"
 * (lib/blocks/registry.js), so the seed scripts, the legacy import and
 * hand-written SQL can all put a string, a number or a nested array where a
 * row object was expected. BlockRenderer already refuses to render a block
 * whose whole `data` is the wrong shape; this is the same rule one level
 * down, so one malformed row degrades itself instead of throwing inside the
 * component and taking /en, /bn and /zh with it.
 */
export function listItems(value) {
  return Array.isArray(value) ? value.filter(isPlainObject) : [];
}

/** Trimmed string for a possibly-absent authored value. Never `undefined`. */
export function text(value) {
  return typeof value === 'string' ? value.trim() : typeof value === 'number' ? String(value) : '';
}
