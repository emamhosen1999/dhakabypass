import { headers, cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { isRedirectError } from 'next/dist/client/components/redirect-error';
import { operatorMessage } from '../errors.js';
import { logError } from '../log.js';

/**
 * How an admin action reports a failure to the operator — in PRODUCTION.
 *
 * Every admin action used to `throw validationError('…')` and rely on the
 * message reaching the browser. In `next dev` it does. In a production
 * build Next redacts the message of any error thrown from a Server Action
 * ("The specific message is omitted in production builds") and replaces the
 * digest with its own hash, so a short password, a duplicate address or a
 * picture still in use rendered as a bare 500 — verified against the
 * standalone build on 2026-09-12. One hundred and ten throw sites across
 * fourteen files were all affected, and every test that mocked the action
 * layer was green.
 *
 * So the failure is carried the one way that survives production: a
 * redirect back to the page the form was on, with the sentence in the query
 * string, which <AdminNotice> in the dash layout renders. Nothing else about
 * an action changes — the throws stay, the allowlist in lib/errors.js still
 * decides which sentences are ours — this only decides how they travel.
 *
 * `runAction(fn)`: run the body; on a validation error redirect with its
 * message; on anything else redirect with a generic sentence and log the
 * real one to the server console; let Next's own redirect/not-found signals
 * through untouched, because an action that redirects on success is not an
 * action that failed.
 */
const GENERIC = 'The change was not made. Try again; if it keeps happening, tell the developer what you were doing.';
const NOTICE_MAX = 500;

/**
 * Marks a finished action so the admin can say "Saved." (components/admin/
 * AdminFormGuard.jsx). Only a Server Action may set a cookie; the same helper
 * also runs inside page renders (listCorridorAction and friends), where this
 * throws and is ignored — a page load is not a save.
 */
async function flashSuccess() {
  try {
    (await cookies()).set('admin_flash', '1', { path: '/', maxAge: 30, sameSite: 'lax' });
  } catch {
    // Not in a Server Action: nothing to report.
  }
}

export async function runAction(fn) {
  let failure = null;
  try {
    const result = await fn();
    await flashSuccess();
    return result;
  } catch (err) {
    if (isRedirectError(err)) {
      await flashSuccess();
      throw err;
    }
    if (err?.digest === 'NEXT_NOT_FOUND' || err?.digest?.startsWith?.('NEXT_HTTP_ERROR_FALLBACK')) throw err;
    const message = operatorMessage(err) || (err?.code === 'VALIDATION' ? err.message : '');
    if (!message) logError('admin.action_failed', err);
    failure = message || GENERIC;
  }
  // redirect() throws; it must not be inside the try above, or the catch
  // would swallow the very signal it is meant to send.
  redirect(await noticeUrl(failure));
}

/**
 * The page the form was on, with `notice=` appended. Same-origin admin paths
 * only — anything else lands on the dashboard — so the referer can never be
 * used to bounce an operator off the site.
 */
export async function noticeUrl(message) {
  let back = '/admin';
  try {
    const ref = (await headers()).get('referer') || '';
    const u = new URL(ref, 'http://x');
    if (u.pathname.startsWith('/admin')) {
      u.searchParams.delete('notice');
      back = `${u.pathname}${u.search}`;
    }
  } catch {
    back = '/admin';
  }
  const sep = back.includes('?') ? '&' : '?';
  return `${back}${sep}notice=${encodeURIComponent(String(message).slice(0, NOTICE_MAX))}`;
}
