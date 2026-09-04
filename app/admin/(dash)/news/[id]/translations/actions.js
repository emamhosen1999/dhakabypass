'use server';

import { revalidatePath } from 'next/cache';
import { assertCan } from '../../../../../../lib/auth/assert-can';
import { isLocale, DEFAULT_LOCALE } from '../../../../../../lib/i18n/locales';
import { revalidateNews } from '../../../../../../lib/revalidate';
import { saveNewsTranslation, deleteNewsTranslation } from '../../../../../../lib/newsroom/admin';
import { validationError, friendly } from '../../../../../../lib/errors';

const VALID_STATUSES = ['draft', 'published'];

function adminPath(id) {
  return `/admin/news/${id}/translations`;
}

/**
 * Save one locale's translation of one article.
 *
 * Guarded by `translate` rather than `publish`: translating is the capability
 * this work needs, and the same gate the block translation editor uses.
 */
export async function saveNewsTranslationAction(formData) {
  await assertCan('translate');

  const newsId = Number(formData.get('newsId'));
  const locale = String(formData.get('locale') || '');
  const status = String(formData.get('status') || 'draft');

  if (!Number.isInteger(newsId) || newsId <= 0) validationError('That article no longer exists.');

  // A stale form or a forged hidden field could carry a locale outside the
  // supported set. On a non-strict sql_mode — a plausible default on shared
  // MariaDB hosting — that inserts as '' rather than erroring, leaving a row no
  // reader will ever surface and no editor can find.
  if (!isLocale(locale)) validationError('That is not a language this site publishes.');

  // English is the base row on `news_updates`. Storing it here as well would
  // create two places to edit the same text, which drift the first time someone
  // uses the wrong screen.
  if (locale === DEFAULT_LOCALE) {
    validationError('English is edited on the article itself, not as a translation.');
  }

  if (!VALID_STATUSES.includes(status)) validationError('Status must be draft or published.');

  const title = String(formData.get('title') || '').trim();
  const excerpt = String(formData.get('excerpt') || '').trim();
  const body = String(formData.get('body') || '').trim();

  // A draft may be incomplete; a published translation may not. Without a title
  // the public list would show the English headline above translated body text,
  // which reads as a bug rather than as a fallback.
  if (status === 'published' && !title) {
    validationError('A published translation needs a title.');
  }

  try {
    await saveNewsTranslation({ newsId, locale, title, excerpt, body, status });
  } catch (err) {
    friendly(err, 'The translation could not be saved. Please try again.');
  }

  revalidateNews();
  revalidatePath(adminPath(newsId));
}

/** Remove a translation, so the article falls back to English in that locale. */
export async function deleteNewsTranslationAction(formData) {
  await assertCan('translate');

  const newsId = Number(formData.get('newsId'));
  const locale = String(formData.get('locale') || '');
  if (!Number.isInteger(newsId) || newsId <= 0) validationError('That article no longer exists.');
  if (!isLocale(locale) || locale === DEFAULT_LOCALE) {
    validationError('That is not a translation that can be removed.');
  }

  try {
    await deleteNewsTranslation(newsId, locale);
  } catch (err) {
    friendly(err, 'The translation could not be removed. Please try again.');
  }

  revalidateNews();
  revalidatePath(adminPath(newsId));
}
