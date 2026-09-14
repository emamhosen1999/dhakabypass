// app/admin/(dash)/pages-v2/actions.js
'use server';

import { validationError, friendly } from '../../../../lib/errors';
import { runAction } from '../../../../lib/admin/run-action';

import { revalidatePath } from 'next/cache';
import { assertCan } from '../../../../lib/auth/assert-can';
import { listPages, createPage, getPageBySlug, duplicatePage } from '../../../../lib/content/pages';
import { getPageForAdmin, parsePageSettings, savePageSettings, isProtectedPage } from '../../../../lib/content/page-settings';
import { recordHistory, logAudit } from '../../../../lib/admin/history';
import { deleteRecord } from '../../../../lib/admin/record-actions';
import { setFlash, currentActor } from '../../../../lib/admin/context';
import { revalidateRedirects, revalidateSeo } from '../../../../lib/revalidate';
import { query } from '../../../../lib/db';
import { normalizeSlug, isValidSlug, RESERVED_SLUGS } from '../../../../lib/content/slug';
import { redirect } from 'next/navigation';
import { revalidatePage } from '../../../../lib/revalidate';

const ADMIN_PATH = '/admin/pages-v2';

async function listPagesAction$inner() {
  await assertCan('manage_pages');
  return listPages();
}

async function createPageAction$inner(formData) {
  await assertCan('manage_pages');
  const title = String(formData.get('title') || '').trim();
  const slug = normalizeSlug(formData.get('slug') || title);

  if (!title) throw validationError('Give the page a title');
  if (!slug) {
    // A title in a non-Latin script (Bengali, Chinese, ...) normalises to
    // nothing — the ASCII slug regex is correct for URLs, but "is not a
    // usable address" doesn't tell a trilingual editor what to do about it.
    throw validationError(
      'Could not build a web address from that title. Please type one in the Address field using English letters, numbers and hyphens.'
    );
  }
  if (!isValidSlug(slug)) throw validationError(`"${slug}" is not a usable address`);
  if (RESERVED_SLUGS.includes(slug)) throw validationError(`"${slug}" is reserved and cannot be a page address`);

  let newId;
  try {
    if (await getPageBySlug(slug)) {
      const dup = new Error(`A page already lives at "${slug}"`);
      dup.code = 'DUPLICATE_SLUG';
      throw dup;
    }
    newId = await createPage({ slug, title, actor: currentActor() });
  } catch (err) {
    // Duplicate detected — by the pre-check above, or by the loser of a
    // concurrent create hitting the UNIQUE constraint on the INSERT (a
    // separate round-trip from the pre-check, so it needs its own case) —
    // gets the same friendly message. Anything else (a connection drop or
    // SQL error from either call) must not leak the driver's text to the
    // browser.
    if (err?.code === 'DUPLICATE_SLUG' || err?.code === 'ER_DUP_ENTRY') {
      throw validationError(`A page already lives at "${slug}"`);
    }
    throw validationError('Could not create the page. Please try again.');
  }
  await logAudit({ action: 'page.create', type: 'page', id: newId, label: `${title} (/${slug})` });
  revalidatePage(slug);
  revalidatePath(ADMIN_PATH);
  setFlash(`Created "${title}" as a draft. Add blocks, then publish it from Page settings.`);
  redirect(`${ADMIN_PATH}/${newId}`);
}

async function deletePageAction$inner(formData) {
  await assertCan('manage_pages');
  const id = Number(formData.get('id'));
  const slug = String(formData.get('slug') || '');
  if (!id) throw validationError('No page selected');

  // The home and not-found pages are part of every visit (audit X1).
  const current = await getPageForAdmin(id);
  if (!current) throw validationError('That page no longer exists.');
  if (isProtectedPage(current.slug)) {
    throw validationError(`The ${current.slug === 'home' ? 'home' : 'not-found'} page cannot be deleted. Edit its blocks instead.`);
  }

  // pages.parent_id has no foreign key, so a child would be left pointing at
  // a page that no longer exists; the check and the delete share the trash's
  // transaction, with the children locked.
  try {
    await deleteRecord('page', id, {
      formData,
      remove: async (q) => {
        const children = await q('SELECT id FROM pages WHERE parent_id = ? FOR UPDATE', [id]);
        if (children.length > 0) {
          throw validationError(`This page has ${children.length} sub-page${children.length === 1 ? '' : 's'}. Delete or move them first.`);
        }
        await q('DELETE FROM pages WHERE id = ?', [id]);
      },
    });
  } catch (err) {
    friendly(err, 'Could not delete the page. Please try again.');
  }

  if (slug) revalidatePage(slug);
  revalidatePath(ADMIN_PATH);
}

/**
 * Copy a page — structure, blocks, every translation — as a draft under a new
 * address, then open it in the editor (W1.23). Any page is a template.
 *
 * The address is required rather than derived: "<slug>-copy" would be a URL
 * an operator then has to remember to rename, and a page called
 * "/about-copy" has a way of going live.
 */
async function duplicatePageAction$inner(formData) {
  await assertCan('manage_pages');
  const sourceId = Number(formData.get('id'));
  const slug = normalizeSlug(formData.get('slug') || '');
  if (!sourceId) throw validationError('No page selected');
  if (!slug || !isValidSlug(slug)) {
    throw validationError('Give the copy a web address using English letters, numbers and hyphens.');
  }
  if (RESERVED_SLUGS.includes(slug)) throw validationError(`"${slug}" is reserved and cannot be a page address`);

  let newId;
  try {
    newId = await duplicatePage({ sourceId, slug, titleSuffix: () => ' (copy)' });
  } catch (err) {
    if (err?.code === 'DUPLICATE_SLUG' || err?.code === 'ER_DUP_ENTRY') {
      throw validationError(`A page already lives at "${slug}"`);
    }
    if (err?.code === 'NOT_FOUND') throw validationError('That page no longer exists');
    throw validationError('Could not copy the page. Please try again.');
  }
  revalidatePath(ADMIN_PATH);
  redirect(`${ADMIN_PATH}/${newId}`);
}

/**
 * The page settings panel (W7.3): titles and search text per language,
 * address (a moved page leaves permanent redirects behind), parent, status.
 */
async function savePageSettingsAction$inner(formData) {
  await assertCan('manage_pages');
  const id = Number(formData.get('id'));
  const current = await getPageForAdmin(id);
  if (!current) throw validationError('That page no longer exists.');
  const stamp = String(formData.get('_stamp') || '');
  const { stampOf, assertUnchanged } = await import('../../../../lib/admin/history');
  if (stamp && stampOf(current.updated_at) !== stamp) await assertUnchanged('page_settings', id, stamp);
  const input = parsePageSettings(formData, current);
  await recordHistory('page_settings', id);
  let result;
  try {
    result = await savePageSettings(id, input, { actor: currentActor() });
  } catch (err) { friendly(err, 'Could not save the page settings. Please try again.'); }
  const verb = input.status !== current.status ? (input.status === 'published' ? 'page.publish' : 'page.unpublish') : 'page_settings.update';
  await logAudit({ action: verb, type: 'page_settings', id, label: `${input.translations.en.title} (/${input.slug})` });
  revalidatePage(current.slug);
  if (result.moved) { revalidatePage(input.slug); revalidateRedirects(); }
  revalidateSeo();
  revalidatePath(ADMIN_PATH);
  revalidatePath(`${ADMIN_PATH}/${id}`);
  const parts = [];
  if (input.status !== current.status) parts.push(input.status === 'published' ? 'Published.' : 'Unpublished: the page is no longer on the public site.');
  else parts.push('Page settings saved.');
  if (result.moved) parts.push(`Moved to /${input.slug}; the old address redirects there.`);
  setFlash(parts.join(' '));
}

/** Publish or unpublish from the list, with the same guard as the panel. */
async function setPageStatusAction$inner(formData) {
  await assertCan('manage_pages');
  const id = Number(formData.get('id'));
  const status = String(formData.get('status'));
  const current = await getPageForAdmin(id);
  if (!current) throw validationError('That page no longer exists.');
  if (!['draft', 'published'].includes(status)) throw validationError('Choose Draft or Published.');
  if (isProtectedPage(current.slug) && status !== 'published') throw validationError('This page cannot be unpublished.');
  await recordHistory('page_settings', id);
  await query(
    `UPDATE pages SET status = ?, updated_by = ?,
       published_at = CASE WHEN ? = 'published' AND status <> 'published' THEN CURRENT_TIMESTAMP ELSE published_at END
      WHERE id = ?`,
    [status, currentActor(), status, id],
  );
  const title = current.translations.en?.title || current.slug;
  await logAudit({ action: status === 'published' ? 'page.publish' : 'page.unpublish', type: 'page_settings', id, label: `${title} (/${current.slug})` });
  revalidatePage(current.slug);
  revalidatePath(ADMIN_PATH);
  revalidatePath(`${ADMIN_PATH}/${id}`);
  setFlash(status === 'published' ? `Published "${title}".` : `Unpublished "${title}".`);
}

// ---------------------------------------------------------------------------
// Every exported action runs through runAction(): a thrown validation error
// becomes a redirect back to the form with the sentence in `?notice=`, which
// is the only way a message survives a production build. See
// lib/admin/run-action.js. The bodies above are unchanged.
// ---------------------------------------------------------------------------
export async function listPagesAction() {
  return runAction(() => listPagesAction$inner(), { name: 'listPagesAction' });
}
export async function createPageAction(formData) {
  return runAction(() => createPageAction$inner(formData), { name: 'createPageAction', form: formData });
}
export async function deletePageAction(formData) {
  return runAction(() => deletePageAction$inner(formData), { name: 'deletePageAction', form: formData });
}
export async function savePageSettingsAction(formData) {
  return runAction(() => savePageSettingsAction$inner(formData), { name: 'savePageSettingsAction', form: formData });
}
export async function setPageStatusAction(formData) {
  return runAction(() => setPageStatusAction$inner(formData), { name: 'setPageStatusAction', form: formData });
}
export async function duplicatePageAction(formData) {
  return runAction(() => duplicatePageAction$inner(formData), { name: 'duplicatePageAction', form: formData });
}
