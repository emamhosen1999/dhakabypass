/**
 * `updateMediaAltAction` — the screen that finally lets somebody describe a
 * photograph without emailing a developer.
 *
 * Four things are pinned here, each of them a way the screen could look like it
 * works while quietly not working:
 *
 *   1. AUTHORIZATION runs before anything else. `assertCan('manage_media')` is
 *      the first statement, matching `app/admin/api/upload/route.js` and
 *      `app/admin/api/media/route.js` rather than the weaker `isAdmin`-only
 *      check that let a translator upload files.
 *
 *   2. ALL THREE LOCALES are written from one submit, and an EMPTY BOX DROPS
 *      the locale rather than storing ''. `mediaAlt()` falls back to English
 *      for a missing key, and a stored '' would defeat that fallback — the
 *      Bangla reader would get silence where they should have got the English
 *      sentence.
 *
 *   3. THE SAVE FIRES THE TAGS. The gallery reads the library through a
 *      MEDIA_TAG cache entry and each page renders the row through its own
 *      cached tree, so an alt edit that fires neither sits in the database
 *      while the site keeps reading the old one for up to the 300-second
 *      recovery floor.
 *
 *   4. CLEARING IS DELIBERATE. Emptying all three boxes writes {} — that is
 *      the explicit act that Replace is no longer allowed to perform silently.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../auth.js', () => ({ auth: vi.fn() }));
vi.mock('../../lib/media/repo.js', () => ({
  setMediaAlt: vi.fn(),
  getMediaById: vi.fn(),
}));
vi.mock('../../lib/media/replace.js', () => ({
  applyMediaReplacement: vi.fn(),
  pageSlugsUsingMedia: vi.fn(),
}));
vi.mock('../../lib/db.js', () => ({ query: vi.fn(), withTransaction: vi.fn() }));
vi.mock('../../lib/media.js', () => ({
  saveUpload: vi.fn(),
  ALLOWED_MIME_TYPES: ['image/webp', 'image/jpeg', 'image/png', 'image/svg+xml'],
}));
vi.mock('../../lib/revalidate.js', () => ({
  revalidateMedia: vi.fn(),
  revalidatePage: vi.fn(),
}));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
// The production transport (redirect-with-notice) is tested on its own in
// run-action.test.js; here the bodies' thrown messages are the subject.
vi.mock('../../lib/admin/run-action.js', () => ({ runAction: (fn) => fn() }));

import { auth } from '../../auth.js';
import { setMediaAlt, getMediaById } from '../../lib/media/repo.js';
import { pageSlugsUsingMedia } from '../../lib/media/replace.js';
import { revalidateMedia, revalidatePage } from '../../lib/revalidate.js';
import { revalidatePath } from 'next/cache';
import { updateMediaAltAction } from '../../app/admin/(dash)/media/actions.js';

function formData(entries) {
  const fd = new FormData();
  for (const [k, v] of Object.entries(entries)) fd.set(k, v);
  return fd;
}

function signedInAs(role) {
  auth.mockResolvedValue({ user: { isAdmin: true, role, email: 'a@b.c' } });
}

const EN = 'A gantry over the carriageway, with the toll plaza and trucks beyond';
const BN = 'ক্যারেজওয়ের উপরে একটি গ্যান্ট্রি, তার ওপাশে টোল প্লাজা ও ট্রাক';
const ZH = '行车道上方的龙门架，后方是收费广场和货车';

beforeEach(() => {
  vi.clearAllMocks();
  signedInAs('admin');
  getMediaById.mockResolvedValue({ id: 2, path: '/bypass-ex.webp' });
  setMediaAlt.mockResolvedValue(true);
  pageSlugsUsingMedia.mockResolvedValue([]);
});

describe('updateMediaAltAction — authorization', () => {
  it('refuses an unauthenticated caller before touching the database', async () => {
    auth.mockResolvedValue(null);
    await expect(updateMediaAltAction(formData({ id: '2', alt_en: EN })))
      .rejects.toThrow('Sign in to continue');
    expect(setMediaAlt).not.toHaveBeenCalled();
    expect(revalidateMedia).not.toHaveBeenCalled();
  });

  it('refuses a translator — describing a picture is a media act, not a translation', async () => {
    // The permission matches app/admin/api/upload/route.js, which was fixed to
    // require manage_media for exactly this reason.
    signedInAs('translator');
    await expect(updateMediaAltAction(formData({ id: '2', alt_en: EN })))
      .rejects.toThrow('Your role cannot manage media');
    expect(setMediaAlt).not.toHaveBeenCalled();
  });

  it('lets an editor save', async () => {
    signedInAs('editor');
    await updateMediaAltAction(formData({ id: '2', alt_en: EN }));
    expect(setMediaAlt).toHaveBeenCalledWith(2, { en: EN });
  });
});

describe('updateMediaAltAction — what it writes', () => {
  it('writes all three locales from one submit', async () => {
    await updateMediaAltAction(formData({ id: '2', alt_en: EN, alt_bn: BN, alt_zh: ZH }));
    expect(setMediaAlt).toHaveBeenCalledWith(2, { en: EN, bn: BN, zh: ZH });
  });

  it('drops an empty box instead of storing an empty string', async () => {
    await updateMediaAltAction(formData({ id: '2', alt_en: EN, alt_bn: '', alt_zh: '   ' }));
    expect(setMediaAlt).toHaveBeenCalledWith(2, { en: EN });
  });

  it('trims surrounding whitespace', async () => {
    await updateMediaAltAction(formData({ id: '2', alt_en: `  ${EN}  ` }));
    expect(setMediaAlt).toHaveBeenCalledWith(2, { en: EN });
  });

  it('clears every language when all three boxes are emptied — the deliberate reset', async () => {
    await updateMediaAltAction(formData({ id: '2', alt_en: '', alt_bn: '', alt_zh: '' }));
    expect(setMediaAlt).toHaveBeenCalledWith(2, {});
  });

  it('rejects an id that is not a row', async () => {
    await expect(updateMediaAltAction(formData({ id: '0', alt_en: EN }))).rejects.toThrow();
    await expect(updateMediaAltAction(formData({ id: 'abc', alt_en: EN }))).rejects.toThrow();
    expect(setMediaAlt).not.toHaveBeenCalled();
  });

  it('rejects an image that no longer exists', async () => {
    getMediaById.mockResolvedValue(null);
    await expect(updateMediaAltAction(formData({ id: '99', alt_en: EN })))
      .rejects.toThrow('That image no longer exists.');
    expect(setMediaAlt).not.toHaveBeenCalled();
  });

  it('refuses a sentence too long to be read aloud usefully', async () => {
    await expect(updateMediaAltAction(formData({ id: '2', alt_en: 'x'.repeat(1000) })))
      .rejects.toThrow(/shorter/i);
    expect(setMediaAlt).not.toHaveBeenCalled();
  });
});

describe('updateMediaAltAction — cache invalidation', () => {
  it('fires the media tag so the gallery stops reading the old sentence', async () => {
    await updateMediaAltAction(formData({ id: '2', alt_en: EN }));
    expect(revalidateMedia).toHaveBeenCalled();
  });

  it('revalidates every page that shows the picture', async () => {
    pageSlugsUsingMedia.mockResolvedValue(['home', 'project']);
    await updateMediaAltAction(formData({ id: '2', alt_en: EN }));
    expect(pageSlugsUsingMedia).toHaveBeenCalledWith('/bypass-ex.webp');
    expect(revalidatePage).toHaveBeenCalledWith('home');
    expect(revalidatePage).toHaveBeenCalledWith('project');
  });

  it('refreshes the media screen itself', async () => {
    await updateMediaAltAction(formData({ id: '2', alt_en: EN }));
    expect(revalidatePath).toHaveBeenCalledWith('/admin/media');
  });
});
