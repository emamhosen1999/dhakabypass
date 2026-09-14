import { Trash2, Mail, CheckCircle, Clock } from 'lucide-react';
import { query, dbEnabled } from '../../../../lib/db';
import { deleteMessageAction, toggleMessageReadAction } from '../../actions';
import { auth } from '../../../../auth';
import { can } from '../../../../lib/auth/roles';
import { NoAccess, Pager, pageNumber, formatWhen } from '../../../../components/admin/ui';

const PER_PAGE = 50;

export const dynamic = 'force-dynamic';

async function getMessages({ q, unread, page }) {
  if (!dbEnabled()) return { messages: [], total: 0 };
  const where = [];
  const params = [];
  if (q) { where.push('(name LIKE ? OR email LIKE ? OR subject LIKE ? OR message LIKE ?)'); params.push(...Array(4).fill(`%${q}%`)); }
  if (unread) where.push('read_at IS NULL');
  const clause = where.length ? `WHERE ${where.join(' AND ')}` : '';
  try {
    const messages = (await query(
      `SELECT id, name, email, subject, message, read_at, created_at FROM contact_messages ${clause}
        ORDER BY created_at DESC LIMIT ${PER_PAGE} OFFSET ${(page - 1) * PER_PAGE}`,
      params,
    )) || [];
    const total = Number((await query(`SELECT COUNT(*) AS n FROM contact_messages ${clause}`, params))?.[0]?.n || 0);
    return { messages, total };
  } catch {
    return { messages: [], total: 0 };
  }
}

export default async function AdminMessages({ searchParams }) {
  // Messages are personal data: administrators only (audit R2).
  const session = await auth();
  if (!can(session?.user?.role, 'manage_users')) return <NoAccess what="contact messages, which hold personal data" />;
  const sp = (await searchParams) || {};
  const q = typeof sp.q === 'string' ? sp.q.trim().slice(0, 80) : '';
  const unread = sp.unread === '1';
  const page = pageNumber(sp);
  const { messages, total } = await getMessages({ q, unread, page });

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-blue-900">Contact Messages</h1>
        <p className="text-gray-600 mt-1">
          Inquiries and feedback submitted through the website&apos;s contact form.
        </p>
      </div>

      <form method="get" className="mb-6 flex flex-wrap items-end gap-2">
        <label className="flex-1 min-w-[14rem] text-sm">
          <span className="block font-semibold mb-1">Find a message</span>
          <input type="search" name="q" defaultValue={q} placeholder="Name, email, subject or text" className="w-full rounded-md border px-3 py-1.5" />
        </label>
        <label className="flex items-center gap-2 text-sm py-1.5">
          <input type="checkbox" name="unread" value="1" defaultChecked={unread} /> Unread only
        </label>
        <button type="submit" className="px-3 py-1.5 rounded-md border border-blue-900 text-blue-900 text-sm font-semibold">Search</button>
        {q || unread ? <a href="/admin/messages" className="text-sm underline text-blue-900 py-1.5">Clear</a> : null}
      </form>

      {messages.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center shadow-sm">
          <Mail className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">{q || unread ? 'No message matches.' : 'No contact messages received yet.'}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {messages.map((m) => {
            const isRead = Boolean(m.read_at);
            return (
              <div
                key={m.id}
                className={`bg-white rounded-lg border p-6 transition-all shadow-sm ${
                  isRead
                    ? 'border-gray-200 opacity-80'
                    : 'border-blue-300 ring-1 ring-blue-100 bg-blue-50/20'
                }`}
              >
                <div className="flex items-start justify-between gap-4 flex-wrap pb-3 border-b border-gray-100">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <h3 className="font-bold text-gray-900 text-base">
                        {m.subject || '(No Subject)'}
                      </h3>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-semibold flex items-center gap-1 ${
                          isRead
                            ? 'bg-gray-100 text-gray-600'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {isRead ? (
                          <>
                            <CheckCircle className="w-3 h-3 text-gray-500" /> Read
                          </>
                        ) : (
                          <>
                            <Clock className="w-3 h-3 text-blue-600" /> New
                          </>
                        )}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      From: <span className="font-semibold text-gray-800">{m.name}</span> ·{' '}
                      <a
                        href={`mailto:${m.email}`}
                        className="text-blue-900 font-medium hover:underline"
                      >
                        {m.email}
                      </a>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <time className="text-xs text-gray-400">
                      {formatWhen(m.created_at)}
                    </time>
                    <form action={toggleMessageReadAction}>
                      <input type="hidden" name="id" value={m.id} />
                      <input type="hidden" name="read" value={String(isRead)} />
                      <button
                        type="submit"
                        data-noconfirm=""
                        data-flash={isRead ? 'Marked as unread.' : 'Marked as read.'}
                        className="text-xs px-3 py-1.5 rounded-md border border-gray-300 hover:bg-gray-100 text-gray-700 font-semibold transition-all"
                      >
                        {isRead ? 'Mark as Unread' : 'Mark as Read'}
                      </button>
                    </form>
                    <form action={deleteMessageAction}>
                      <input type="hidden" name="id" value={m.id} />
                      <button
                        type="submit"
                        data-confirm={`Delete the message "${m.subject || '(no subject)'}" from ${m.name}?\n\nMessages are personal data and are deleted permanently. The deletion is recorded in the activity log.`}
                        className="inline-flex items-center gap-1 text-sm text-red-700 hover:text-red-900 px-2 py-1 rounded-md hover:bg-red-50 transition-all"
                      >
                        <Trash2 className="w-4 h-4" aria-hidden="true" /> Delete
                      </button>
                    </form>
                  </div>
                </div>

                <p className="text-gray-800 mt-4 whitespace-pre-wrap leading-relaxed text-sm">
                  {m.message}
                </p>
              </div>
            );
          })}
        </div>
      )}
      <div className="mt-6"><Pager total={total} page={page} perPage={PER_PAGE} basePath="/admin/messages" params={{ q, unread: unread ? '1' : '' }} /></div>
    </div>
  );
}
