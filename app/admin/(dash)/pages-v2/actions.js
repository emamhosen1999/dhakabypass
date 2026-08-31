// app/admin/(dash)/pages-v2/actions.js
'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '../../../../auth';
import { can } from '../../../../lib/auth/roles';
import { listPages, createPage, deletePage, getPageBySlug } from '../../../../lib/content/pages';
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
  if (!isValidSlug(slug)) throw new Error(`"${slug}" is not a usable address`);
  if (await getPageBySlug(slug)) throw new Error(`A page already lives at "${slug}"`);

  await createPage({ slug, title });
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
  // pointing at a parent_id that no longer exists. Refuse the delete instead
  // of silently deleting or silently orphaning the children.
  const allPages = await listPages();
  const children = allPages.filter((p) => p.parent_id === id);
  if (children.length > 0) {
    throw new Error(
      `This page has ${children.length} sub-page${children.length === 1 ? '' : 's'}. Delete or move them first.`
    );
  }

  await deletePage(id);
  if (slug) revalidatePage(slug);
  revalidatePath(ADMIN_PATH);
}
