/**
 * The gallery's alt-text resolution.
 *
 * `media.alt` is a per-locale JSON object stored in a MariaDB column declared
 * JSON — which is an alias for LONGTEXT — so mysql2 may hand it back parsed or
 * as a string depending on the column type and driver version. Getting that
 * wrong renders "[object Object]" into an alt attribute, which a screen reader
 * announces as though it were a description of the photograph.
 */
import { describe, it, expect } from 'vitest';
import { altFor, publicCredit } from '../../lib/gallery/repo.js';

const ALT = {
  en: 'A gantry over the carriageway',
  bn: 'ক্যারিজওয়ের উপর একটি গ্যান্ট্রি',
  zh: '跨越车道的门架',
};

describe('altFor', () => {
  it('returns the requested locale', () => {
    expect(altFor(ALT, 'bn')).toBe(ALT.bn);
    expect(altFor(ALT, 'zh')).toBe(ALT.zh);
  });

  it('parses a JSON string, which is how MariaDB hands the column back', () => {
    expect(altFor(JSON.stringify(ALT), 'bn')).toBe(ALT.bn);
  });

  it('falls back to English for a missing locale', () => {
    expect(altFor({ en: ALT.en }, 'bn')).toBe(ALT.en);
  });

  it('never returns an object, whatever it is given', () => {
    // The failure this guards: "[object Object]" in an alt attribute.
    for (const input of [ALT, JSON.stringify(ALT), { en: {} }, { en: 42 }, [1, 2]]) {
      expect(typeof altFor(input, 'en')).toBe('string');
    }
  });

  it('treats a non-JSON string as a pre-localisation alt', () => {
    // Rows written before alt became per-locale hold a bare string.
    expect(altFor('An older single-language description', 'bn'))
      .toBe('An older single-language description');
  });

  it('returns an empty string rather than throwing on junk', () => {
    for (const input of [null, undefined, '', 0, false, [1, 2]]) {
      expect(altFor(input, 'en')).toBe('');
    }
  });

  it('discards corrupt JSON rather than reading it aloud', () => {
    // A string opening with { or [ that will not parse is a broken alt column,
    // not a legacy sentence. Returning it puts `{oops` in an alt attribute,
    // where a screen reader announces it as the description of the photograph.
    expect(altFor('{oops', 'en')).toBe('');
    expect(altFor('{"en": broken}', 'en')).toBe('');
    expect(altFor('[1,', 'en')).toBe('');
  });

  it('trims, so whitespace does not become a non-empty alt', () => {
    // '  ' is truthy, so an untrimmed value would pass an `alt ? …` check and
    // render a caption made of spaces.
    expect(altFor({ en: '   ' }, 'en')).toBe('');
  });

  it('defaults to English with no locale given', () => {
    expect(altFor(ALT)).toBe(ALT.en);
  });
});

describe('publicCredit', () => {
  it('drops the internal consent note', () => {
    // media.credit doubles as a provenance record: client decisions §1 records
    // photograph consent by appending "— consent confirmed <date>". Publishing
    // that under a photograph advertises which images of identifiable people
    // someone thought needed checking.
    expect(publicCredit('DBEDC — consent confirmed 2026-09-03')).toBe('DBEDC');
  });

  it('leaves an ordinary credit alone', () => {
    expect(publicCredit('DBEDC')).toBe('DBEDC');
  });

  it('does not split on a hyphen inside a real credit', () => {
    // A hyphen is not an em dash. "Roads and Highways Department - Zone 3" is
    // one credit, not a credit plus a note.
    expect(publicCredit('Roads and Highways Department - Zone 3'))
      .toBe('Roads and Highways Department - Zone 3');
  });

  it('handles an empty or missing credit', () => {
    for (const input of ['', null, undefined, '   ']) expect(publicCredit(input)).toBe('');
  });
});
