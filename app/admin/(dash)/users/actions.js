'use server';

import { revalidatePath } from 'next/cache';
import { assertCan } from '../../../../lib/auth/assert-can';
import { revalidateUsers } from '../../../../lib/revalidate';
import {
  createUser, deleteUser, getUserById, getUserByEmail, setUserRole, setUserPassword, countAdmins,
} from '../../../../lib/auth/users-repo';
import { validateNewUser, canRemoveOrDemote, isRole, MIN_PASSWORD } from '../../../../lib/auth/users-policy';

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
export async function addUserAction(formData) {
  await assertCan('manage_users');
  const checked = validateNewUser({
    email: formData.get('email'), name: formData.get('name'),
    role: formData.get('role'), password: formData.get('password'),
  });
  if (!checked.ok) throw new Error(checked.error);
  if (await getUserByEmail(checked.value.email)) throw new Error('That address is already on the list.');
  try {
    await createUser(checked.value);
  } catch (err) {
    if (err?.code === 'ER_DUP_ENTRY') throw new Error('That address is already on the list.');
    throw new Error('Could not add the person. Please try again.');
  }
  revalidateUsers();
  revalidatePath(ADMIN);
}

export async function setRoleAction(formData) {
  const session = await assertCan('manage_users');
  const id = Number(formData.get('id'));
  const role = String(formData.get('role') || '');
  if (!id || !isRole(role)) throw new Error('Choose a role.');
  const target = await getUserById(id);
  if (!target) throw new Error('That person is no longer on the list.');
  if (target.role === role) return;
  // Demotion out of admin is, for these rules, the removal of an administrator.
  if (target.role === 'admin') {
    const rule = canRemoveOrDemote({ actorEmail: session.user.email, target, adminCount: await countAdmins() });
    if (!rule.ok) throw new Error(rule.error);
  }
  await setUserRole(id, role);
  revalidateUsers();
  revalidatePath(ADMIN);
}

export async function setPasswordAction(formData) {
  await assertCan('manage_users');
  const id = Number(formData.get('id'));
  const password = String(formData.get('password') || '');
  if (!id) throw new Error('No person selected.');
  if (password.length < MIN_PASSWORD) throw new Error(`The password must be at least ${MIN_PASSWORD} characters.`);
  if (!(await getUserById(id))) throw new Error('That person is no longer on the list.');
  await setUserPassword(id, password);
  revalidatePath(ADMIN);
}

export async function removeUserAction(formData) {
  const session = await assertCan('manage_users');
  const id = Number(formData.get('id'));
  if (!id) throw new Error('No person selected.');
  const target = await getUserById(id);
  const rule = canRemoveOrDemote({ actorEmail: session.user.email, target, adminCount: await countAdmins() });
  if (!rule.ok) throw new Error(rule.error);
  await deleteUser(id);
  revalidateUsers();
  revalidatePath(ADMIN);
}
