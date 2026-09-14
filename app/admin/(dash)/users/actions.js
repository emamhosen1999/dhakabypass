'use server';

import { validationError } from '../../../../lib/errors';
import { runAction } from '../../../../lib/admin/run-action';

import { revalidatePath } from 'next/cache';
import { assertCan } from '../../../../lib/auth/assert-can';
import { revalidateUsers } from '../../../../lib/revalidate';
import {
  createUser, deleteUser, getUserById, getUserByEmail, setUserRole, setUserPassword, countAdmins,
} from '../../../../lib/auth/users-repo';
import { validateNewUser, canRemoveOrDemote, isRole, MIN_PASSWORD } from '../../../../lib/auth/users-policy';
import { recordHistory, logAudit } from '../../../../lib/admin/history';
import { setFlash } from '../../../../lib/admin/context';

const ADMIN = '/admin/users';

/**
 * Staff management (W1.17). Every action is `manage_users` — administrators
 * only — and every one that changes who may sign in ends by dropping the
 * cached allowlist, so a removal is enforced on the removed person's very
 * next request.
 *
 * Errors are thrown with a plain sentence: the screen shows them, and none
 * carries a driver message.
 */
async function addUserAction$inner(formData) {
  await assertCan('manage_users');
  const checked = validateNewUser({
    email: formData.get('email'), name: formData.get('name'),
    role: formData.get('role'), password: formData.get('password'),
  });
  if (!checked.ok) throw validationError(checked.error);
  if (await getUserByEmail(checked.value.email)) throw validationError('That address is already on the list.');
  try {
    await createUser(checked.value);
  } catch (err) {
    if (err?.code === 'ER_DUP_ENTRY') throw validationError('That address is already on the list.');
    throw validationError('Could not add the person. Please try again.');
  }
  await logAudit({ action: 'user.create', type: 'user', id: checked.value.email, label: `${checked.value.email} as ${checked.value.role}` });
  setFlash(`${checked.value.email} can now sign in as ${checked.value.role}.`);
  revalidateUsers();
  revalidatePath(ADMIN);
}

async function setRoleAction$inner(formData) {
  const session = await assertCan('manage_users');
  const id = Number(formData.get('id'));
  const role = String(formData.get('role') || '');
  if (!id || !isRole(role)) throw validationError('Choose a role.');
  const target = await getUserById(id);
  if (!target) throw validationError('That person is no longer on the list.');
  if (target.role === role) return;
  // Demotion out of admin is, for these rules, the removal of an administrator.
  if (target.role === 'admin') {
    const rule = canRemoveOrDemote({ actorEmail: session.user.email, target, adminCount: await countAdmins() });
    if (!rule.ok) throw validationError(rule.error);
  }
  await recordHistory('user', id);
  await setUserRole(id, role);
  await logAudit({ action: 'user.role', type: 'user', id, label: `${target.email}: ${target.role} → ${role}` });
  setFlash(`${target.email} is now ${role}. It applies on their next page load.`);
  revalidateUsers();
  revalidatePath(ADMIN);
}

async function setPasswordAction$inner(formData) {
  await assertCan('manage_users');
  const id = Number(formData.get('id'));
  const password = String(formData.get('password') || '');
  if (!id) throw validationError('No person selected.');
  if (password.length < MIN_PASSWORD) throw validationError(`The password must be at least ${MIN_PASSWORD} characters.`);
  const target = await getUserById(id);
  if (!target) throw validationError('That person is no longer on the list.');
  await setUserPassword(id, password);
  await logAudit({ action: 'user.password', type: 'user', id, label: target.email });
  setFlash(`Password replaced for ${target.email}.`);
  revalidatePath(ADMIN);
}

async function removeUserAction$inner(formData) {
  const session = await assertCan('manage_users');
  const id = Number(formData.get('id'));
  if (!id) throw validationError('No person selected.');
  const target = await getUserById(id);
  const rule = canRemoveOrDemote({ actorEmail: session.user.email, target, adminCount: await countAdmins() });
  if (!rule.ok) throw validationError(rule.error);
  await deleteUser(id);
  // Revisions keep the removed person's name through the activity log.
  await logAudit({ action: 'user.remove', type: 'user', id, label: `${target.email} (${target.role})` });
  setFlash(`${target.email} can no longer sign in.`);
  revalidateUsers();
  revalidatePath(ADMIN);
}

// ---------------------------------------------------------------------------
// Every exported action runs through runAction(): a thrown validation error
// becomes a redirect back to the form with the sentence in `?notice=`, which
// is the only way a message survives a production build. See
// lib/admin/run-action.js. The bodies above are unchanged.
// ---------------------------------------------------------------------------
export async function addUserAction(formData) {
  return runAction(() => addUserAction$inner(formData), { name: 'addUserAction', form: formData });
}
export async function setRoleAction(formData) {
  return runAction(() => setRoleAction$inner(formData), { name: 'setRoleAction', form: formData });
}
export async function setPasswordAction(formData) {
  return runAction(() => setPasswordAction$inner(formData), { name: 'setPasswordAction', form: formData });
}
export async function removeUserAction(formData) {
  return runAction(() => removeUserAction$inner(formData), { name: 'removeUserAction', form: formData });
}
