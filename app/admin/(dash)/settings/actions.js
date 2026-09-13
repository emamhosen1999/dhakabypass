'use server';

import { runAction } from '../../../../lib/admin/run-action';

import { revalidatePath } from 'next/cache';
import { assertCan } from '../../../../lib/auth/assert-can';
import { setSetting, CONTACT_KEYS, SOCIAL_KEYS } from '../../../../lib/settings';
import { BRAND_KEYS, validateBrand } from '../../../../lib/brand/tokens';
import { LOCALES } from '../../../../lib/i18n/locales';
import { revalidateSettings, revalidateSeo } from '../../../../lib/revalidate';
import { SEO_KEYS, ROBOTS_MODES, parseDisallowList, publishablePath } from '../../../../lib/seo/settings';
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
async function saveContactSettingsAction$inner(formData) {
  await assertCan('manage_users');

  const text = (name) => String(formData.get(name) || '').trim();

  const phone = text('phone');
  const email = text('email');
  const emergency = text('emergency');
  const nationalEmergency = text('national_emergency');

  // Shape-only validation. Anything stricter rejects real addresses — and the
  // cost of a rejected valid entry here is that the page keeps saying the detail
  // is unpublished, which is worse than a slightly odd-looking one going up.
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw validationError('That does not look like an email address.');
  }
  // Digits, spaces and the usual separators, with an optional extension at the
  // end. Written as an anchored pattern rather than a character class: an
  // earlier version put `ext` INSIDE the class, which allowed the letters e, x
  // and t anywhere in the number — so "16xxx" was accepted and then rendered as
  // `tel:16`, a link that dials the wrong thing silently.
  const PHONE = /^[\d\s+()./-]+(\s*(?:ext|x)\.?\s*\d+)?$/i;
  for (const [label, value] of [['Telephone', phone], ['Emergency number', emergency], ['National emergency number', nationalEmergency]]) {
    if (value && !PHONE.test(value)) {
      throw validationError(
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
      throw validationError(`The ${name} link must be a full https:// URL.`);
    }
    socials[name] = url;
  }

  try {
    await setSetting(CONTACT_KEYS.phone, phone);
    await setSetting(CONTACT_KEYS.email, email);
    await setSetting(CONTACT_KEYS.emergency, emergency);
    await setSetting(CONTACT_KEYS.nationalEmergency, nationalEmergency);
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

/**
 * Save the site-level SEO and identity values (W1.24).
 *
 * These were literals in `app/layout.jsx` and `lib/seo/organization.js` until
 * this screen existed: the site title, the meta description, the favicon (which
 * could not be replaced at all), the default share image, the organisation name
 * and logo used in structured data, and the robots.txt posture.
 *
 * Guarded by `manage_users`, the strictest capability available, and the same
 * one the contact details use. Two of these fields justify it on their own:
 * `robots_mode = block_all` removes the entire site from every search engine,
 * and the organisation name is published as a machine-readable claim about the
 * company in JSON-LD. Neither is an editing decision.
 *
 * CLEARING A FIELD IS A RETURN TO THE DEFAULT, not a way to publish nothing.
 * That is the opposite of the contact details above, and deliberately so: a
 * cleared phone number must un-publish, because a wrong number is worse than
 * none, but there is no honest "no title" state for a web page - it would emit
 * `<title></title>`, which is a search result nobody can click. `getSeoSettings`
 * enforces this on the read side too, so a row that is blank for any other
 * reason behaves the same way.
 */
async function saveSeoSettingsAction$inner(formData) {
  await assertCan('manage_users');

  const text = (name) => String(formData.get(name) || '').trim();

  const perLocale = (name) => {
    const out = {};
    for (const locale of LOCALES) {
      const v = String(formData.get(`${name}_${locale}`) || '').trim();
      if (v) out[locale] = v;
    }
    return out;
  };

  // Validated here as well as in `publishablePath` on the read side. The reader
  // silently falls back, which is right for a value that is already stored and
  // must not take a page down - but silence is wrong at the moment somebody
  // types one: they would save, see no error, and find the site still showing
  // the old icon with nothing to explain why.
  const asset = (name, label) => {
    const raw = text(name);
    if (!raw) return '';
    const clean = publishablePath(raw);
    if (!clean) {
      throw validationError(
        `${label} must be a path beginning with "/" (such as /uploads/mark.png) `
        + 'or a full https:// URL.',
      );
    }
    return clean;
  };

  const favicon = asset('favicon', 'The favicon');
  const ogImage = asset('og_image', 'The default share image');
  const logoPath = asset('logo_path', 'The organisation logo');
  const headerLogo = asset('header_logo', 'The header logo');

  const robotsMode = text('robots_mode');
  if (robotsMode && !ROBOTS_MODES.includes(robotsMode)) {
    throw validationError('Choose one of the listed search-engine options.');
  }

  try {
    await setSetting(SEO_KEYS.siteTitle, perLocale('site_title'));
    await setSetting(SEO_KEYS.siteDescription, perLocale('site_description'));
    await setSetting(SEO_KEYS.favicon, favicon);
    await setSetting(SEO_KEYS.ogImage, ogImage);
    await setSetting(SEO_KEYS.robotsMode, robotsMode || 'default');
    await setSetting(SEO_KEYS.robotsDisallow, parseDisallowList(String(formData.get('robots_disallow') || '')));
    await setSetting(SEO_KEYS.orgName, text('org_name'));
    await setSetting(SEO_KEYS.orgShortName, text('org_short_name'));
    await setSetting(SEO_KEYS.logoPath, logoPath);
    await setSetting(SEO_KEYS.headerLogo, headerLogo);
  } catch (err) {
    friendly(err, 'The SEO settings could not be saved. Please try again.');
  }

  revalidateSeo();
  // robots.txt is force-dynamic so it needs nothing, but /sitemap.xml is an
  // hourly ISR route: without this a change to the robots posture would leave
  // the sitemap advertising the old answer for up to an hour.
  revalidatePath('/sitemap.xml');
  revalidatePath(ADMIN);
}

// ---------------------------------------------------------------------------
// Every exported action runs through runAction(): a thrown validation error
// becomes a redirect back to the form with the sentence in `?notice=`, which
// is the only way a message survives a production build. See
// lib/admin/run-action.js. The bodies above are unchanged.
/**
 * Brand tokens (W1.16): the plate blue, the accent orange and the page
 * width. Refused, with the measured ratio, when the plate's light text or
 * the accent would fall under WCAG AA on the chosen plate — the stylesheet's
 * own floor. Blank fields restore the shipped value.
 */
async function saveBrandSettingsAction$inner(formData) {
  await assertCan('manage_pages');
  const checked = validateBrand({
    plateBg: formData.get('plate_bg'), plateAccent: formData.get('plate_accent'), shell: formData.get('shell'),
  });
  if (!checked.ok) throw validationError(checked.errors.join(' '));
  try {
    await setSetting(BRAND_KEYS.plateBg, checked.value.plateBg || '');
    await setSetting(BRAND_KEYS.plateAccent, checked.value.plateAccent || '');
    await setSetting(BRAND_KEYS.shell, checked.value.shell || 0);
  } catch (err) {
    friendly(err, 'The brand settings could not be saved. Please try again.');
  }
  revalidateSettings();
  // Every public page carries the override; the layout cache must drop it.
  revalidatePath('/', 'layout');
  revalidatePath(ADMIN);
}

// ---------------------------------------------------------------------------
export async function saveContactSettingsAction(formData) {
  return runAction(() => saveContactSettingsAction$inner(formData));
}
export async function saveSeoSettingsAction(formData) {
  return runAction(() => saveSeoSettingsAction$inner(formData));
}
export async function saveBrandSettingsAction(formData) {
  return runAction(() => saveBrandSettingsAction$inner(formData));
}
