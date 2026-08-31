import { describe, it, expect } from 'vitest';
import { LOCALES } from '../../lib/i18n/locales.js';
import { UI, t } from '../../lib/i18n/ui.js';

describe('ui strings', () => {
  it('defines every key in every locale', () => {
    const keys = Object.keys(UI.en);
    expect(keys.length).toBeGreaterThan(0);
    for (const locale of LOCALES) {
      for (const key of keys) {
        expect(UI[locale][key], `${locale}.${key}`).toBeTruthy();
      }
    }
  });

  it('falls back to English for an unknown locale or key', () => {
    expect(t('fr', 'navTravel')).toBe(UI.en.navTravel);
    expect(t('bn', 'nope')).toBe('nope');
  });
});
