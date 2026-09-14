'use server';

import { runAction } from '../../../../lib/admin/run-action';

import { revalidatePath } from 'next/cache';
import { assertCan } from '../../../../lib/auth/assert-can';
import { query } from '../../../../lib/db';
import { LOCALES, DEFAULT_LOCALE } from '../../../../lib/i18n/locales';
import { revalidateMenus } from '../../../../lib/revalidate';
import { validationError, friendly } from '../../../../lib/errors';
import { MENU_SLUGS } from '../../../../lib/menus/slugs';
import { builtinRows } from '../../../../lib/menus/builtin';
import { withTransaction } from '../../../../lib/db';
import { saveRecord, deleteRecord } from '../../../../lib/admin/record-actions';
import { setFlash, actionContext } from '../../../../lib/admin/context';

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

  if (parentId && parentId === id) throw validationError('A link cannot sit under itself.');

  try {
    const mid = await menuId(slug);
    await saveRecord('menu_item', id > 0 ? id : null, formData, async () => {
      if (id > 0) {
        await query(
          `UPDATE menu_items SET href = ?, labels = ?, sort_order = ?, parent_id = ?
            WHERE id = ? AND menu_id = ?`,
          [href, JSON.stringify(labels), sortOrder, parentId, id, mid],
        );
        return id;
      }
      const res = await query(
        'INSERT INTO menu_items (menu_id, parent_id, href, labels, sort_order) VALUES (?, ?, ?, ?, ?)',
        [mid, parentId, href, JSON.stringify(labels), sortOrder],
      );
      return res.insertId;
    });
  } catch (err) {
    friendly(err, 'The menu item could not be saved. Please try again.');
  }

  // A link to a page that does not exist is saved, but said out loud (audit V7).
  const warning = await missingPageWarning(href);
  setFlash(warning ? `Saved, but ${warning}` : 'Link saved.');

  revalidateMenus();
  revalidatePath(ADMIN);
}

/** '' when an internal link leads to a page, a sentence when it does not. */
async function missingPageWarning(href) {
  if (!href || /^(https?:|mailto:|tel:|#)/i.test(href)) return '';
  const path = href.replace(/^\//, '').split(/[?#]/)[0].replace(/\/+$/, '');
  if (!path) return '';
  // Routes that are not pages: article and search pages.
  if (/^(news|search|preview)(\/|$)/.test(path)) return '';
  const rows = await query("SELECT slug, status FROM pages WHERE slug = ? LIMIT 1", [path]);
  if (!rows?.length) return `no page lives at /${path}. Check the link.`;
  if (rows[0].status !== 'published') return `the page at /${path} is still a draft, so the link leads nowhere yet.`;
  return '';
}

async function deleteMenuItemAction$inner(formData) {
  await assertCan('manage_pages');
  const id = Number(formData.get('id'));
  if (!Number.isInteger(id) || id <= 0) throw validationError('That item no longer exists.');

  try {
    // Children go with their heading (the entity carries them), to the trash.
    await deleteRecord('menu_item', id, { formData });
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
    await deleteRecord('menu', slug, {
      formData,
      remove: (q, snap) => q('DELETE FROM menu_items WHERE menu_id = ?', [snap.rows.menus[0].id]),
    });
    const flash = actionContext()?.flash;
    if (flash) setFlash(`The ${slug} menu is back to the built-in links. Its custom links are in the trash.`, { undo: flash.u });
  } catch (err) {
    friendly(err, 'The menu could not be reset. Please try again.');
  }

  revalidateMenus();
  revalidatePath(ADMIN);
}

/**
 * Start a custom menu FROM the built-in links (W1.11), so an operator who
 * wants to add one item or rename one does not have to retype the other
 * nine. Copies the code list into menu_items with the code table's labels in
 * every language; refused while the menu already has items, because it
 * would otherwise duplicate them. The site renders identically before and
 * after, which is the point: the change is who can now edit it.
 */
async function seedMenuAction$inner(formData) {
  await assertCan('manage_pages');
  const slug = String(formData.get('menu') || '');
  if (!MENU_SLUGS.includes(slug)) throw validationError('Unknown menu.');
  const existing = await query(
    'SELECT COUNT(*) AS c FROM menu_items i JOIN menus m ON m.id = i.menu_id WHERE m.slug = ?', [slug],
  );
  if (Number(existing?.[0]?.c) > 0) throw validationError('This menu already has items. Use the built-in links again first, then start from them.');
  const id = await menuId(slug);
  const rows = builtinRows(slug);
  try {
    await withTransaction(async (q) => {
      const ids = [];
      for (const r of rows) {
        const parentId = r.parentIndex == null ? null : ids[r.parentIndex];
        const res = await q(
          'INSERT INTO menu_items (menu_id, parent_id, href, labels, sort_order) VALUES (?, ?, ?, ?, ?)',
          [id, parentId, r.href, JSON.stringify(r.labels), r.sortOrder],
        );
        ids.push(res.insertId);
      }
    });
  } catch (err) {
    friendly(err, 'The built-in links could not be copied. Please try again.');
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
  return runAction(() => saveMenuItemAction$inner(formData), { name: 'saveMenuItemAction', form: formData });
}
export async function deleteMenuItemAction(formData) {
  return runAction(() => deleteMenuItemAction$inner(formData), { name: 'deleteMenuItemAction', form: formData });
}
export async function resetMenuAction(formData) {
  return runAction(() => resetMenuAction$inner(formData), { name: 'resetMenuAction', form: formData });
}
export async function seedMenuAction(formData) {
  return runAction(() => seedMenuAction$inner(formData), { name: 'seedMenuAction', form: formData });
}
