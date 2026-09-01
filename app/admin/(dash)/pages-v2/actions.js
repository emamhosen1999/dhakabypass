// app/admin/(dash)/pages-v2/actions.js
'use server';

import { revalidatePath } from 'next/cache';
import { assertCan } from '../../../../lib/auth/assert-can';
import { listPages, createPage, deletePageIfChildless, getPageBySlug } from '../../../../lib/content/pages';
import { normalizeSlug, isValidSlug } from '../../../../lib/content/slug';
import { revalidatePage } from '../../../../lib/revalidate';

const ADMIN_PATH = '/admin/pages-v2';

export async function listPagesAction() {
  await assertCan('manage_pages');
  return listPages();
}

export async function createPageAction(formData) {
  await assertCan('manage_pages');
  const title = String(formData.get('title') || '').trim();
  const slug = normalizeSlug(formData.get('slug') || title);

  if (!title) throw new Error('Give the page a title');
  if (!slug) {
    // A title in a non-Latin script (Bengali, Chinese, ...) normalises to
    // nothing — the ASCII slug regex is correct for URLs, but "is not a
    // usable address" doesn't tell a trilingual editor what to do about it.
    throw new Error(
      'Could not build a web address from that title. Please type one in the Address field using English letters, numbers and hyphens.'
    );
  }
  if (!isValidSlug(slug)) throw new Error(`"${slug}" is not a usable address`);

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
      throw new Error(`A page already lives at "${slug}"`);
    }
    throw new Error('Could not create the page. Please try again.');
  }
  revalidatePage(slug);
  revalidatePath(ADMIN_PATH);
}

export async function deletePageAction(formData) {
  await assertCan('manage_pages');
  const id = Number(formData.get('id'));
  const slug = String(formData.get('slug') || '');
  if (!id) throw new Error('No page selected');

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
      throw new Error(
        `This page has ${err.childCount} sub-page${err.childCount === 1 ? '' : 's'}. Delete or move them first.`
      );
    }
    // Anything else (a connection drop, a raw SQL error) must not leak the
    // driver's text to the browser.
    throw new Error('Could not delete the page. Please try again.');
  }

  if (slug) revalidatePage(slug);
  revalidatePath(ADMIN_PATH);
}
