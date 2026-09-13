import { ClipboardList, Trash2, AlertTriangle } from 'lucide-react';
import { query, dbEnabled } from '../../../../lib/db';
import { KINDS, STATUSES, KIND_VALUES, standardDays } from '../../../../lib/requests/policy.js';
import { getSetting } from '../../../../lib/settings';
import { updateRequestAction, deleteRequestAction, saveStandardsAction } from './actions';

export const dynamic = 'force-dynamic';

const KIND_LABEL = {
  grievance: 'Grievance', toll_dispute: 'Toll dispute', breakdown: 'Breakdown',
  lost_found: 'Lost & found', general: 'General',
};
const STATUS_LABEL = { new: 'New', in_progress: 'In progress', resolved: 'Resolved', closed: 'Closed' };
const STATUS_CLASS = {
  new: 'bg-blue-100 text-blue-800', in_progress: 'bg-amber-100 text-amber-800',
  resolved: 'bg-green-100 text-green-800', closed: 'bg-gray-100 text-gray-600',
};

async function getRequests({ kind, status }) {
  if (!dbEnabled()) return [];
  const where = [];
  const params = [];
  if (kind && Object.hasOwn(KINDS, kind)) { where.push('kind = ?'); params.push(kind); }
  if (status && STATUSES.includes(status)) { where.push('status = ?'); params.push(status); }
  try {
    return (await query(
      `SELECT id, tracking_no, kind, locale, name, phone, email, vehicle_no, location, subject, message,
              status, due_at, resolved_at, admin_note, created_at
         FROM service_requests
        ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
        ORDER BY FIELD(status, 'new', 'in_progress', 'resolved', 'closed'), due_at ASC, id DESC
        LIMIT 300`,
      params,
    )) || [];
  } catch {
    return [];
  }
}

const isOverdue = (r) => r.due_at && !r.resolved_at && new Date(r.due_at) < new Date();

/**
 * The service request queue — what the `request-form` block feeds.
 *
 * Ordered by lifecycle then deadline, so the first row is the newest thing
 * that is most overdue. Overdue is derived, not stored: due_at in the past
 * and no resolved_at.
 */
export default async function AdminRequests({ searchParams }) {
  const sp = (await searchParams) || {};
  const kind = typeof sp.kind === 'string' ? sp.kind : '';
  const status = typeof sp.status === 'string' ? sp.status : '';
  const rows = await getRequests({ kind, status });
  const overdue = rows.filter(isOverdue).length;
  let standards = {};
  try { standards = standardDays(await getSetting('requests.sla_days', {})); } catch { standards = {}; }

  const filterLink = (k, s, label, active) => (
    <a
      key={`${k}|${s}|${label}`}
      href={`/admin/requests?${new URLSearchParams({ ...(k ? { kind: k } : {}), ...(s ? { status: s } : {}) })}`}
      className={`text-xs px-3 py-1.5 rounded-md border font-semibold ${active ? 'bg-blue-900 text-white border-blue-900' : 'border-gray-300 text-gray-700 hover:bg-gray-100'}`}
    >
      {label}
    </a>
  );

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-blue-900">Service requests</h1>
        <p className="text-gray-600 mt-1">
          Grievances, toll disputes, breakdown calls and lost &amp; found reports filed through a
          &ldquo;Service request form&rdquo; block. Each carries a tracking number the sender was shown.
        </p>
        {overdue > 0 ? (
          <p className="mt-2 text-sm font-semibold text-red-700 flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4" /> {overdue} past the response deadline
          </p>
        ) : null}
      </div>

      <details className="mb-6 bg-white rounded-lg border border-gray-200 p-4">
        <summary className="font-semibold cursor-pointer">Standard response deadlines</summary>
        <form action={saveStandardsAction} className="mt-3 space-y-3">
          <p className="text-sm text-gray-600">
            The number of days a new request of each kind has before it shows as overdue. A form block can set its
            own deadline; blank uses the built-in standard shown.
          </p>
          <div className="grid gap-3 sm:grid-cols-5">
            {KIND_VALUES.map((k) => (
              <label key={k} className="flex flex-col gap-1 text-sm">
                {KIND_LABEL[k]}
                <input
                  type="number" min="1" max="365" step="1" name={`sla_${k}`}
                  defaultValue={standards[k] ?? ''} placeholder={String(KINDS[k].slaDays)}
                  className="border rounded px-2 py-1"
                />
              </label>
            ))}
          </div>
          <button type="submit" className="px-4 py-2 rounded bg-blue-900 text-white text-sm font-semibold">Save deadlines</button>
        </form>
      </details>

      <div className="flex flex-wrap gap-2 mb-4">
        {filterLink('', status, 'All kinds', kind === '')}
        {KIND_VALUES.map((k) => filterLink(k, status, KIND_LABEL[k], kind === k))}
      </div>
      <div className="flex flex-wrap gap-2 mb-6">
        {filterLink(kind, '', 'Any status', status === '')}
        {STATUSES.map((s) => filterLink(kind, s, STATUS_LABEL[s], status === s))}
      </div>

      {rows.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center shadow-sm">
          <ClipboardList className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No service requests{kind || status ? ' match this filter' : ' yet'}.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {rows.map((r) => {
            const late = isOverdue(r);
            return (
              <div
                key={r.id}
                className={`bg-white rounded-lg border p-6 shadow-sm ${late ? 'border-red-300 ring-1 ring-red-100' : r.status === 'new' ? 'border-blue-300 ring-1 ring-blue-100' : 'border-gray-200'}`}
              >
                <div className="flex items-start justify-between gap-4 flex-wrap pb-3 border-b border-gray-100">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <code className="font-mono font-bold text-gray-900 text-base">{r.tracking_no}</code>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
                        {KIND_LABEL[r.kind] || r.kind}
                      </span>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${STATUS_CLASS[r.status] || ''}`}>
                        {STATUS_LABEL[r.status] || r.status}
                      </span>
                      {late ? (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800">Overdue</span>
                      ) : null}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      <span className="font-semibold text-gray-800">{r.name}</span>
                      {r.phone ? <> · <a href={`tel:${r.phone}`} className="text-blue-900 font-medium hover:underline">{r.phone}</a></> : null}
                      {r.email ? <> · <a href={`mailto:${r.email}`} className="text-blue-900 font-medium hover:underline">{r.email}</a></> : null}
                      {r.vehicle_no ? <> · Vehicle {r.vehicle_no}</> : null}
                      {r.location ? <> · At {r.location}</> : null}
                      <> · {r.locale}</>
                    </div>
                    {r.subject ? <h3 className="font-bold text-gray-900 mt-2">{r.subject}</h3> : null}
                  </div>
                  <div className="text-xs text-gray-500 text-right shrink-0">
                    <div>Filed {new Date(r.created_at).toLocaleString()}</div>
                    {r.due_at ? <div className={late ? 'text-red-700 font-semibold' : ''}>Due {new Date(r.due_at).toLocaleDateString()}</div> : null}
                    {r.resolved_at ? <div>Resolved {new Date(r.resolved_at).toLocaleDateString()}</div> : null}
                  </div>
                </div>

                <p className="text-gray-800 mt-4 whitespace-pre-wrap leading-relaxed text-sm">{r.message}</p>

                {/* Keyed on the saved values: React 19 resets an uncontrolled
                    form to its defaultValues after the action completes, and
                    without a remount those are the values from BEFORE the
                    save — the select would snap back to the old status. */}
                <form
                  key={`${r.id}:${r.status}:${r.admin_note || ''}`}
                  action={updateRequestAction} className="mt-4 flex flex-wrap items-end gap-3"
                >
                  <input type="hidden" name="id" value={r.id} />
                  <label className="text-xs font-semibold text-gray-700">
                    Status
                    <select name="status" defaultValue={r.status} className="block mt-1 border border-gray-300 rounded-md px-2 py-1.5 text-sm">
                      {STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
                    </select>
                  </label>
                  <label className="text-xs font-semibold text-gray-700 grow min-w-[240px]">
                    Internal note
                    <input
                      name="admin_note" defaultValue={r.admin_note || ''} maxLength={4000}
                      className="block mt-1 w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm font-normal"
                    />
                  </label>
                  <button type="submit" className="text-xs px-3 py-2 rounded-md bg-blue-900 text-white font-semibold hover:bg-blue-800">
                    Save
                  </button>
                </form>
                <form action={deleteRequestAction} className="mt-2 text-right">
                  <input type="hidden" name="id" value={r.id} />
                  <button
                    type="submit" aria-label={`Delete ${r.tracking_no}`} title="Delete request"
                    className="text-red-500 hover:text-red-700 p-1.5 rounded-md hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </form>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
