import Link from 'next/link';
import { auth } from '../../../../auth';
import { can } from '../../../../lib/auth/roles';
import { ENTITIES, describe } from '../../../../lib/admin/entities';
import { listHistory, snapshotEntity } from '../../../../lib/admin/history';
import { query } from '../../../../lib/db';
import { AdminPage, NoAccess, Button, formatWhen } from '../../../../components/admin/ui';
import { restoreHistoryAction } from '../history-actions';

export const dynamic = 'force-dynamic';

const ACTION_LABEL = { update: 'Before a save', delete: 'Before deleting', restore: 'Before a restore', replace: 'Before replacing', remove: 'Before removing', create: 'Created' };

/**
 * One record's history (W7.4): every saved version, what differs from the
 * record now, and a confirmed Restore that keeps the present version too.
 */
export default async function HistoryPage({ searchParams }) {
  const sp = (await searchParams) || {};
  const type = String(sp.type || '');
  const id = String(sp.id || '');
  if (!Object.hasOwn(ENTITIES, type) || !id) {
    return <AdminPage title="History"><p className="text-gray-600">Open History from a record.</p></AdminPage>;
  }
  const def = ENTITIES[type];
  const session = await auth();
  if (!can(session?.user?.role, def.can)) return <NoAccess what={`the history of this ${def.noun}`} />;

  const [entries, now] = await Promise.all([listHistory(type, id, { limit: 50 }), snapshotEntity(query, type, id)]);
  const current = now ? describe(type, now).label : `this ${def.noun} (deleted)`;
  const back = def.href(id, now?.rows?.[def.table]?.[0]);

  return (
    <AdminPage
      title={`History of ${current}`}
      intro={<p>Each entry is the {def.noun} as it was just before a change. <strong>Restore</strong> puts that version back; the version you have now is kept here too, so a restore can be undone.</p>}
      actions={<Link href={back} className="text-sm underline text-blue-900">Back to the {def.noun}</Link>}
      width="max-w-5xl"
    >
      {entries.length === 0 ? (
        <p className="text-gray-600 bg-gray-50 border rounded p-4">No earlier versions yet. The first one is kept the next time this {def.noun} is saved.</p>
      ) : (
        <ol className="space-y-4">
          {entries.map((e) => (
            <li key={e.id} className="border rounded-lg bg-white shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3">
                <div className="text-sm">
                  <span className="font-semibold">{formatWhen(e.createdAt)}</span>
                  <span className="text-gray-600"> · {ACTION_LABEL[e.action] || e.action}{e.actor ? ` by ${e.actor}` : ''}</span>
                </div>
                <form action={restoreHistoryAction}>
                  <input type="hidden" name="id" value={e.id} />
                  <Button
                    variant="secondary"
                    data-confirm={`Put ${current} back as it was on ${formatWhen(e.createdAt)}?\n\n${e.changes.length} field${e.changes.length === 1 ? '' : 's'} change. The version you have now is kept in this history.`}
                    data-flash="Restored."
                    data-pending="Restoring…"
                  >
                    Restore this version
                  </Button>
                </form>
              </div>
              {e.changes.length === 0 ? (
                <p className="px-4 py-3 text-sm text-gray-600">Same as now.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
                      <tr><th className="px-4 py-2">Field</th><th className="px-4 py-2">Then</th><th className="px-4 py-2">Now</th></tr>
                    </thead>
                    <tbody className="divide-y">
                      {e.changes.map((c) => (
                        <tr key={c.field}>
                          <td className="px-4 py-2 font-mono text-xs text-gray-700 whitespace-nowrap">{c.field}</td>
                          <td className="px-4 py-2 text-red-900 bg-red-50/40 break-words max-w-md">{c.before}</td>
                          <td className="px-4 py-2 text-green-900 bg-green-50/40 break-words max-w-md">{c.after}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </li>
          ))}
        </ol>
      )}
    </AdminPage>
  );
}
