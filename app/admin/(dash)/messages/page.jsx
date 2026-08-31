import { Trash2, Mail, CheckCircle, Clock } from 'lucide-react';
import { query, dbEnabled } from '../../../../lib/db';
import { deleteMessageAction, toggleMessageReadAction } from '../../actions';

export const dynamic = 'force-dynamic';

async function getMessages() {
  if (!dbEnabled()) return [];
  try {
    return (
      (await query(
        'SELECT id, name, email, subject, message, read_at, created_at FROM contact_messages ORDER BY created_at DESC LIMIT 200'
      )) || []
    );
  } catch {
    return [];
  }
}

export default async function AdminMessages() {
  const messages = await getMessages();

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-blue-900">Contact Messages</h1>
        <p className="text-gray-600 mt-1">
          Inquiries and feedback submitted through the website&apos;s contact form.
        </p>
      </div>

      {messages.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center shadow-sm">
          <Mail className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No contact messages received yet.</p>
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
                      {new Date(m.created_at).toLocaleString()}
                    </time>
                    <form action={toggleMessageReadAction}>
                      <input type="hidden" name="id" value={m.id} />
                      <input type="hidden" name="read" value={String(isRead)} />
                      <button
                        type="submit"
                        className="text-xs px-3 py-1.5 rounded-md border border-gray-300 hover:bg-gray-100 text-gray-700 font-semibold transition-all"
                      >
                        {isRead ? 'Mark as Unread' : 'Mark as Read'}
                      </button>
                    </form>
                    <form action={deleteMessageAction}>
                      <input type="hidden" name="id" value={m.id} />
                      <button
                        type="submit"
                        aria-label="Delete message"
                        className="text-red-500 hover:text-red-700 p-1.5 rounded-md hover:bg-red-50 transition-all"
                        title="Delete Message"
                      >
                        <Trash2 className="w-4 h-4" />
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
    </div>
  );
}
