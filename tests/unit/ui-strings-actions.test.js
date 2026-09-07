/**
 * The two server actions behind /admin/translations.
 *
 * Three things are being pinned down here and each of them is a way the screen
 * could look like it works while quietly not working:
 *
 *   1. AUTHORIZATION runs before anything else. `assertCan('translate')` is the
 *      first statement of both actions, and the point of the tests below is
 *      that no repository call happens when it throws — an action that
 *      validated first and authorized second would still reject the request,
 *      but only after touching the database.
 *
 *   2. AN EMPTY BOX DELETES the row rather than storing ''. That is the whole
 *      of "revert to the built-in wording"; a stored '' is invisible to the
 *      reader (lib/i18n/overrides.js drops blanks) but visible to the admin
 *      screen, which would then report a string as changed forever.
 *
 *   3. A SAVE FIRES THE TAG. Without `revalidateUiStrings()` the edit sits in
 *      the database and the site keeps serving the cached entry for up to the
 *      300-second recovery floor — the operator's evidence is the live page,
 *      so "saved and nothing happened" is the failure they would report.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../auth.js', () => ({ auth: vi.fn() }));
vi.mock('../../lib/i18n/strings-repo.js', () => ({
  setUiString: vi.fn(),
  deleteUiString: vi.fn(),
}));
vi.mock('../../lib/revalidate.js', () => ({ revalidateUiStrings: vi.fn() }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));

import { auth } from '../../auth.js';
import { setUiString, deleteUiString } from '../../lib/i18n/strings-repo.js';
import { revalidateUiStrings } from '../../lib/revalidate.js';
import { revalidatePath } from 'next/cache';
import {
  saveUiStringAction,
  resetUiStringAction,
} from '../../app/admin/(dash)/translations/actions.js';

const KEY = 'ui.navTravel';
const MAP_KEY = 'map.layers';

function formData(entries) {
  const fd = new FormData();
  for (const [k, v] of Object.entries(entries)) fd.set(k, v);
  return fd;
}

function signedInAs(role) {
  auth.mockResolvedValue({ user: { isAdmin: true, role, email: 'a@b.c' } });
}

beforeEach(() => {
  vi.clearAllMocks();
  signedInAs('admin');
});

describe('saveUiStringAction — authorization', () => {
  it('refuses an unauthenticated caller before touching the database', async () => {
    auth.mockResolvedValue(null);
    await expect(saveUiStringAction(formData({ key: KEY, value_en: 'X' })))
      .rejects.toThrow('Sign in to continue');
    expect(setUiString).not.toHaveBeenCalled();
    expect(deleteUiString).not.toHaveBeenCalled();
    expect(revalidateUiStrings).not.toHaveBeenCalled();
  });

  it('refuses a signed-in user whose role has no translate permission', async () => {
    signedInAs('viewer');
    await expect(saveUiStringAction(formData({ key: KEY, value_en: 'X' })))
      .rejects.toThrow('Your role cannot translate');
    expect(setUiString).not.toHaveBeenCalled();
  });

  it('lets the translator role save — the role exists for exactly this screen', async () => {
    signedInAs('translator');
    await saveUiStringAction(formData({ key: KEY, value_en: 'Travel information' }));
    expect(setUiString).toHaveBeenCalledWith(KEY, 'en', 'Travel information');
  });

  it('lets an editor save', async () => {
    signedInAs('editor');
    await saveUiStringAction(formData({ key: KEY, value_bn: 'ভ্রমণ' }));
    expect(setUiString).toHaveBeenCalledWith(KEY, 'bn', 'ভ্রমণ');
  });
});

describe('saveUiStringAction — what it writes', () => {
  it('stores one row per submitted locale, for either namespace', async () => {
    await saveUiStringAction(formData({
      key: MAP_KEY, value_en: 'Map layers', value_bn: 'স্তরসমূহ', value_zh: '图层',
    }));
    expect(setUiString.mock.calls).toEqual([
      [MAP_KEY, 'en', 'Map layers'],
      [MAP_KEY, 'bn', 'স্তরসমূহ'],
      [MAP_KEY, 'zh', '图层'],
    ]);
    expect(deleteUiString).not.toHaveBeenCalled();
  });

  it('DELETES the row for an empty box instead of storing an empty string', async () => {
    await saveUiStringAction(formData({
      key: KEY, value_en: 'Travel', value_bn: '', value_zh: '   ',
    }));
    expect(setUiString.mock.calls).toEqual([[KEY, 'en', 'Travel']]);
    expect(deleteUiString.mock.calls).toEqual([[KEY, 'bn'], [KEY, 'zh']]);
  });

  it('leaves a locale alone when the form did not submit it at all', async () => {
    // A blank box and an absent field are different intents: blank means
    // "revert this one", absent means "this form was not editing that locale".
    await saveUiStringAction(formData({ key: KEY, value_zh: '出行信息' }));
    expect(setUiString.mock.calls).toEqual([[KEY, 'zh', '出行信息']]);
    expect(deleteUiString).not.toHaveBeenCalled();
  });

  it('trims the stored value, so a stray newline is not saved as wording', async () => {
    await saveUiStringAction(formData({ key: KEY, value_en: '  Travel Info\n' }));
    expect(setUiString).toHaveBeenCalledWith(KEY, 'en', 'Travel Info');
  });
});

describe('saveUiStringAction — keys the code does not define', () => {
  it('rejects a key that is in neither code table and writes nothing', async () => {
    await expect(saveUiStringAction(formData({ key: 'ui.notARealKey', value_en: 'X' })))
      .rejects.toThrow('That string no longer exists.');
    expect(setUiString).not.toHaveBeenCalled();
  });

  it('rejects a missing key', async () => {
    await expect(saveUiStringAction(formData({ value_en: 'X' })))
      .rejects.toThrow('That string no longer exists.');
  });

  it('rejects a key with no namespace', async () => {
    await expect(saveUiStringAction(formData({ key: 'navTravel', value_en: 'X' })))
      .rejects.toThrow('That string no longer exists.');
  });
});

describe('saveUiStringAction — going live', () => {
  it('fires the ui-strings tag and refreshes the admin screen', async () => {
    await saveUiStringAction(formData({ key: KEY, value_en: 'Travel' }));
    expect(revalidateUiStrings).toHaveBeenCalledTimes(1);
    expect(revalidatePath).toHaveBeenCalledWith('/admin/translations');
  });

  it('does not claim success — or revalidate — when the write fails', async () => {
    setUiString.mockRejectedValueOnce(Object.assign(new Error('ER_NO_SUCH_TABLE'), {
      code: 'ER_NO_SUCH_TABLE',
    }));
    await expect(saveUiStringAction(formData({ key: KEY, value_en: 'Travel' })))
      .rejects.toThrow(/09-ui-strings\.sql/);
    expect(revalidateUiStrings).not.toHaveBeenCalled();
  });

  it('does not leak the raw driver message to the browser', async () => {
    setUiString.mockRejectedValueOnce(new Error("Access denied for user 'dbuser'@'10.0.0.1'"));
    await expect(saveUiStringAction(formData({ key: KEY, value_en: 'Travel' })))
      .rejects.not.toThrow(/dbuser/);
  });
});

describe('resetUiStringAction', () => {
  it('refuses an unauthenticated caller before deleting anything', async () => {
    auth.mockResolvedValue(null);
    await expect(resetUiStringAction(formData({ key: KEY })))
      .rejects.toThrow('Sign in to continue');
    expect(deleteUiString).not.toHaveBeenCalled();
  });

  it('refuses a role without translate', async () => {
    signedInAs('viewer');
    await expect(resetUiStringAction(formData({ key: KEY })))
      .rejects.toThrow('Your role cannot translate');
    expect(deleteUiString).not.toHaveBeenCalled();
  });

  it('drops every locale of the string in one call, so all three fall back', async () => {
    await resetUiStringAction(formData({ key: KEY }));
    expect(deleteUiString).toHaveBeenCalledWith(KEY);
    expect(deleteUiString).toHaveBeenCalledTimes(1);
  });

  it('rejects a key the code does not define', async () => {
    await expect(resetUiStringAction(formData({ key: 'ui.gone' })))
      .rejects.toThrow('That string no longer exists.');
    expect(deleteUiString).not.toHaveBeenCalled();
  });

  it('fires the ui-strings tag so the site stops serving the override', async () => {
    await resetUiStringAction(formData({ key: MAP_KEY }));
    expect(revalidateUiStrings).toHaveBeenCalledTimes(1);
    expect(revalidatePath).toHaveBeenCalledWith('/admin/translations');
  });

  it('does not revalidate when the delete fails', async () => {
    deleteUiString.mockRejectedValueOnce(new Error('gone'));
    await expect(resetUiStringAction(formData({ key: KEY }))).rejects.toThrow();
    expect(revalidateUiStrings).not.toHaveBeenCalled();
  });
});
