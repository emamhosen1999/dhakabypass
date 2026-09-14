import Link from 'next/link';
import { auth } from '../../../../auth';
import { can } from '../../../../lib/auth/roles';
import { ENTITIES, safeParse } from '../../../../lib/admin/entities';
import { listActivity } from '../../../../lib/admin/history';
import { AdminPage, NoAccess, Button, Pager, formatWhen, pageNumber } from '../../../../components/admin/ui';

export const dynamic = 'force-dynamic';

const PER_PAGE = 50;

const VERB = {
  create: 'created', update: 'changed', delete: 'deleted', restore: 'restored', restore_version: 'put back an earlier version of',
  purge: 'deleted for good', replace: 'replaced', remove: 'removed', publish: 'published', unpublish: 'unpublished',
};

function sentence(row) {
  const [type, verb] = String(row.action).split('.');
  if (verb && Object.hasOwn(ENTITIES, type)) {
    return `${VERB[verb] || verb.replace(/_/g, ' ')} ${row.label || `${ENTITIES[type].noun} ${row.target.split(':').slice(1).join(':')}`}`;
  }
  const words = String(row.action).replace(/\./g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2').toLowerCase();
  return row.label ? `${words}: ${row.label}` : words;
}

/**
 * Who changed what, and when (W7.4). Every admin action writes a row; record
 * changes name the record and link to its history. Administrators only: the
 * detail can include what was typed into a form.
 */
export default async function ActivityPage({ searchParams }) {
  const session = await auth();
  if (!can(session?.user?.role, 'manage_users')) return <NoAccess what="the activity log" />;
  const sp = (await searchParams) || {};
  const page = pageNumber(sp);
  const filters = {
    actor: String(sp.actor || ''),
    type: Object.hasOwn(ENTITIES, sp.type) ? sp.type : '',
    q: String(sp.q || '').slice(0, 100),
  };
  const { rows, total, actors } = await listActivity({ ...filters, limit: PER_PAGE, offset: (page - 1) * PER_PAGE });

  return (
    <AdminPage title="Activity" intro={<p>Every change made in the admin, newest first. Record changes link to that record&apos;s history, where an earlier version can be restored.</p>}>
      <form method="get" className="flex flex-wrap items-end gap-2">
        <label className="text-sm">
          <span className="block font-semibold mb-1">Person</span>
          <select name="actor" defaultValue={filters.actor} className="rounded-md border px-3 py-1.5 text-sm">
            <option value="">Everyone</option>
            {actors.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
        </label>
        <label className="text-sm">
          <span className="block font-semibold mb-1">Kind of record</span>
          <select name="type" defaultValue={filters.type} className="rounded-md border px-3 py-1.5 text-sm">
            <option value="">Everything</option>
            {Object.entries(ENTITIES).map(([k, d]) => <option key={k} value={k}>{d.noun}</option>)}
          </select>
        </label>
        <label className="text-sm flex-1 min-w-[12rem]">
          <span className="block font-semibold mb-1">Contains</span>
          <input type="search" name="q" defaultValue={filters.q} className="w-full rounded-md border px-3 py-1.5 text-sm" placeholder="A name, an address, an action" />
        </label>
        <Button variant="secondary" data-noconfirm="">Filter</Button>
      </form>

      {rows.length === 0 ? (
        <p className="text-gray-600 bg-gray-50 border rounded p-6 text-center">Nothing recorded yet.</p>
      ) : (
        <ol className="bg-white border rounded-lg shadow-sm divide-y">
          {rows.map((r) => {
            const [type] = String(r.target).split(':');
            const id = String(r.target).split(':').slice(1).join(':');
            const detail = safeParse(r.detail);
            const hasDetail = detail && typeof detail === 'object' && Object.keys(detail).length > 0;
            return (
              <li key={r.id} className="px-4 py-3 text-sm">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <div className="min-w-0">
                    <span className="font-semibold">{r.actor || 'System'}</span>{' '}
                    <span className="text-gray-800 break-words">{sentence(r)}</span>
                  </div>
                  <div className="flex items-center gap-3 text-gray-500 whitespace-nowrap">
                    {Object.hasOwn(ENTITIES, type) && id ? (
                      <Link className="underline text-blue-900" href={`/admin/history?type=${encodeURIComponent(type)}&id=${encodeURIComponent(id)}`}>History</Link>
                    ) : null}
                    <time>{formatWhen(r.created_at)}</time>
                  </div>
                </div>
                {hasDetail ? (
                  <details className="mt-1">
                    <summary className="cursor-pointer text-xs text-gray-500">What was submitted</summary>
                    <dl className="mt-1 grid grid-cols-[max-content_1fr] gap-x-3 gap-y-0.5 text-xs">
                      {Object.entries(detail).map(([k, v]) => (
                        <div key={k} className="contents"><dt className="font-mono text-gray-500">{k}</dt><dd className="break-words">{String(v)}</dd></div>
                      ))}
                    </dl>
                  </details>
                ) : null}
              </li>
            );
          })}
        </ol>
      )}
      <Pager total={total} page={page} perPage={PER_PAGE} basePath="/admin/activity" params={filters} />
    </AdminPage>
  );
}
