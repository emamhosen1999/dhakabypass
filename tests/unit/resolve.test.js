// tests/unit/resolve.test.js
import { describe, it, expect } from 'vitest';
import { resolveTranslation, translationStatus, countMissing } from '../../lib/content/resolve.js';

const en = { locale: 'en', data: { text: 'English' }, status: 'published' };
const bnDraft = { locale: 'bn', data: { text: 'খসড়া' }, status: 'draft' };
const bnLive = { locale: 'bn', data: { text: 'বাংলা' }, status: 'published' };

describe('resolveTranslation', () => {
  it('returns the requested locale when it is published', () => {
    const r = resolveTranslation([en, bnLive], 'bn');
    expect(r.data.text).toBe('বাংলা');
    expect(r.locale).toBe('bn');
    expect(r.fallback).toBe(false);
  });

  it('falls back to English when the locale is only a draft', () => {
    const r = resolveTranslation([en, bnDraft], 'bn');
    expect(r.data.text).toBe('English');
    expect(r.locale).toBe('en');
    expect(r.fallback).toBe(true);
  });

  it('falls back to English when the locale is absent', () => {
    const r = resolveTranslation([en], 'zh');
    expect(r.fallback).toBe(true);
    expect(r.data.text).toBe('English');
  });

  it('never marks English as a fallback of itself', () => {
    expect(resolveTranslation([en], 'en').fallback).toBe(false);
  });

  it('returns null when even English is unpublished', () => {
    expect(resolveTranslation([{ ...en, status: 'draft' }], 'bn')).toBe(null);
    expect(resolveTranslation([], 'en')).toBe(null);
  });
});

describe('translationStatus', () => {
  it('reports the status of one locale', () => {
    expect(translationStatus([en, bnDraft], 'bn')).toBe('draft');
    expect(translationStatus([en, bnLive], 'bn')).toBe('published');
    expect(translationStatus([en], 'zh')).toBe('missing');
  });
});

describe('countMissing', () => {
  it('counts blocks not yet published in a locale', () => {
    expect(countMissing([[en, bnLive], [en], [en, bnDraft]], 'bn')).toBe(2);
    expect(countMissing([[en, bnLive], [en]], 'en')).toBe(0);
  });
});
