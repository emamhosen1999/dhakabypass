// app/admin/(dash)/pages-v2/page.jsx
import Link from 'next/link';
import { auth } from '../../../../auth';
import { can } from '../../../../lib/auth/roles';
import { listPages } from '../../../../lib/content/pages';
import { pageImpacts, pageDeleteQuestion, isProtectedPage } from '../../../../lib/content/page-settings';
import { pageTree } from '../../../../lib/content/page-tree';
import { AdminPage, Button, NoAccess, formatWhen } from '../../../../components/admin/ui';
import { createPageAction, deletePageAction, duplicatePageAction, setPageStatusAction } from './actions';

export const dynamic = 'force-dynamic';

const STATUS_BADGE = {
  published: 'bg-green-100 text-green-800',
  draft: 'bg-amber-100 text-amber-900',
};

export default async function PageTree({ searchParams }) {
  const session = await auth();
  const role = session?.user?.role;
  if (!can(role, 'translate')) return <NoAccess what="pages" />;
  const manage = can(role, 'manage_pages');
  const sp = (await searchParams) || {};
  const q = String(sp.q || '').trim().toLowerCase();
  const status = ['draft', 'published'].includes(sp.status) ? sp.status : '';

  const all = await listPages();
  const filtering = Boolean(q || status);
  const matches = all.filter((p) => (!status || p.status === status)
    && (!q || String(p.title).toLowerCase().includes(q) || String(p.slug).toLowerCase().includes(q)));
  const rows = filtering ? matches.map((p) => ({ ...p, depth: 0 })) : pageTree(all);
  const impacts = manage ? await pageImpacts(rows).catch(() => new Map()) : new Map();
  const drafts = all.filter((p) => p.status === 'draft').length;

  return (
    <AdminPage
      title="Pages"
      intro={<p>Every page on the site and its address. Open a page to edit its blocks and, under <strong>Page settings</strong>, its titles, address and whether it is published. {drafts ? `${drafts} page${drafts === 1 ? ' is' : 's are'} still a draft.` : ''}</p>}
    >
      {manage ? (
        <form action={createPageAction} className="flex flex-wrap gap-3 items-end bg-white border rounded-lg p-4">
          <label className="flex flex-col text-sm gap-1">
            <span className="font-semibold">Title <span aria-hidden="true" className="text-red-700">*</span></span>
            <input name="title" required className="border rounded px-3 py-2" />
          </label>
          <label className="flex flex-col text-sm gap-1">
            <span className="font-semibold">Address</span>
            <input name="slug" placeholder="travel/toll" className="border rounded px-3 py-2 font-mono" />
            <span className="text-xs text-gray-500">Optional; built from the title when empty.</span>
          </label>
          <Button data-flash="Page created.">Create page</Button>
          <p className="text-xs text-gray-500 basis-full">New pages start as drafts and are not on the public site until you publish them.</p>
        </form>
      ) : null}

      <form method="get" className="flex flex-wrap items-end gap-2">
        <label className="flex-1 min-w-[12rem] text-sm">
          <span className="block font-semibold mb-1">Find a page</span>
          <input type="search" name="q" defaultValue={sp.q || ''} placeholder="Title or address" className="w-full rounded-md border px-3 py-1.5" />
        </label>
        <label className="text-sm">
          <span className="block font-semibold mb-1">Status</span>
          <select name="status" defaultValue={status} className="rounded-md border px-3 py-1.5">
            <option value="">Any</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
          </select>
        </label>
        <Button variant="secondary" data-noconfirm="">Filter</Button>
        {filtering ? <Link href="/admin/pages-v2" className="text-sm underline text-blue-900 py-1.5">Clear</Link> : null}
      </form>

      <div className="bg-white border rounded-lg shadow-sm overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
            <tr>
              <th className="px-4 py-2">Title</th><th className="px-4 py-2">Address</th><th className="px-4 py-2">Status</th>
              <th className="px-4 py-2">Last changed</th><th className="px-4 py-2"><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {rows.map((p) => {
              const title = p.title || '(untitled)';
              const locked = isProtectedPage(p.slug);
              return (
                <tr key={p.id} data-record-label={`the page "${title}"`}>
                  <td className="px-4 py-2" style={{ paddingLeft: `${1 + p.depth * 1.25}rem` }}>
                    {p.depth ? <span aria-hidden="true" className="text-gray-400 mr-1">└</span> : null}
                    <Link href={`/admin/pages-v2/${p.id}`} className="underline font-medium text-blue-900">{title}</Link>
                  </td>
                  <td className="px-4 py-2"><code className="text-xs">/{p.slug}</code></td>
                  <td className="px-4 py-2">
                    <span className={`inline-block rounded px-2 py-0.5 text-xs font-semibold ${STATUS_BADGE[p.status] || 'bg-gray-100'}`}>{p.status === 'published' ? 'Published' : 'Draft'}</span>
                  </td>
                  <td className="px-4 py-2 text-gray-600 whitespace-nowrap">{formatWhen(p.updated_at)}{p.updated_by ? <div className="text-xs">{p.updated_by}</div> : null}</td>
                  <td className="px-4 py-2">
                    {manage ? (
                      <div className="flex flex-wrap items-center justify-end gap-2">
                        {locked ? null : (
                          <form action={setPageStatusAction}>
                            <input type="hidden" name="id" value={p.id} />
                            <input type="hidden" name="status" value={p.status === 'published' ? 'draft' : 'published'} />
                            {p.status === 'published' ? (
                              <Button variant="quiet" data-confirm={`Unpublish "${title}"?\n\nVisitors to /${p.slug} will get "page not found" until it is published again.`} data-flash="Unpublished." data-pending="Unpublishing…">Unpublish</Button>
                            ) : (
                              <Button variant="quiet" data-noconfirm="" data-flash="Published." data-pending="Publishing…">Publish</Button>
                            )}
                          </form>
                        )}
                        <details className="relative">
                          <summary className="cursor-pointer text-sm text-blue-900 underline list-none">Copy…</summary>
                          <form action={duplicatePageAction} className="absolute right-0 z-10 mt-1 flex items-center gap-1 rounded border bg-white p-2 shadow">
                            <input type="hidden" name="id" value={p.id} />
                            <label className="sr-only" htmlFor={`copy-slug-${p.id}`}>Address for the copy of {title}</label>
                            <input id={`copy-slug-${p.id}`} name="slug" placeholder={`${p.slug}-2`} required className="border rounded px-2 py-1 text-xs w-40 font-mono" />
                            <Button variant="secondary" data-flash="Copied as a draft.">Copy</Button>
                          </form>
                        </details>
                        {locked ? (
                          <span className="text-xs text-gray-500" title="The home and not-found pages cannot be deleted">Protected</span>
                        ) : (
                          <form action={deletePageAction}>
                            <input type="hidden" name="id" value={p.id} />
                            <input type="hidden" name="slug" value={p.slug} />
                            <Button variant="danger" data-confirm={pageDeleteQuestion(title, impacts.get(p.id))}>Delete</Button>
                          </form>
                        )}
                      </div>
                    ) : null}
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-6 text-gray-500">{filtering ? 'No page matches.' : 'No pages yet. Create the first one above.'}</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </AdminPage>
  );
}
