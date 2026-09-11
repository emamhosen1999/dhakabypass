/**
 * The limits on the site's unauthenticated write paths, in one place.
 *
 * WHY ITS OWN MODULE. Both callers are `'use server'` files
 * (lib/contact/actions.js and app/admin/actions.js), and a server-
 * action module may export async functions ONLY — a `export const MAX = 8000`
 * there fails `next build` outright. The form component also needs the same
 * number for the textarea's maxLength. A plain module is the only shape that
 * lets the server, the second server action and the browser all read one
 * declaration instead of three that drift.
 *
 * This is POLICY. lib/rate-limit.js is the mechanism, and knows nothing about
 * contact forms.
 */

/**
 * Five submissions per address per ten minutes.
 *
 * Chosen against both failure directions rather than picked round:
 *
 *  - Too tight locks out real people. Bangladeshi mobile networks run
 *    carrier-grade NAT, so one public address can front hundreds of unrelated
 *    readers; an office, a college or a tea stall's wifi is one address too.
 *    A limit of one or two an hour would deny a second, unrelated person on
 *    the same tower.
 *  - Too loose leaves the disk quota exposed. Five per ten minutes caps one
 *    address at 720 rows a day in the worst case, against a `contact_messages`
 *    table the deploy runbook has no rollback for. A bounded, sweepable
 *    number, where the status quo was unbounded.
 *
 * Five also covers the honest human case comfortably: send, realise you left
 * out the chainage, send again, add the plate number, send again.
 */
export const PUBLIC_WRITE_LIMIT = 5;
export const PUBLIC_WRITE_WINDOW_MS = 10 * 60 * 1000;

/**
 * The hard cap on a contact message body, in characters.
 *
 * `contact_messages.message` is `longtext` — up to 4 GB in one row — and the
 * field clipping in the action bounds row WIDTH only (name and email to 191,
 * subject to 255). Nothing bounded the body, so a single request could store
 * megabytes.
 *
 * 8,000 characters is roughly three A4 pages: longer than any genuine enquiry,
 * hazard report or compensation claim needs, and below the point where a
 * message is really a document that belongs in an email attachment. Worst case
 * per address per window becomes 5 x 8,000 characters — about 24 KB even in
 * Bengali, where a character costs three bytes in UTF-8.
 *
 * Read by ContactForm for the textarea's maxLength as well, so the browser
 * stops a long paste before it becomes a rejected round trip. The server still
 * checks: maxLength is a courtesy, not a control.
 */
export const MAX_MESSAGE_CHARS = 8000;
