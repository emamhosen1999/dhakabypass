// app/admin/(dash)/pages-v2/actions.js
'use server';

import { validationError } from '../../../../lib/errors';
import { runAction } from '../../../../lib/admin/run-action';

import { revalidatePath } from 'next/cache';
import { assertCan } from '../../../../lib/auth/assert-can';
import { listPages, createPage, deletePageIfChildless, getPageBySlug, duplicatePage } from '../../../../lib/content/pages';
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

  try {
    if (await getPageBySlug(slug)) {
      const dup = new Error(`A page already lives at "${slug}"`);
      dup.code = 'DUPLICATE_SLUG';
      throw dup;
    }
    await createPage({ slug, title });
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
  revalidatePage(slug);
  revalidatePath(ADMIN_PATH);
}

async function deletePageAction$inner(formData) {
  await assertCan('manage_pages');
  const id = Number(formData.get('id'));
  const slug = String(formData.get('slug') || '');
  if (!id) throw validationError('No page selected');

  // pages.parent_id has no foreign key constraint, so the database will not
  // cascade or null it when a parent row is deleted — a child would be left
  // pointing at a parent_id that no longer exists. deletePageIfChildless
  // checks and deletes inside one transaction (children locked with
  // FOR UPDATE) so a child created between the check and the delete can't
  // slip through and be orphaned.
  try {
    await deletePageIfChildless(id);
  } catch (err) {
    if (err?.code === 'HAS_CHILDREN') {
      throw validationError(
        `This page has ${err.childCount} sub-page${err.childCount === 1 ? '' : 's'}. Delete or move them first.`
      );
    }
    // Anything else (a connection drop, a raw SQL error) must not leak the
    // driver's text to the browser.
    throw validationError('Could not delete the page. Please try again.');
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

// ---------------------------------------------------------------------------
// Every exported action runs through runAction(): a thrown validation error
// becomes a redirect back to the form with the sentence in `?notice=`, which
// is the only way a message survives a production build. See
// lib/admin/run-action.js. The bodies above are unchanged.
// ---------------------------------------------------------------------------
export async function listPagesAction() {
  return runAction(() => listPagesAction$inner());
}
export async function createPageAction(formData) {
  return runAction(() => createPageAction$inner(formData));
}
export async function deletePageAction(formData) {
  return runAction(() => deletePageAction$inner(formData));
}
export async function duplicatePageAction(formData) {
  return runAction(() => duplicatePageAction$inner(formData));
}
