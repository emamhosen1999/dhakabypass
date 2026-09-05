'use server';

import { revalidatePath } from 'next/cache';
import { assertCan } from '../../../../lib/auth/assert-can';
import { setSetting, CONTACT_KEYS, SOCIAL_KEYS } from '../../../../lib/settings';
import { LOCALES } from '../../../../lib/i18n/locales';
import { revalidateSettings } from '../../../../lib/revalidate';
import { validationError, friendly } from '../../../../lib/errors';

const ADMIN = '/admin/settings';

/**
 * Save the contact details and social links.
 *
 * Guarded by `manage_users` — the strictest capability available. These values
 * are published as the operator's official contact details on every page, and a
 * wrong emergency number is the highest-consequence edit anyone can make on this
 * site. Editing a paragraph is `edit_blocks`; changing the number the public
 * calls in an emergency should not be.
 *
 * Every field is optional and saving an empty one CLEARS it, which restores the
 * page's "not yet published" callout. That is deliberate: an operator who
 * realises a number is wrong must be able to withdraw it immediately, and being
 * unable to un-publish is worse than never having published.
 */
export async function saveContactSettingsAction(formData) {
  await assertCan('manage_users');

  const text = (name) => String(formData.get(name) || '').trim();

  const phone = text('phone');
  const email = text('email');
  const emergency = text('emergency');

  // Shape-only validation. Anything stricter rejects real addresses — and the
  // cost of a rejected valid entry here is that the page keeps saying the detail
  // is unpublished, which is worse than a slightly odd-looking one going up.
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    validationError('That does not look like an email address.');
  }
  // Digits, spaces and the usual separators, with an optional extension at the
  // end. Written as an anchored pattern rather than a character class: an
  // earlier version put `ext` INSIDE the class, which allowed the letters e, x
  // and t anywhere in the number — so "16xxx" was accepted and then rendered as
  // `tel:16`, a link that dials the wrong thing silently.
  const PHONE = /^[\d\s+()./-]+(\s*(?:ext|x)\.?\s*\d+)?$/i;
  for (const [label, value] of [['Telephone', phone], ['Emergency number', emergency]]) {
    if (value && !PHONE.test(value)) {
      validationError(
        `${label} does not look like a dialable number. Use digits, spaces and + ( ) - only, `
        + 'with an optional "ext 123" at the end.',
      );
    }
  }

  const perLocale = (name) => {
    const out = {};
    for (const locale of LOCALES) {
      const v = String(formData.get(`${name}_${locale}`) || '').trim();
      if (v) out[locale] = v;
    }
    return out;
  };

  const socials = {};
  for (const name of Object.keys(SOCIAL_KEYS)) {
    const url = text(`social_${name}`);
    if (url && !/^https:\/\//i.test(url)) {
      validationError(`The ${name} link must be a full https:// URL.`);
    }
    socials[name] = url;
  }

  try {
    await setSetting(CONTACT_KEYS.phone, phone);
    await setSetting(CONTACT_KEYS.email, email);
    await setSetting(CONTACT_KEYS.emergency, emergency);
    await setSetting(CONTACT_KEYS.address, perLocale('address'));
    await setSetting(CONTACT_KEYS.hours, perLocale('hours'));
    for (const [name, key] of Object.entries(SOCIAL_KEYS)) {
      await setSetting(key, socials[name]);
    }
  } catch (err) {
    friendly(err, 'The settings could not be saved. Please try again.');
  }

  revalidateSettings();
  revalidatePath(ADMIN);
}
