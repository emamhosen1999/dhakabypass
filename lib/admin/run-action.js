import { headers, cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { isRedirectError } from 'next/dist/client/components/redirect-error';
import { operatorMessage } from '../errors.js';
import { logError } from '../log.js';
import { runInActionContext, actionContext } from './context.js';

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
    const flash = actionContext()?.flash;
    (await cookies()).set('admin_flash', flash ? JSON.stringify(flash) : '1', { path: '/', maxAge: 30, sameSite: 'lax' });
    return true;
  } catch {
    // Not in a Server Action: nothing to report.
    return false;
  }
}

/**
 * One activity row for an action that did not write its own (the history
 * engine writes richer ones for record changes). Named after the action
 * function, targeted at the form's `id` when it has one.
 */
async function auditPlain(meta) {
  const ctx = actionContext();
  if (!meta?.name || !ctx || ctx.audited || !ctx.actor) return;
  try {
    const { logAudit } = await import('./history.js');
    const form = meta.form && typeof meta.form.entries === 'function' ? Object.fromEntries(meta.form.entries()) : null;
    await logAudit({
      action: meta.name.replace(/Action$/, ''),
      id: form?.id ?? '',
      label: '',
      detail: form,
    });
  } catch (err) {
    logError('admin.audit_failed', err, { action: meta.name });
  }
}

/**
 * `runAction(fn, { name, form })`: `name` and `form` feed the activity log.
 */
export async function runAction(fn, meta = null) {
  return runInActionContext(() => runActionInner(fn, meta));
}

async function runActionInner(fn, meta) {
  let failure = null;
  try {
    const result = await fn();
    // A page render (list actions) cannot set a cookie: it is a read, not logged.
    if (await flashSuccess()) await auditPlain(meta);
    return result;
  } catch (err) {
    if (isRedirectError(err)) {
      if (await flashSuccess()) await auditPlain(meta);
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
      u.searchParams.delete('nt');
      back = `${u.pathname}${u.search}`;
    }
  } catch {
    back = '/admin';
  }
  const sep = back.includes('?') ? '&' : '?';
  // `nt` makes a repeated refusal a new URL, so the form guard notices it too.
  return `${back}${sep}notice=${encodeURIComponent(String(message).slice(0, NOTICE_MAX))}&nt=${Date.now().toString(36)}`;
}
