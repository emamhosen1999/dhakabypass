import { Users, Trash2, KeyRound } from 'lucide-react';
import { auth, allowedAdmins } from '../../../../auth';
import { can, ROLES } from '../../../../lib/auth/roles';
import { listUsers } from '../../../../lib/auth/users-repo';
import { MIN_PASSWORD, ROLE_VALUES } from '../../../../lib/auth/users-policy';
import { addUserAction, setRoleAction, setPasswordAction, removeUserAction } from './actions';

export const dynamic = 'force-dynamic';

const ROLE_LABEL = { admin: 'Administrator', editor: 'Editor', translator: 'Translator' };
const ROLE_HELP = {
  admin: 'Everything, including staff, messages and service requests.',
  editor: 'Pages, blocks, media, news, corridor data, publishing.',
  translator: 'Translations only.',
};

const INPUT = 'block mt-1 w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm font-normal';

/**
 * Who can sign in, and as what (W1.17).
 *
 * Before this screen, adding an editor meant SSH, an edit to ADMIN_EMAILS in
 * .env, a restart, and a SQL INSERT for the password hash. Now the
 * environment list is the bootstrap — always able to sign in, never
 * removable here — and everyone else is a row on this screen.
 */
export default async function AdminUsers() {
  const session = await auth();
  if (!can(session?.user?.role, 'manage_users')) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-12 text-center shadow-sm">
        <p className="text-gray-600 font-medium">Only administrators can manage who signs in.</p>
      </div>
    );
  }
  const users = await listUsers();
  const bootstrap = new Set(allowedAdmins());
  const me = String(session.user.email || '').toLowerCase();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-blue-900">Staff</h1>
        <p className="text-gray-600 mt-1">
          Who can sign in to this admin, and what they may do. Removing someone takes effect on their next click.
        </p>
      </div>

      <form action={addUserAction} className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm grid gap-3 sm:grid-cols-2 lg:grid-cols-5 items-end">
        <label className="text-xs font-semibold text-gray-700">Email
          <input name="email" type="email" required className={INPUT} />
        </label>
        <label className="text-xs font-semibold text-gray-700">Name
          <input name="name" className={INPUT} />
        </label>
        <label className="text-xs font-semibold text-gray-700">Role
          <select name="role" defaultValue={ROLES.EDITOR} className={INPUT}>
            {ROLE_VALUES.map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
          </select>
        </label>
        <label className="text-xs font-semibold text-gray-700">Password (min {MIN_PASSWORD})
          <input name="password" type="password" required minLength={MIN_PASSWORD} autoComplete="new-password" className={INPUT} />
        </label>
        <button type="submit" className="px-3 py-2 rounded-md bg-blue-900 text-white text-sm font-semibold hover:bg-blue-800">Add person</button>
        <p className="sm:col-span-2 lg:col-span-5 text-xs text-gray-500">
          {ROLE_VALUES.map((r) => <span key={r} className="mr-4"><strong>{ROLE_LABEL[r]}:</strong> {ROLE_HELP[r]}</span>)}
        </p>
      </form>

      {users.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center shadow-sm">
          <Users className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">Nobody has been added yet. The addresses in ADMIN_EMAILS can still sign in.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {users.map((u) => {
            const isMe = u.email.toLowerCase() === me;
            const isBootstrap = bootstrap.has(u.email.toLowerCase());
            return (
              <div key={u.id} className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm flex flex-wrap items-end gap-3">
                <div className="min-w-[220px] grow self-center">
                  <div className="font-semibold text-gray-900">
                    {u.name || u.email}{isMe ? <span className="ml-2 text-xs text-gray-500">(you)</span> : null}
                  </div>
                  <div className="text-sm text-gray-600">
                    {u.email}
                    {isBootstrap ? (
                      <span className="ml-2 px-2 py-0.5 rounded-full text-xs bg-amber-100 text-amber-800" title="Listed in ADMIN_EMAILS; can always sign in">bootstrap</span>
                    ) : null}
                    {!u.hasPassword ? (
                      <span className="ml-2 px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-600">no password: Google sign-in only</span>
                    ) : null}
                  </div>
                </div>
                {/* Keyed on the saved role: React 19 resets an uncontrolled
                    form to its defaultValue after the action, which is the
                    OLD role unless the form remounts. */}
                <form key={`${u.id}:${u.role}`} action={setRoleAction} className="flex items-end gap-2">
                  <input type="hidden" name="id" value={u.id} />
                  <label className="text-xs font-semibold text-gray-700">Role
                    <select name="role" defaultValue={u.role} className={INPUT}>
                      {ROLE_VALUES.map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
                    </select>
                  </label>
                  <button type="submit" className="text-xs px-2 py-2 rounded-md border border-gray-300 hover:bg-gray-100">Save</button>
                </form>
                <form action={setPasswordAction} className="flex items-end gap-2">
                  <input type="hidden" name="id" value={u.id} />
                  <label className="text-xs font-semibold text-gray-700">New password
                    <input name="password" type="password" minLength={MIN_PASSWORD} autoComplete="new-password" className={`${INPUT} w-44`} />
                  </label>
                  <button type="submit" aria-label={`Set password for ${u.email}`} className="text-xs px-2 py-2 rounded-md border border-gray-300 hover:bg-gray-100 flex items-center gap-1">
                    <KeyRound className="w-3.5 h-3.5" /> Set
                  </button>
                </form>
                <form action={removeUserAction} className="ml-auto self-center">
                  <input type="hidden" name="id" value={u.id} />
                  <button
                    type="submit" aria-label={`Remove ${u.email}`} title={isMe ? 'You cannot remove yourself' : 'Remove'}
                    disabled={isMe}
                    className="text-red-500 hover:text-red-700 p-1.5 rounded-md hover:bg-red-50 disabled:opacity-40 disabled:cursor-not-allowed"
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
