// lib/errors.js
//
// The single home for the two error helpers the admin layer depends on.
//
// This is an ORDINARY module on purpose. A module carrying the `'use server'`
// directive may export async functions only — a synchronous export there fails
// `next build` — so these cannot live in an actions file even though that is
// where they are used. Actions import them from here instead.

/**
 * Marks an error as one of our own deliberate, user-facing validation
 * messages (bad input, an overlap, a row that's gone) rather than a driver
 * failure or a misconfiguration message.
 *
 * The `code` is the ONLY thing `friendly()` below allowlists on, so every
 * validation throw that is meant to reach an editor's screen must be built
 * here. A plain `new Error(...)` thrown from a repository is — correctly —
 * flattened into a generic message.
 */
export function validationError(message) {
  const err = new Error(message);
  err.code = 'VALIDATION';
  return err;
}

/**
 * ALLOWLIST, NOT A DENYLIST. Read this before changing it.
 *
 * Only errors WE raised and marked `.code = 'VALIDATION'` (via
 * `validationError()` above) reach the browser unchanged. Everything else —
 * a raw driver error such as ER_DUP_ENTRY, a misconfiguration message naming
 * DB_HOST/DB_NAME/DB_USER, an internal TypeError — becomes the caller's
 * generic `fallback`.
 *
 * The inverse shape ("rethrow unless it looks internal") leaks by default: any
 * Error a future dependency throws without a `.code` would be forwarded
 * verbatim to a public browser session. Written this way, a failure mode added
 * later defaults to hidden, not to leaking.
 *
 * Always throws. It never returns, so callers may use it as the whole body of
 * a `catch` block.
 */
export function friendly(err, fallback) {
  if (err?.code === 'VALIDATION') throw err;
  throw new Error(fallback);
}
