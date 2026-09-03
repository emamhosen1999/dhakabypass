// lib/json.js
//
// The single home for the two shape guards the row-shaping code in
// lib/corridor/* uses on JSON columns.

/**
 * Parse a JSON column defensively. MySQL auto-parses JSON columns, so a
 * scalar value comes back already unwrapped (e.g. the string `cafe`) and
 * re-parsing it throws; MariaDB never auto-parses, so a malformed value
 * comes back as a plain string that parses but isn't the shape we need.
 * Either way a bad row must degrade to `fallback`, never crash the list.
 *
 * `fallback` is required by convention at every call site: the caller knows
 * whether the column holds an object or an array, and this helper must not
 * guess. Note this is deliberately NOT the same contract as the throwing
 * one-liners in lib/settings.js and lib/content/pages.js, whose callers want
 * a parse failure to surface — do not merge those into this one.
 */
export const asJson = (v, fallback) => {
  if (v == null) return fallback;
  if (typeof v !== 'string') return v;
  try {
    return JSON.parse(v);
  } catch {
    return fallback;
  }
};

/** True for `{...}` only — null and arrays are excluded. Used to decide
 *  whether a parsed JSON column is the locale/label map it is supposed to be
 *  before anything reads keys off it. */
export const isPlainObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
