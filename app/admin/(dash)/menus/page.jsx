import { auth } from '../../../../auth';
import { can } from '../../../../lib/auth/roles';
import { query } from '../../../../lib/db';
import { orLog } from '../../../../lib/log';
import { LOCALES, LOCALE_LABELS, DEFAULT_LOCALE } from '../../../../lib/i18n/locales';
import { saveMenuItemAction, deleteMenuItemAction, resetMenuAction, seedMenuAction } from './actions';
import { MENU_SLUGS } from '../../../../lib/menus/slugs';
import { safeParse } from '../../../../lib/admin/entities';
import { AdminPage, Button, HistoryLink, NoAccess } from '../../../../components/admin/ui';

export const dynamic = 'force-dynamic';

const TITLES = {
  main: 'Main navigation (top of every page)',
  cta: 'Header button (the highlighted link beside the main navigation)',
  footer: 'Footer navigation',
  legal: 'Footer policy links (privacy, terms, accessibility)',
  travel: 'Travel section menu (the "Travel section menu" block)',
};

async function menuRows(slug) {
  const rows = (await query(
    `SELECT i.id, i.parent_id, i.href, i.labels, i.sort_order FROM menu_items i JOIN menus m ON m.id = i.menu_id
      WHERE m.slug = ? ORDER BY i.sort_order, i.id`,
    [slug],
  ).catch(orLog('admin.menus.list_failed', []))) || [];
  const items = rows.map((r) => ({ ...r, labels: safeParse(r.labels) || {} }));
  const top = items.filter((i) => !i.parent_id || !items.some((p) => p.id === i.parent_id));
  return top.map((t) => ({ ...t, children: items.filter((c) => c.parent_id === t.id) }));
}

const labelOf = (item) => item.labels?.[DEFAULT_LOCALE] || Object.values(item.labels || {})[0] || '(no label)';

/** One link's edit form: all three labels, the link, its position and column (audit T4). */
function ItemForm({ slug, item, headings, submit }) {
  return (
    <form action={saveMenuItemAction} className="space-y-3" key={JSON.stringify(item || {})}>
      <input type="hidden" name="menu" value={slug} />
      {item ? <input type="hidden" name="id" value={item.id} /> : null}
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="space-y-1 text-sm">
          <span className="block font-semibold">Link</span>
          <input name="href" defaultValue={item?.href || ''} placeholder="travel/toll" className="w-full border rounded px-3 py-2 font-mono" />
          <span className="block text-xs text-gray-500">
            A page on this site with no language in front: <code>travel/toll</code>.{slug === 'footer' ? ' Empty makes a column heading.' : ''}
          </span>
        </label>
        <label className="space-y-1 text-sm">
          <span className="block font-semibold">Position</span>
          <input name="sortOrder" type="number" defaultValue={item?.sort_order ?? 0} className="w-full border rounded px-3 py-2" />
          <span className="block text-xs text-gray-500">Lower numbers come first.</span>
        </label>
      </div>
      {slug === 'footer' && headings.length ? (
        <label className="space-y-1 text-sm block">
          <span className="block font-semibold">Column</span>
          <select name="parentId" defaultValue={item?.parent_id ?? ''} className="w-full border rounded px-3 py-2">
            <option value="">A column heading of its own</option>
            {headings.filter((h) => h.id !== item?.id).map((h) => <option key={h.id} value={h.id}>Inside &ldquo;{labelOf(h)}&rdquo;</option>)}
          </select>
        </label>
      ) : item?.parent_id ? <input type="hidden" name="parentId" value={item.parent_id} /> : null}
      <div className="grid gap-3 sm:grid-cols-3">
        {LOCALES.map((l) => (
          <label key={l} className="space-y-1 text-sm">
            <span className="block font-semibold">{LOCALE_LABELS[l]}{l === DEFAULT_LOCALE ? <span aria-hidden="true" className="text-red-700"> *</span> : null}</span>
            <input name={`label_${l}`} defaultValue={item?.labels?.[l] || ''} required={l === DEFAULT_LOCALE} className="w-full border rounded px-3 py-2" />
          </label>
        ))}
      </div>
      <Button data-noconfirm="" data-pending="Saving…">{submit}</Button>
    </form>
  );
}

function ItemRow({ slug, item, headings, isChild = false }) {
  const label = labelOf(item);
  const kids = item.children?.length || 0;
  const question = kids
    ? `Remove the column "${label}" and the ${kids} link${kids === 1 ? '' : 's'} under it?\n\nThey go to the trash and can be restored together.`
    : `Remove the link "${label}"${item.href ? ` (${item.href})` : ''}?\n\nIt goes to the trash and can be restored.`;
  return (
    <li className={`p-3 space-y-2 ${isChild ? 'pl-6' : ''}`} data-record-label={`the link "${label}"`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <span className="font-semibold">{label}</span>
          <span className="ml-2 font-mono text-xs text-gray-500 break-all">{item.href || '(heading, no link)'}</span>
          {LOCALES.filter((l) => l !== DEFAULT_LOCALE && !item.labels?.[l]).length ? (
            <span className="ml-2 text-xs text-amber-900 bg-amber-50 rounded px-1">missing {LOCALES.filter((l) => l !== DEFAULT_LOCALE && !item.labels?.[l]).map((l) => LOCALE_LABELS[l]).join(', ')}</span>
          ) : null}
        </div>
        <div className="flex items-center gap-3">
          <HistoryLink type="menu_item" id={item.id} />
          <form action={deleteMenuItemAction}>
            <input type="hidden" name="id" value={item.id} />
            <Button variant="quiet" className="text-red-700" data-confirm={question}>Remove</Button>
          </form>
        </div>
      </div>
      <details className="text-sm">
        <summary className="cursor-pointer text-blue-900 underline">Edit</summary>
        <div className="mt-2 border rounded p-3 bg-gray-50">
          <ItemForm slug={slug} item={item} headings={headings} submit="Save link" />
        </div>
      </details>
      {kids ? (
        <ul className="border-l ml-2 divide-y">
          {item.children.map((c) => <ItemRow key={c.id} slug={slug} item={c} headings={headings} isChild />)}
        </ul>
      ) : null}
    </li>
  );
}

/**
 * Navigation menus. These OVERRIDE the built-in navigation rather than
 * replacing it: while a menu is empty the site uses the links written into the
 * code, which keeps the navigation from emptying itself if the database is
 * unreachable.
 */
export default async function MenusPage() {
  const session = await auth();
  if (!can(session?.user?.role, 'manage_pages')) return <NoAccess what="navigation menus" />;

  const menus = {};
  for (const slug of MENU_SLUGS) menus[slug] = await menuRows(slug);

  return (
    <AdminPage
      title="Navigation"
      width="max-w-4xl"
      intro={(
        <>
          <p>Change the order, wording or destination of the links at the top and bottom of the site.</p>
          <p className="mt-2 text-sm text-amber-900 bg-amber-50 border border-amber-200 rounded p-3">
            <strong>While a menu here is empty, the site uses its built-in links.</strong> Adding the first item takes over that whole
            menu, so start from the built-in links and change what you need. &ldquo;Use the built-in links again&rdquo; puts it back.
          </p>
        </>
      )}
    >
      {MENU_SLUGS.map((slug) => {
        const items = menus[slug];
        const total = items.reduce((n, i) => n + 1 + (i.children?.length || 0), 0);
        return (
          <section key={slug} className="space-y-4 bg-white border rounded-lg p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-bold">{TITLES[slug]}</h2>
              <span className={`text-xs font-semibold rounded px-2 py-0.5 ${items.length ? 'bg-blue-100 text-blue-900' : 'bg-gray-100 text-gray-600'}`}>
                {items.length ? `custom · ${total} links` : 'using the built-in links'}
              </span>
            </div>

            {items.length === 0 ? (
              <div className="flex flex-wrap items-center gap-3">
                <p className="text-sm text-gray-500">No custom items. The site uses its built-in links.</p>
                <form action={seedMenuAction}>
                  <input type="hidden" name="menu" value={slug} />
                  <Button variant="secondary" data-noconfirm="" data-flash="Copied the built-in links.">Start from the built-in links</Button>
                </form>
              </div>
            ) : (
              <ul className="divide-y border rounded">
                {items.map((item) => <ItemRow key={item.id} slug={slug} item={item} headings={items} />)}
              </ul>
            )}

            <details className="border rounded p-3" open={items.length === 0 ? undefined : false}>
              <summary className="cursor-pointer font-semibold">Add a link</summary>
              <div className="mt-3">
                {items.length === 0 ? (
                  <p className="text-sm text-amber-900 mb-3">Adding a link here replaces all the built-in links in this menu. Start from the built-in links above to keep them.</p>
                ) : null}
                <ItemForm slug={slug} item={null} headings={items} submit="Add to menu" />
              </div>
            </details>

            {items.length > 0 ? (
              <form action={resetMenuAction}>
                <input type="hidden" name="menu" value={slug} />
                <Button
                  variant="quiet"
                  className="text-red-700"
                  data-confirm={`Remove all ${total} custom links from the ${TITLES[slug].split(' (')[0].toLowerCase()} and use the built-in links again?\n\nThe custom links go to the trash and can be restored.`}
                >
                  Remove all items and use the built-in links again
                </Button>
              </form>
            ) : null}
          </section>
        );
      })}
    </AdminPage>
  );
}
