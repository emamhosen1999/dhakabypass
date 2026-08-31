// app/admin/(dash)/pages-v2/actions.js
'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '../../../../auth';
import { can } from '../../../../lib/auth/roles';
import { listPages, createPage, deletePageIfChildless, getPageBySlug } from '../../../../lib/content/pages';
import { normalizeSlug, isValidSlug } from '../../../../lib/content/slug';
import { revalidatePage } from '../../../../lib/revalidate';

const ADMIN_PATH = '/admin/pages-v2';

export async function assertCan(action) {
  const session = await auth();
  if (!session?.user?.isAdmin) throw new Error('Sign in to continue');
  if (!can(session.user.role, action)) {
    throw new Error(`Your role cannot ${action.replace(/_/g, ' ')}`);
  }
  return session;
}

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
  if (await getPageBySlug(slug)) throw new Error(`A page already lives at "${slug}"`);

  try {
    await createPage({ slug, title });
  } catch (err) {
    // getPageBySlug above closes the common case, but it's a separate
    // round-trip from the INSERT — the loser of a concurrent create for the
    // same slug hits the UNIQUE constraint instead. Translate that into the
    // same friendly message rather than letting the driver's error through.
    if (err?.code === 'ER_DUP_ENTRY') {
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
    throw err;
  }

  if (slug) revalidatePage(slug);
  revalidatePath(ADMIN_PATH);
}
