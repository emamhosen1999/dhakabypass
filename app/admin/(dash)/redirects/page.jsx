import { assertCan } from '../../../../lib/auth/assert-can';
import { listRedirects, REDIRECT_STATUSES } from '../../../../lib/redirects/repo';
import { saveRedirectAction, deleteRedirectAction } from './actions';

export const dynamic = 'force-dynamic';

const STATUS_LABELS = {
  301: '301 — moved permanently (use this for a page that has been replaced)',
  308: '308 — moved permanently, keeps the request method',
  302: '302 — moved temporarily (use this while you are still deciding)',
  307: '307 — moved temporarily, keeps the request method',
};

/**
 * Redirects.
 *
 * The table has existed since the schema was written and never had a reader.
 * It matters at cutover: the list of URLs Google has indexed only becomes
 * visible once the site is live, and each dead one found in the logs needs a
 * redirect that day rather than at the next release.
 *
 * The eight redirects already in next.config.mjs are NOT shown here — they are
 * build-time and belong with the code. This screen is for the ones an operator
 * adds afterwards, and the page says so, because two places to look for a
 * redirect is how one gets missed.
 */
export default async function RedirectsPage() {
  await assertCan('manage_pages');
  const rows = await listRedirects();

  return (
    <div className="p-6 space-y-8 max-w-4xl">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold text-blue-900">Redirects</h1>
        <p className="text-gray-600">
          Send an old address to a new one. Use this when a page has moved and people or
          search engines still have the old link.
        </p>
        <p className="text-sm text-gray-600 bg-gray-50 border rounded p-3">
          Trailing slashes do not matter — a redirect for <code>/project</code> also covers
          <code> /project/</code>. Redirects only apply to addresses that would otherwise show
          the &ldquo;page not found&rdquo; screen, so they can never shadow a page that exists.
          A few permanent redirects are built into the site itself and are not listed here.
        </p>
      </header>

      <form action={saveRedirectAction} className="space-y-4 border rounded p-4">
        <h2 className="text-lg font-bold">Add or update a redirect</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <label htmlFor="source" className="block text-sm font-semibold">From</label>
            <input id="source" name="source" required placeholder="/economic-impact"
                   className="w-full border rounded px-3 py-2 font-mono text-sm" />
            <p className="text-xs text-gray-500">A path on this site.</p>
          </div>
          <div className="space-y-1">
            <label htmlFor="destination" className="block text-sm font-semibold">To</label>
            <input id="destination" name="destination" required placeholder="/en/project"
                   className="w-full border rounded px-3 py-2 font-mono text-sm" />
            <p className="text-xs text-gray-500">A path, or a full https:// address.</p>
          </div>
        </div>
        <div className="space-y-1">
          <label htmlFor="statusCode" className="block text-sm font-semibold">Type</label>
          <select id="statusCode" name="statusCode" defaultValue={301}
                  className="w-full border rounded px-3 py-2">
            {REDIRECT_STATUSES.map((s) => (
              <option key={s} value={s}>{STATUS_LABELS[s]}</option>
            ))}
          </select>
          <p className="text-xs text-gray-500">
            Permanent redirects are remembered by browsers for a long time and are hard to undo.
            If you are not certain the move is final, choose a temporary one.
          </p>
        </div>
        <button type="submit" className="px-4 py-2 rounded bg-black text-white">Save redirect</button>
      </form>

      <section className="space-y-2">
        <h2 className="text-lg font-bold">In place ({rows.length})</h2>
        {rows.length === 0 ? (
          <p className="text-gray-500">None yet.</p>
        ) : (
          <ul className="divide-y border rounded">
            {rows.map((r) => (
              <li key={r.id} className="p-3 flex flex-wrap items-center gap-3 justify-between">
                <div className="font-mono text-sm min-w-0 break-all">
                  {r.source} <span aria-hidden="true">→</span> {r.destination}
                  <span className="ml-2 text-xs text-gray-500">{r.statusCode}</span>
                </div>
                <form action={deleteRedirectAction}>
                  <input type="hidden" name="id" value={r.id} />
                  <button type="submit" className="text-sm text-red-700 underline">Remove</button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
