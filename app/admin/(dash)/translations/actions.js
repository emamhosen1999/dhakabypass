'use server';

import { revalidatePath } from 'next/cache';
import { assertCan } from '../../../../lib/auth/assert-can';
import { LOCALES } from '../../../../lib/i18n/locales';
import { findUiString } from '../../../../lib/i18n/catalogue';
import { setUiString, deleteUiString } from '../../../../lib/i18n/strings-repo';
import { revalidateUiStrings } from '../../../../lib/revalidate';
import { validationError, friendly } from '../../../../lib/errors';

const ADMIN = '/admin/translations';

/**
 * `translate`, not `manage_pages`.
 *
 * These are words on a page, not site structure, and lib/auth/roles.js has a
 * `translator` role whose entire permission set is `['translate']` — a role
 * that exists precisely so a translator can be given this screen and nothing
 * else. Requiring anything stronger would make that role unusable.
 */
const PERMISSION = 'translate';

/**
 * A key must be one the code knows about.
 *
 * Fails closed for the same reason lib/auth/roles.js does. A form post naming
 * an arbitrary key would let anyone with the translator role fill `ui_strings`
 * with rows nothing reads — invisible from the screen, since it renders the
 * catalogue rather than the table, and permanent, since there would be no row
 * to delete from.
 */
function assertKnownKey(key) {
  if (!findUiString(key)) throw validationError('That string no longer exists.');
}

/**
 * Save every locale of one string at once.
 *
 * An EMPTY box deletes that locale's row rather than storing ''. That is what
 * makes "clear it" mean "go back to the shipped wording" instead of "show
 * nothing": lib/i18n/overrides.js ignores a blank value anyway, so a stored ''
 * would be an invisible row that the screen would then report as an override.
 * Delete is the honest representation of what the reader will do.
 */
export async function saveUiStringAction(formData) {
  await assertCan(PERMISSION);

  const key = String(formData.get('key') || '').trim();
  assertKnownKey(key);

  const values = {};
  for (const locale of LOCALES) {
    // Only act on locales the form actually submitted, so a future
    // single-locale form cannot silently wipe the other two.
    if (!formData.has(`value_${locale}`)) continue;
    values[locale] = String(formData.get(`value_${locale}`) ?? '').trim();
  }
  if (Object.keys(values).length === 0) throw validationError('Nothing was submitted to save.');

  try {
    for (const [locale, value] of Object.entries(values)) {
      if (value) await setUiString(key, locale, value);
      else await deleteUiString(key, locale);
    }
  } catch (err) {
    // The likeliest failure here by far is that db/sql/09-ui-strings.sql has
    // not been imported yet, so the message names it.
    friendly(err, 'That string could not be saved. If this is a new installation, import db/sql/09-ui-strings.sql first.');
  }

  revalidateUiStrings();
  revalidatePath(ADMIN);
}

/** Drop every override for one string, so all three locales fall back to code. */
export async function resetUiStringAction(formData) {
  await assertCan(PERMISSION);

  const key = String(formData.get('key') || '').trim();
  assertKnownKey(key);

  try {
    await deleteUiString(key);
  } catch (err) {
    friendly(err, 'That string could not be reset. Please try again.');
  }

  revalidateUiStrings();
  revalidatePath(ADMIN);
}
