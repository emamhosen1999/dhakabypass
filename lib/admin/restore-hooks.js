import { revalidatePath } from 'next/cache';
import {
  revalidatePage, revalidateCorridor, revalidateNews, revalidateMedia, revalidateSettings,
  revalidateRedirects, revalidateMenus, revalidateUiStrings, revalidateRouteMeta, revalidateSeo, revalidateUsers,
} from '../revalidate.js';
import { afterWaypointRestore } from '../corridor/waypoints-admin.js';
import { query } from '../db.js';

/**
 * What a record needs besides its rows when it comes back (from the trash or
 * from history), and which caches then have to let go of the old version.
 */
export async function afterRestore(q, { type, snap }) {
  if (type === 'waypoint') await afterWaypointRestore(q, snap);
}

const CORRIDOR = new Set(['segment', 'interchange', 'toll_rate', 'toll_od_rate', 'advisory', 'waypoint', 'monthly', 'road', 'camera', 'alignment']);

export async function revalidateRestored(type, snap) {
  if (CORRIDOR.has(type)) {
    revalidateCorridor();
    revalidatePath('/admin/corridor', 'layout');
    return;
  }
  switch (type) {
    case 'page':
    case 'page_settings':
    case 'block': {
      const slugs = new Set((snap?.rows?.pages || []).map((p) => p.slug));
      const pageId = snap?.rows?.blocks?.[0]?.page_id;
      if (type === 'block' && pageId) {
        const rows = await query('SELECT slug FROM pages WHERE id = ? LIMIT 1', [pageId]).catch(() => []);
        if (rows?.[0]?.slug) slugs.add(rows[0].slug);
      }
      for (const slug of slugs) revalidatePage(slug);
      revalidateSeo();
      revalidatePath('/admin/pages-v2', 'layout');
      break;
    }
    case 'news':
    case 'news_translation':
      revalidateNews();
      revalidatePath('/admin/news', 'layout');
      break;
    case 'media':
      revalidateMedia();
      revalidatePath('/admin/media');
      break;
    case 'menu_item':
      revalidateMenus();
      revalidatePath('/admin/menus');
      break;
    case 'redirect':
      revalidateRedirects();
      revalidatePath('/admin/redirects');
      break;
    case 'route_meta':
      revalidateRouteMeta();
      revalidateSeo();
      revalidatePath('/admin/seo');
      break;
    case 'setting':
      revalidateSettings();
      revalidateCorridor();
      revalidatePath('/admin/settings');
      break;
    case 'ui_string':
      revalidateUiStrings();
      revalidatePath('/admin/translations');
      break;
    case 'service_request':
      revalidatePath('/admin/requests');
      break;
    case 'user':
      revalidateUsers();
      revalidatePath('/admin/users');
      break;
    default:
      break;
  }
}
