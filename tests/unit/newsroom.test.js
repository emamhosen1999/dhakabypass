/**
 * The newsroom's pure logic: the translation fallback and the date formatting.
 *
 * Both are places where a silent wrong answer is the likely failure. A fallback
 * that took the whole row would drop an English body when only the headline had
 * been translated; a date formatted in the server's timezone would render the
 * wrong day for half the corridor's readers.
 */
import { describe, it, expect } from 'vitest';
import { applyTranslation } from '../../lib/newsroom/repo.js';
import { formatNewsDate, newsDateISO, asNewsDate } from '../../lib/newsroom/format.js';

const base = {
  id: 7,
  title: 'Vogra to Mirer Bazar reopens',
  excerpt: 'The section is carrying traffic again.',
  body: '<p>English body.</p>',
  slug: 'vogra-reopens',
};

describe('applyTranslation', () => {
  it('returns the English row untouched for en', () => {
    const out = applyTranslation(base, [], 'en');
    expect(out.title).toBe(base.title);
    expect(out.translated).toBe(true);
    expect(out.locale).toBe('en');
  });

  it('applies a published translation', () => {
    const out = applyTranslation(base, [
      { locale: 'bn', title: 'বাংলা শিরোনাম', excerpt: 'বাংলা সারাংশ', body: '<p>বাংলা</p>', status: 'published' },
    ], 'bn');
    expect(out.title).toBe('বাংলা শিরোনাম');
    expect(out.body).toBe('<p>বাংলা</p>');
    expect(out.translated).toBe(true);
    expect(out.locale).toBe('bn');
  });

  it('ignores a draft translation and reports the fallback', () => {
    // A half-finished Bangla translation must not reach the public site, and
    // the page has to be able to say the item is being shown in English.
    const out = applyTranslation(base, [
      { locale: 'bn', title: 'খসড়া', excerpt: 'খসড়া', body: null, status: 'draft' },
    ], 'bn');
    expect(out.title).toBe(base.title);
    expect(out.translated).toBe(false);
  });

  it('falls back field by field, not row by row', () => {
    // Someone translates the headline first. Taking the whole row or none would
    // either lose the English body or ignore the Bangla title.
    const out = applyTranslation(base, [
      { locale: 'bn', title: 'বাংলা শিরোনাম', excerpt: '', body: null, status: 'published' },
    ], 'bn');
    expect(out.title).toBe('বাংলা শিরোনাম');
    expect(out.excerpt).toBe(base.excerpt);
    expect(out.body).toBe(base.body);
  });

  it('honours an explicitly empty body as an editorial choice', () => {
    // '' means "no body, the excerpt is the whole item". Only null falls back.
    const out = applyTranslation(base, [
      { locale: 'bn', title: 'শিরোনাম', excerpt: 'সারাংশ', body: '', status: 'published' },
    ], 'bn');
    expect(out.body).toBe('');
  });

  it('ignores a translation for a different locale', () => {
    const out = applyTranslation(base, [
      { locale: 'zh', title: '中文标题', excerpt: '中文', body: null, status: 'published' },
    ], 'bn');
    expect(out.title).toBe(base.title);
    expect(out.translated).toBe(false);
  });

  it('survives a null translation list', () => {
    expect(applyTranslation(base, null, 'bn').title).toBe(base.title);
  });
});

describe('formatNewsDate', () => {
  it('writes the date in each locale', () => {
    const d = new Date('2026-03-14T00:00:00Z');
    expect(formatNewsDate(d, 'en')).toMatch(/2026/);
    expect(formatNewsDate(d, 'bn')).toMatch(/২০২৬|2026/);
    expect(formatNewsDate(d, 'zh')).toMatch(/2026/);
  });

  it('does not shift the day across timezones', () => {
    // published_at is a DATE with no time. Formatting it in the server's zone
    // would move it a day either side of midnight — the host runs UTC and the
    // editors are at UTC+6, so this is a real day-off bug, not a theoretical one.
    for (const locale of ['en', 'bn', 'zh']) {
      expect(formatNewsDate(new Date('2026-01-01T00:00:00Z'), locale)).not.toMatch(/2025/);
      expect(formatNewsDate(new Date('2026-12-31T00:00:00Z'), locale)).not.toMatch(/2027/);
    }
  });

  it('returns an empty string for an unparseable value, never "Invalid Date"', () => {
    // This renders inside a <time> on a public page.
    expect(formatNewsDate(null)).toBe('');
    expect(formatNewsDate('not a date')).toBe('');
    expect(formatNewsDate(undefined)).toBe('');
  });

  it('accepts a string as well as a Date', () => {
    expect(formatNewsDate('2026-03-14', 'en')).toMatch(/2026/);
  });

  it('falls back to English formatting for an unknown locale', () => {
    expect(formatNewsDate(new Date('2026-03-14T00:00:00Z'), 'xx')).toMatch(/2026/);
  });
});

describe('newsDateISO', () => {
  it('gives the machine-readable date', () => {
    expect(newsDateISO(new Date('2026-03-14T00:00:00Z'))).toBe('2026-03-14');
    expect(newsDateISO('2026-03-14')).toBe('2026-03-14');
  });

  it('is undefined for a missing value, so the attribute is omitted', () => {
    // <time dateTime=""> is invalid HTML; an absent attribute is not.
    expect(newsDateISO(null)).toBeUndefined();
    expect(newsDateISO(undefined)).toBeUndefined();
    expect(newsDateISO('')).toBeUndefined();
  });
});

describe('asNewsDate', () => {
  it('rejects null rather than returning the Unix epoch', () => {
    // `new Date(null)` is 1970-01-01, not Invalid Date, so a NULL published_at
    // sailed through a NaN check and rendered "1 January 1970" on a live page.
    expect(asNewsDate(null)).toBeNull();
    expect(asNewsDate('')).toBeNull();
    expect(asNewsDate(undefined)).toBeNull();
  });

  it('passes a real date through', () => {
    expect(asNewsDate('2026-03-14')).toBeInstanceOf(Date);
  });
});
