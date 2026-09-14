import { auth } from '../../../../auth';
import { can } from '../../../../lib/auth/roles';
import { ENTITIES } from '../../../../lib/admin/entities';
import { listTrash, TRASH_DAYS } from '../../../../lib/admin/history';
import { AdminPage, Button, Pager, formatWhen, pageNumber } from '../../../../components/admin/ui';
import { undoTrashAction, purgeTrashAction } from '../history-actions';

export const dynamic = 'force-dynamic';

const PER_PAGE = 50;

/**
 * Deleted records (W7.5). Everything deleted in the admin lands here with the
 * rows that went with it — a page's blocks, an interchange's fares — and comes
 * back with its original ids. Kept for TRASH_DAYS, then removed for good.
 */
export default async function TrashPage({ searchParams }) {
  const sp = (await searchParams) || {};
  const type = Object.hasOwn(ENTITIES, sp.type) ? sp.type : '';
  const page = pageNumber(sp);
  const session = await auth();
  const role = session?.user?.role;
  const isAdmin = can(role, 'manage_users');
  const { rows, total } = await listTrash({ type, limit: PER_PAGE, offset: (page - 1) * PER_PAGE });
  const expiry = (d) => {
    const t = new Date(String(d).replace(' ', 'T'));
    t.setDate(t.getDate() + TRASH_DAYS);
    return formatWhen(t).split(',')[0];
  };

  return (
    <AdminPage
      title="Trash"
      intro={<p>Deleted pages, blocks, articles, pictures, links and corridor records. Restore puts a record back exactly as it was, with everything that was deleted with it. Items are removed for good after {TRASH_DAYS} days.</p>}
      actions={isAdmin && total ? (
        <form action={purgeTrashAction}>
          <input type="hidden" name="all" value="expired" />
          <Button variant="danger" data-confirm={`Delete for good everything that has been in the trash longer than ${TRASH_DAYS} days?\n\nThis cannot be undone.`} data-flash="Emptied.">
            Empty items older than {TRASH_DAYS} days
          </Button>
        </form>
      ) : null}
    >
      <form method="get" className="flex flex-wrap items-end gap-2">
        <label className="text-sm">
          <span className="block font-semibold mb-1">Show</span>
          <select name="type" defaultValue={type} className="rounded-md border px-3 py-1.5 text-sm">
            <option value="">Everything</option>
            {Object.entries(ENTITIES).filter(([, d]) => !d.historyOnly).map(([k, d]) => <option key={k} value={k}>{d.noun}</option>)}
          </select>
        </label>
        <Button variant="secondary" data-noconfirm="">Filter</Button>
      </form>

      {rows.length === 0 ? (
        <p className="text-gray-600 bg-gray-50 border rounded p-6 text-center">The trash is empty.</p>
      ) : (
        <div className="bg-white border rounded-lg shadow-sm overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-2">What</th>
                <th className="px-4 py-2">Deleted</th>
                <th className="px-4 py-2">Removed for good</th>
                <th className="px-4 py-2"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {rows.map((r) => {
                const def = ENTITIES[r.entity_type];
                const mayRestore = def && can(role, def.can);
                return (
                  <tr key={r.id}>
                    <td className="px-4 py-3">
                      <span className="text-xs uppercase tracking-wide text-gray-500">{def?.noun || r.entity_type}</span>
                      <div className="font-semibold text-gray-900 break-words">{r.label}</div>
                      {r.summary ? <div className="text-gray-600">{r.summary}</div> : null}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">{formatWhen(r.deleted_at)}{r.actor ? <div className="text-gray-500">{r.actor}</div> : null}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-gray-600">{expiry(r.deleted_at)}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap justify-end gap-2">
                        {mayRestore ? (
                          <form action={undoTrashAction}>
                            <input type="hidden" name="id" value={r.id} />
                            <Button variant="secondary" data-noconfirm="" data-flash="Restored." data-pending="Restoring…">Restore</Button>
                          </form>
                        ) : null}
                        {isAdmin ? (
                          <form action={purgeTrashAction}>
                            <input type="hidden" name="id" value={r.id} />
                            <Button variant="danger" data-confirm={`Delete ${r.label} for good?\n\nIt cannot be restored after this.`} data-flash="Deleted for good." data-pending="Deleting…">Delete for good</Button>
                          </form>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <Pager total={total} page={page} perPage={PER_PAGE} basePath="/admin/trash" params={{ type }} />
    </AdminPage>
  );
}
