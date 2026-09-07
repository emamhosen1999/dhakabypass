import Link from 'next/link';
import { assertCan } from '../../../../lib/auth/assert-can';
import { LOCALES, LOCALE_LABELS } from '../../../../lib/i18n/locales';
import { listRouteMeta, TEMPLATE_ROUTES, normaliseRoute } from '../../../../lib/seo/route-meta';
import { STATIC_LOCALISED_PATHS, HOME_PATH } from '../../../../lib/seo/routes';
import { saveRouteMetaAction, deleteRouteMetaAction } from './actions';

export const dynamic = 'force-dynamic';

/**
 * Per-route search settings (W1.7).
 *
 * ---------------------------------------------------------------------------
 * WHY THIS IS A SEPARATE SCREEN FROM /admin/settings
 * ---------------------------------------------------------------------------
 * /admin/settings is a fixed form: one box per value, every box always present,
 * one row in `site_settings` behind each. This is a LIST with a lifecycle —
 * routes are added and removed, most have no row at all, and an empty row means
 * something different from a missing one. Those are two different shapes of
 * screen, and merging them would give the operator a form whose fields appear
 * and disappear.
 *
 * ---------------------------------------------------------------------------
 * WHAT THIS SCREEN DELIBERATELY DOES NOT OFFER
 * ---------------------------------------------------------------------------
 * A title box for an ordinary page. Those pages are documents — rows in
 * `pages` — and their title and description are edited on the page itself, next
 * to the blocks they describe. A second box here holding a title for the same
 * URL would be a second source of truth, and nothing on either screen could
 * tell the operator which one was in use. The text fields below FILL a gap; the
 * page always wins. The wording on the form says so, because an operator who
 * types a title here and sees the page ignore it has been misled by the screen.
 *
 * The fields that OVERRIDE are the two `page_translations` has no column for:
 * whether search engines may list the URL, and which URL is the primary one.
 */
export default async function SeoRoutesPage({ searchParams }) {
  await assertCan('manage_pages');

  const params = await searchParams;
  const editing = typeof params?.route === 'string' ? params.route : '';

  let rows = [];
  let unavailable = false;
  try {
    rows = await listRouteMeta();
  } catch {
    // The table is created by db/sql/10-route-meta.sql, which is imported by
    // hand through phpMyAdmin. Until that has happened this read fails, and the
    // honest thing to show is why — not an empty list that looks like "no
    // routes have been customised".
    unavailable = true;
  }

  const byRoute = new Map();
  for (const row of rows) {
    if (!byRoute.has(row.route)) byRoute.set(row.route, {});
    byRoute.get(row.route)[row.locale] = row;
  }

  // Everything an operator might plausibly want to address: the code routes the
  // sitemap knows about, the template routes that have no `pages` row, and
  // anything already stored (which may be a `pages` slug this list cannot know).
  const suggestions = [...new Set([
    HOME_PATH, ...TEMPLATE_ROUTES, ...STATIC_LOCALISED_PATHS, ...byRoute.keys(),
  ])].sort();

  let current = null;
  if (editing) {
    try {
      const route = normaliseRoute(editing);
      current = { route, locales: byRoute.get(route) || {} };
    } catch {
      current = null;
    }
  }

  const value = (locale, field) => (current?.locales?.[locale]?.[field]) || '';
  const en = (field) => value('en', field);

  return (
    <div className="p-6 space-y-8 max-w-3xl">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold text-blue-900">Search settings by page</h1>
        <p className="text-gray-600">
          Two things this screen can do that nothing else can: keep a single page out of
          search results, and tell search engines that a page is a copy of another one.
          Both take effect within a few minutes, with no need to rebuild the site.
        </p>
        <p className="text-sm text-amber-900 bg-amber-50 border border-amber-200 rounded p-3">
          <strong>A page&rsquo;s own title and description are edited on the page,</strong> under
          Content. Anything typed here is only used when the page itself has left that field
          empty — so this is the place for the news article template, which has no page of its
          own, rather than for an ordinary page.
        </p>
      </header>

      {unavailable ? (
        <p className="text-sm text-red-900 bg-red-50 border border-red-200 rounded p-3">
          <strong>The route_meta table is not there yet.</strong> Import{' '}
          <code>db/sql/10-route-meta.sql</code> through phpMyAdmin and reload this page.
          Nothing on the public site is affected in the meantime — every page keeps the title
          and description it already has.
        </p>
      ) : null}

      <section className="space-y-3">
        <h2 className="text-lg font-bold">Pages with settings</h2>
        {byRoute.size === 0 ? (
          <p className="text-gray-600">
            None yet. Every page is using its own title and is listed in search normally.
          </p>
        ) : (
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="text-left border-b">
                <th className="py-2 pr-3 font-semibold">Page</th>
                <th className="py-2 pr-3 font-semibold">In search</th>
                <th className="py-2 pr-3 font-semibold">Also set</th>
                <th className="py-2 font-semibold" />
              </tr>
            </thead>
            <tbody>
              {[...byRoute.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([route, locales]) => {
                const robots = locales.en?.robots || '';
                const also = [
                  locales.en?.canonical ? 'canonical' : '',
                  LOCALES.some((l) => locales[l]?.seoTitle) ? 'title' : '',
                  LOCALES.some((l) => locales[l]?.seoDescription) ? 'description' : '',
                  locales.en?.ogImage ? 'sharing image' : '',
                ].filter(Boolean).join(', ');
                return (
                  <tr key={route} className="border-b align-top">
                    <td className="py-2 pr-3 font-mono">{route}</td>
                    <td className="py-2 pr-3">
                      {robots.includes('noindex')
                        ? <span className="text-red-800 font-semibold">Hidden</span>
                        : <span className="text-gray-600">Listed</span>}
                    </td>
                    <td className="py-2 pr-3 text-gray-600">{also || '—'}</td>
                    <td className="py-2 text-right whitespace-nowrap">
                      <Link
                        href={`/admin/seo?route=${encodeURIComponent(route)}`}
                        className="text-blue-800 font-semibold hover:underline"
                      >
                        Edit
                      </Link>
                      <form action={deleteRouteMetaAction} className="inline">
                        <input type="hidden" name="route" value={route} />
                        <button type="submit" className="ml-3 text-red-800 font-semibold hover:underline">
                          Remove
                        </button>
                      </form>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>

      <hr className="border-gray-200" />

      <form action={saveRouteMetaAction} className="space-y-6">
        <h2 className="text-lg font-bold">
          {current ? `Settings for ${current.route}` : 'Add settings for a page'}
        </h2>

        <div className="space-y-1">
          <label htmlFor="route" className="block text-sm font-semibold">Page path</label>
          <p className="text-sm text-gray-600">
            Without the language. Write <code>/news</code>, not <code>/en/news</code> — one
            entry covers all three languages. <code>/news/[slug]</code> means every news
            article.
          </p>
          <input
            id="route" name="route" list="route-suggestions" defaultValue={current?.route || ''}
            placeholder="/news/[slug]" className="w-full border rounded px-3 py-2 font-mono"
          />
          <datalist id="route-suggestions">
            {suggestions.map((r) => <option key={r} value={r} />)}
          </datalist>
        </div>

        <section className="space-y-4">
          <h3 className="font-bold">Listing in search</h3>
          <div className="space-y-1">
            <label htmlFor="robots" className="block text-sm font-semibold">
              Should search engines list this page?
            </label>
            <select
              id="robots" name="robots" defaultValue={en('robots')}
              className="w-full border rounded px-3 py-2"
            >
              <option value="">Yes — list it normally</option>
              <option value="noindex">No — keep this page out of search results</option>
              <option value="nofollow">List it, but do not follow the links on it</option>
              <option value="noindex,nofollow">Neither — hide it and ignore its links</option>
            </select>
            <p className="text-sm text-gray-600">
              Hiding a page also removes it from the sitemap, so the two never contradict each
              other. It does not make the page private — anyone with the link can still open
              it. This setting applies to all three languages at once.
            </p>
          </div>

          <div className="space-y-1">
            <label htmlFor="canonical" className="block text-sm font-semibold">
              Canonical link (optional)
            </label>
            <input
              id="canonical" name="canonical" defaultValue={en('canonical')}
              placeholder="https://dhakabypass.com/en/news"
              className="w-full border rounded px-3 py-2"
            />
            <p className="text-sm text-gray-600">
              Only if this page duplicates another one. It tells search engines to credit that
              other address instead of this one. Leaving it empty is almost always right.
            </p>
          </div>
        </section>

        <section className="space-y-4">
          <h3 className="font-bold">Fallback wording</h3>
          <p className="text-sm text-gray-600">
            Used only where the page itself has left the field empty. For an ordinary page,
            edit the title under Content instead — what you type there will win over this.
          </p>
          {LOCALES.map((l) => (
            <div key={l} className="space-y-1 border rounded p-3">
              <p className="text-sm font-semibold">{LOCALE_LABELS[l]}</p>
              <label htmlFor={`seo_title_${l}`} className="block text-sm">Title</label>
              <input
                id={`seo_title_${l}`} name={`seo_title_${l}`} defaultValue={value(l, 'seoTitle')}
                className="w-full border rounded px-3 py-2"
              />
              <label htmlFor={`seo_description_${l}`} className="block text-sm">Description</label>
              <textarea
                id={`seo_description_${l}`} name={`seo_description_${l}`} rows={2}
                defaultValue={value(l, 'seoDescription')}
                className="w-full border rounded px-3 py-2"
              />
            </div>
          ))}
          <div className="space-y-1">
            <label htmlFor="og_image_en" className="block text-sm font-semibold">
              Sharing image (optional)
            </label>
            <input
              id="og_image_en" name="og_image_en" defaultValue={en('ogImage')}
              placeholder="/uploads/share.webp" className="w-full border rounded px-3 py-2"
            />
            <p className="text-sm text-gray-600">
              Shown when somebody posts a link to this page. One image for all three languages.
            </p>
          </div>
        </section>

        <div className="flex items-center gap-3">
          <button type="submit" className="px-4 py-2 rounded bg-black text-white">
            Save these settings
          </button>
          {current ? (
            <Link href="/admin/seo" className="text-sm text-gray-600 hover:underline">
              Cancel
            </Link>
          ) : null}
        </div>
      </form>
    </div>
  );
}
