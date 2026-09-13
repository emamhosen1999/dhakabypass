import { logError } from './log.js';
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
  // In a PRODUCTION build Next redacts the message of any error thrown from
  // a Server Action before it reaches the browser — and, as verified against
  // the standalone build on 2026-09-12, it replaces `digest` with its own
  // hash too, so nothing thrown can carry a sentence to the operator. The
  // transport that works is lib/admin/run-action.js: every admin action runs
  // inside runAction(), which turns one of these into a redirect back to the
  // form with the sentence in `?notice=`. The digest below is the MARKER it
  // reads (operatorMessage), so that only sentences built here — never a
  // driver's — are ever shown.
  err.digest = `${OPERATOR_MESSAGE_PREFIX}${message}`;
  return err;
}

/** The digest prefix that marks a message as one of ours, safe to show
 *  (read by lib/admin/run-action.js and app/admin/(dash)/error.jsx). */
export const OPERATOR_MESSAGE_PREFIX = 'DB_OPERATOR_MESSAGE:';

/** The operator-facing message packed into an error's digest, or ''. */
export function operatorMessage(err) {
  const d = typeof err?.digest === 'string' ? err.digest : '';
  return d.startsWith(OPERATOR_MESSAGE_PREFIX) ? d.slice(OPERATOR_MESSAGE_PREFIX.length) : '';
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
  // The operator sees the fallback; the real cause goes to the server log,
  // or nobody would ever learn why a save failed.
  logError('admin.unexpected_error', err, { fallback });
  // The fallback is ours too — a sentence written for the operator, naming
  // nothing internal — so it travels the same way.
  throw validationError(fallback);
}
