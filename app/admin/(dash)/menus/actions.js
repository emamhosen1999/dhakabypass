'use server';

import { runAction } from '../../../../lib/admin/run-action';

import { revalidatePath } from 'next/cache';
import { assertCan } from '../../../../lib/auth/assert-can';
import { query } from '../../../../lib/db';
import { LOCALES, DEFAULT_LOCALE } from '../../../../lib/i18n/locales';
import { revalidateMenus } from '../../../../lib/revalidate';
import { validationError, friendly } from '../../../../lib/errors';
import { MENU_SLUGS } from '../../../../lib/menus/slugs';

const ADMIN = '/admin/menus';

async function menuId(slug) {
  if (!MENU_SLUGS.includes(slug)) throw validationError('Unknown menu.');
  const rows = await query('SELECT id FROM menus WHERE slug = ? LIMIT 1', [slug]);
  if (rows && rows.length) return rows[0].id;
  // Created on first use rather than seeded: an empty `menus` table is the
  // signal that the built-in navigation is in charge, and seeding a row would
  // silently switch the site onto a database-driven nav with nothing in it.
  const res = await query('INSERT INTO menus (slug) VALUES (?)', [slug]);
  return res.insertId;
}

/**
 * Add or update one navigation item.
 *
 * `manage_pages`: adding a link changes what the whole site navigates to, which
 * is site structure rather than copy.
 */
async function saveMenuItemAction$inner(formData) {
  await assertCan('manage_pages');

  const slug = String(formData.get('menu') || '');
  const id = Number(formData.get('id') || 0);
  const href = String(formData.get('href') || '').trim();
  const parentId = Number(formData.get('parentId') || 0) || null;
  const sortOrder = Number(formData.get('sortOrder') || 0) || 0;

  const labels = {};
  for (const locale of LOCALES) {
    const v = String(formData.get(`label_${locale}`) || '').trim();
    if (v) labels[locale] = v;
  }
  // English is required because it is what every other locale falls back to.
  // An item with only a Bangla label would be invisible on /en and /zh.
  if (!labels[DEFAULT_LOCALE]) {
    throw validationError('Give the English label — the other languages fall back to it.');
  }

  // A heading in the footer legitimately has no link. Everywhere else an empty
  // href would render a link that goes nowhere.
  if (href && !href.startsWith('/') && !/^https?:\/\//i.test(href) && !/^(mailto|tel):/i.test(href)) {
    // Authored links carry no locale prefix — lib/blocks/href.js adds one per
    // reader. A bare path like `travel/toll` is the normal, correct form.
    if (/^(en|bn|zh)(\/|$)/.test(href)) {
      throw validationError('Leave the language out of the link — it is added automatically.');
    }
  }

  try {
    const mid = await menuId(slug);
    if (id > 0) {
      await query(
        `UPDATE menu_items SET href = ?, labels = ?, sort_order = ?, parent_id = ?
          WHERE id = ? AND menu_id = ?`,
        [href, JSON.stringify(labels), sortOrder, parentId, id, mid],
      );
    } else {
      await query(
        'INSERT INTO menu_items (menu_id, parent_id, href, labels, sort_order) VALUES (?, ?, ?, ?, ?)',
        [mid, parentId, href, JSON.stringify(labels), sortOrder],
      );
    }
  } catch (err) {
    friendly(err, 'The menu item could not be saved. Please try again.');
  }

  revalidateMenus();
  revalidatePath(ADMIN);
}

async function deleteMenuItemAction$inner(formData) {
  await assertCan('manage_pages');
  const id = Number(formData.get('id'));
  if (!Number.isInteger(id) || id <= 0) throw validationError('That item no longer exists.');

  try {
    // Children first: menu_items has no cascade, and an orphaned child would
    // reappear as a top-level item rather than disappearing with its heading.
    await query('DELETE FROM menu_items WHERE parent_id = ?', [id]);
    await query('DELETE FROM menu_items WHERE id = ?', [id]);
  } catch (err) {
    friendly(err, 'The menu item could not be removed. Please try again.');
  }

  revalidateMenus();
  revalidatePath(ADMIN);
}

/**
 * Remove every item in one menu, returning the site to its built-in navigation.
 *
 * The way back matters as much as the way in. Without this, an operator who
 * tried a custom menu and did not like it would have to delete each item to get
 * the original navigation back, and would have no way of knowing that deleting
 * the last one is what restores it.
 */
async function resetMenuAction$inner(formData) {
  await assertCan('manage_pages');
  const slug = String(formData.get('menu') || '');
  if (!MENU_SLUGS.includes(slug)) throw validationError('Unknown menu.');

  try {
    await query(
      'DELETE i FROM menu_items i JOIN menus m ON m.id = i.menu_id WHERE m.slug = ?',
      [slug],
    );
  } catch (err) {
    friendly(err, 'The menu could not be reset. Please try again.');
  }

  revalidateMenus();
  revalidatePath(ADMIN);
}

// ---------------------------------------------------------------------------
// Every exported action runs through runAction(): a thrown validation error
// becomes a redirect back to the form with the sentence in `?notice=`, which
// is the only way a message survives a production build. See
// lib/admin/run-action.js. The bodies above are unchanged.
// ---------------------------------------------------------------------------
export async function saveMenuItemAction(formData) {
  return runAction(() => saveMenuItemAction$inner(formData));
}
export async function deleteMenuItemAction(formData) {
  return runAction(() => deleteMenuItemAction$inner(formData));
}
export async function resetMenuAction(formData) {
  return runAction(() => resetMenuAction$inner(formData));
}
