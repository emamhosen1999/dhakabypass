import { describe, it, expect } from 'vitest';
import {
  LOCALES, DEFAULT_LOCALE, LOCALE_HTML_LANG,
  isLocale, localeFromPath, stripLocale, withLocale,
} from '../../lib/i18n/locales.js';

describe('locales', () => {
  it('exposes exactly the three project locales', () => {
    expect(LOCALES).toEqual(['en', 'bn', 'zh']);
    expect(DEFAULT_LOCALE).toBe('en');
  });

  it('maps zh to a script-qualified html lang', () => {
    expect(LOCALE_HTML_LANG.zh).toBe('zh-Hans');
    expect(LOCALE_HTML_LANG.bn).toBe('bn');
  });

  it('recognises only known locales', () => {
    expect(isLocale('bn')).toBe(true);
    expect(isLocale('fr')).toBe(false);
    expect(isLocale('')).toBe(false);
    expect(isLocale(undefined)).toBe(false);
  });

  it('reads the locale off a path', () => {
    expect(localeFromPath('/bn/travel/toll')).toBe('bn');
    expect(localeFromPath('/en')).toBe('en');
    expect(localeFromPath('/project')).toBe(null);
    expect(localeFromPath('/')).toBe(null);
  });

  it('strips the locale segment', () => {
    expect(stripLocale('/bn/travel/toll')).toBe('/travel/toll');
    expect(stripLocale('/en')).toBe('/');
    expect(stripLocale('/project')).toBe('/project');
  });

  it('rewrites a path onto another locale', () => {
    expect(withLocale('/bn/travel/toll', 'zh')).toBe('/zh/travel/toll');
    expect(withLocale('/travel/toll', 'en')).toBe('/en/travel/toll');
    expect(withLocale('/', 'bn')).toBe('/bn');
  });
});
