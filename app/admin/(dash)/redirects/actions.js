'use server';

import { runAction } from '../../../../lib/admin/run-action';

import { revalidatePath } from 'next/cache';
import { assertCan } from '../../../../lib/auth/assert-can';
import { query } from '../../../../lib/db';
import { normalisePath, REDIRECT_STATUSES } from '../../../../lib/redirects/repo';
import { revalidateRedirects } from '../../../../lib/revalidate';
import { validationError, friendly } from '../../../../lib/errors';

const ADMIN = '/admin/redirects';

/**
 * Add or update one redirect.
 *
 * `manage_pages` rather than `edit_blocks`: a redirect changes where a URL goes
 * for everyone, including search engines, and a wrong one can strand a page's
 * accumulated ranking. That is a site-structure decision, not a copy edit.
 */
async function saveRedirectAction$inner(formData) {
  await assertCan('manage_pages');

  const source = normalisePath(String(formData.get('source') || ''));
  const destination = String(formData.get('destination') || '').trim();
  const statusCode = Number(formData.get('statusCode') || 301);

  if (!source || source === '/') {
    throw validationError('Give the path to redirect FROM, for example /project.');
  }
  if (!destination) throw validationError('Give the path or URL to redirect TO.');
  if (!REDIRECT_STATUSES.includes(statusCode)) {
    throw validationError('Choose one of the listed redirect types.');
  }

  // A destination must be a path on this site or a full https URL. A bare word
  // would resolve relative to whatever page the browser came from, which sends
  // people somewhere different depending on where they started.
  if (!destination.startsWith('/') && !/^https:\/\//i.test(destination)) {
    throw validationError('The destination must start with / or be a full https:// URL.');
  }

  // A redirect to itself is an infinite loop the browser reports as
  // ERR_TOO_MANY_REDIRECTS — a dead page with no clue as to why.
  if (destination.startsWith('/') && normalisePath(destination) === source) {
    throw validationError('That redirects the page to itself.');
  }

  try {
    await query(
      `INSERT INTO redirects (source, destination, status_code) VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE destination = VALUES(destination), status_code = VALUES(status_code)`,
      [source, destination, statusCode],
    );
  } catch (err) {
    friendly(err, 'The redirect could not be saved. Please try again.');
  }

  revalidateRedirects();
  revalidatePath(ADMIN);
}

async function deleteRedirectAction$inner(formData) {
  await assertCan('manage_pages');
  const id = Number(formData.get('id'));
  if (!Number.isInteger(id) || id <= 0) throw validationError('That redirect no longer exists.');

  try {
    await query('DELETE FROM redirects WHERE id = ?', [id]);
  } catch (err) {
    friendly(err, 'The redirect could not be removed. Please try again.');
  }

  revalidateRedirects();
  revalidatePath(ADMIN);
}

// ---------------------------------------------------------------------------
// Every exported action runs through runAction(): a thrown validation error
// becomes a redirect back to the form with the sentence in `?notice=`, which
// is the only way a message survives a production build. See
// lib/admin/run-action.js. The bodies above are unchanged.
// ---------------------------------------------------------------------------
export async function saveRedirectAction(formData) {
  return runAction(() => saveRedirectAction$inner(formData));
}
export async function deleteRedirectAction(formData) {
  return runAction(() => deleteRedirectAction$inner(formData));
}
