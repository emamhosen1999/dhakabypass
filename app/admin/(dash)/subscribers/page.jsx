import { MailPlus, Trash2 } from 'lucide-react';
import { query, dbEnabled } from '../../../../lib/db';
import { auth } from '../../../../auth';
import { can } from '../../../../lib/auth/roles';
import { deleteSubscriberAction } from './actions';

export const dynamic = 'force-dynamic';

async function getSubscribers() {
  if (!dbEnabled()) return [];
  try {
    return (await query('SELECT id, email, created_at FROM newsletter_subscribers ORDER BY created_at DESC, id DESC LIMIT 2000')) || [];
  } catch {
    return [];
  }
}

/**
 * The email sign-up list, fed by the `newsletter-form` block.
 *
 * Read-only apart from removal: there is no mail-out from here. The list is
 * shown so an operator can see it exists, copy it into whatever sends the
 * notices, and honour an erasure request. Addresses are personal data, so
 * the screen is admin-only.
 */
export default async function AdminSubscribers() {
  // Gated in the page as well as the action, and gracefully: an editor who
  // follows the nav link sees why rather than an error boundary.
  const session = await auth();
  if (!can(session?.user?.role, 'manage_users')) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-12 text-center shadow-sm">
        <p className="text-gray-600 font-medium">The sign-up list holds personal data and is visible to administrators only.</p>
      </div>
    );
  }
  const rows = await getSubscribers();

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-blue-900">Email sign-ups</h1>
        <p className="text-gray-600 mt-1">
          Addresses collected by the &ldquo;Email sign-up&rdquo; block. {rows.length} on the list.
          Select the column to copy it; remove an address when its owner asks.
        </p>
      </div>

      {rows.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center shadow-sm">
          <MailPlus className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">Nobody has signed up yet.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Signed up</th>
                <th className="px-4 py-3"><span className="sr-only">Remove</span></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t border-gray-100">
                  <td className="px-4 py-2 font-mono">{r.email}</td>
                  <td className="px-4 py-2 text-gray-500">{new Date(r.created_at).toLocaleString()}</td>
                  <td className="px-4 py-2 text-right">
                    <form action={deleteSubscriberAction}>
                      <input type="hidden" name="id" value={r.id} />
                      <button
                        type="submit" aria-label={`Remove ${r.email}`} title="Remove"
                        className="text-red-500 hover:text-red-700 p-1.5 rounded-md hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
