import { assertCan } from '../../../../lib/auth/assert-can';
import { LOCALES, LOCALE_LABELS, DEFAULT_LOCALE } from '../../../../lib/i18n/locales';
import { getMenu } from '../../../../lib/menus/repo';
import { saveMenuItemAction, deleteMenuItemAction, resetMenuAction } from './actions';
import { MENU_SLUGS } from '../../../../lib/menus/slugs';

export const dynamic = 'force-dynamic';

const TITLES = {
  main: 'Main navigation (top of every page)',
  footer: 'Footer navigation',
};

/**
 * Navigation menus.
 *
 * These OVERRIDE the built-in navigation rather than replacing it. While a menu
 * is empty the site uses the links written into the code, which is what keeps
 * the navigation from emptying itself if the database is unreachable — the
 * screen says so, because "add one item and the rest disappear" is a genuinely
 * surprising behaviour to meet without warning.
 */
export default async function MenusPage() {
  await assertCan('manage_pages');

  const menus = {};
  for (const slug of MENU_SLUGS) menus[slug] = await getMenu(slug, DEFAULT_LOCALE);

  return (
    <div className="p-6 space-y-10 max-w-4xl">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold text-blue-900">Navigation</h1>
        <p className="text-gray-600">
          Change the order, wording or destination of the links at the top and bottom of the site.
        </p>
        <p className="text-sm text-amber-900 bg-amber-50 border border-amber-200 rounded p-3">
          <strong>While a menu here is empty, the site uses its built-in links.</strong> Adding
          the first item takes over that whole menu — so add every link you want, not just the
          new one. &ldquo;Use the built-in links again&rdquo; puts it back.
        </p>
      </header>

      {MENU_SLUGS.map((slug) => (
        <section key={slug} className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-bold">{TITLES[slug]}</h2>
            <span className={`text-xs font-semibold rounded px-2 py-0.5 ${
              menus[slug].length ? 'bg-blue-100 text-blue-900' : 'bg-gray-100 text-gray-600'}`}>
              {menus[slug].length ? 'custom' : 'using the built-in links'}
            </span>
          </div>

          {menus[slug].length === 0 ? (
            <p className="text-sm text-gray-500">No custom items. The site uses its built-in links.</p>
          ) : (
            <ul className="divide-y border rounded">
              {menus[slug].map((item) => (
                <li key={item.id} className="p-3 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="min-w-0">
                      <span className="font-semibold">{item.label}</span>
                      <span className="ml-2 font-mono text-xs text-gray-500 break-all">
                        {item.href || '(heading — no link)'}
                      </span>
                    </div>
                    <form action={deleteMenuItemAction}>
                      <input type="hidden" name="id" value={item.id} />
                      <button type="submit" className="text-sm text-red-700 underline">Remove</button>
                    </form>
                  </div>
                  {item.children?.length ? (
                    <ul className="pl-5 border-l space-y-1">
                      {item.children.map((c) => (
                        <li key={c.id} className="flex flex-wrap items-center justify-between gap-3">
                          <div className="min-w-0">
                            {c.label}
                            <span className="ml-2 font-mono text-xs text-gray-500 break-all">{c.href}</span>
                          </div>
                          <form action={deleteMenuItemAction}>
                            <input type="hidden" name="id" value={c.id} />
                            <button type="submit" className="text-xs text-red-700 underline">Remove</button>
                          </form>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </li>
              ))}
            </ul>
          )}

          <form action={saveMenuItemAction} className="border rounded p-4 space-y-4">
            <input type="hidden" name="menu" value={slug} />
            <h3 className="font-semibold">Add a link</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <label htmlFor={`href-${slug}`} className="block text-sm font-semibold">Link</label>
                <input id={`href-${slug}`} name="href" placeholder="travel/toll"
                       className="w-full border rounded px-3 py-2 font-mono text-sm" />
                <p className="text-xs text-gray-500">
                  A page on this site, with no language in front — <code>travel/toll</code>, not
                  <code> /en/travel/toll</code>. The language is added for each reader.
                  {slug === 'footer' ? ' Leave empty to create a column heading.' : ''}
                </p>
              </div>
              <div className="space-y-1">
                <label htmlFor={`sort-${slug}`} className="block text-sm font-semibold">Position</label>
                <input id={`sort-${slug}`} name="sortOrder" type="number" defaultValue={0}
                       className="w-full border rounded px-3 py-2" />
                <p className="text-xs text-gray-500">Lower numbers come first.</p>
              </div>
            </div>

            {slug === 'footer' && menus[slug].length > 0 ? (
              <div className="space-y-1">
                <label htmlFor={`parent-${slug}`} className="block text-sm font-semibold">Column</label>
                <select id={`parent-${slug}`} name="parentId" defaultValue=""
                        className="w-full border rounded px-3 py-2">
                  <option value="">— a new column heading —</option>
                  {menus[slug].map((h) => (
                    <option key={h.id} value={h.id}>Inside &ldquo;{h.label}&rdquo;</option>
                  ))}
                </select>
              </div>
            ) : null}

            <div className="grid gap-3 sm:grid-cols-3">
              {LOCALES.map((l) => (
                <div key={l} className="space-y-1">
                  <label htmlFor={`label-${slug}-${l}`} className="block text-sm font-semibold">
                    {LOCALE_LABELS[l]}{l === DEFAULT_LOCALE ? ' *' : ''}
                  </label>
                  <input id={`label-${slug}-${l}`} name={`label_${l}`}
                         className="w-full border rounded px-3 py-2" />
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-500">
              English is required — the other languages fall back to it, so an item without it
              would be invisible except in its own language.
            </p>

            <button type="submit" className="px-4 py-2 rounded bg-black text-white">Add to menu</button>
          </form>

          {menus[slug].length > 0 ? (
            <form action={resetMenuAction}>
              <input type="hidden" name="menu" value={slug} />
              <button type="submit" className="text-sm text-red-700 underline">
                Remove all items and use the built-in links again
              </button>
            </form>
          ) : null}
        </section>
      ))}
    </div>
  );
}
