/**
 * Contact details from `site_settings`.
 *
 * These are the values that make a "not yet published" notice disappear from a
 * public page, so the failure that matters is the one where the page shows
 * SOMETHING when it should show the notice — an empty contact list reads as a
 * broken page, and a stale number reads as a working one that isn't.
 */
import { describe, it, expect } from 'vitest';
import { localeString, CONTACT_KEYS, SOCIAL_KEYS } from '../../lib/settings.js';

describe('localeString', () => {
  it('returns the requested locale', () => {
    expect(localeString({ en: 'Office', bn: 'কার্যালয়' }, 'bn')).toBe('কার্যালয়');
  });

  it('falls back to English so a reader sees something', () => {
    expect(localeString({ en: 'Office' }, 'zh')).toBe('Office');
  });

  it('accepts a plain string, so an entry typed before the field was translatable survives', () => {
    expect(localeString('Office', 'bn')).toBe('Office');
  });

  it('treats a whitespace-only value as absent', () => {
    // '   ' is truthy. Without trimming it would count as "supplied" and the
    // page would render a blank line where an address should be.
    expect(localeString({ en: '   ' }, 'en')).toBe('');
    expect(localeString({ en: 'A', bn: '  ' }, 'bn')).toBe('A');
  });

  it('returns empty for junk rather than throwing', () => {
    for (const v of [null, undefined, 42, [], { en: 5 }]) expect(localeString(v, 'en')).toBe('');
  });
});

describe('the key maps', () => {
  it('are the single source of the setting names', () => {
    // The admin writes these and the readers read them. Two lists would drift,
    // and the symptom would be a field that saves and never appears.
    expect(Object.values(CONTACT_KEYS).every((k) => k.startsWith('contact.'))).toBe(true);
    expect(Object.values(SOCIAL_KEYS).every((k) => k.startsWith('social.'))).toBe(true);
    expect(new Set(Object.values(CONTACT_KEYS)).size).toBe(Object.keys(CONTACT_KEYS).length);
  });
});
