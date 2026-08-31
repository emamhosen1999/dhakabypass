import { describe, it, expect } from 'vitest';
import { safeFilename, extensionForMime, ALLOWED_MIME_TYPES } from '../../lib/media.js';

describe('safeFilename', () => {
  it('lowercases and slugifies', () => {
    expect(safeFilename('My Photo 01.WEBP')).toMatch(/^my-photo-01\.webp$/);
  });

  it('strips path traversal', () => {
    expect(safeFilename('../../etc/passwd.png')).toBe('etc-passwd.png');
    // A single-backslash Windows path (`\\` in the JS source is one literal
    // backslash at runtime) — not a doubled-up fake.
    expect(safeFilename('..\\windows\\a.png')).toBe('windows-a.png');
  });

  it('drops characters that are not safe in a URL', () => {
    expect(safeFilename('a b&c#d?.jpg')).toBe('a-b-c-d.jpg');
  });

  it('keeps a sane name when there is no extension', () => {
    expect(safeFilename('noext')).toBe('noext');
  });

  it('treats a leading-dot name as the stem, not an extension', () => {
    // path.extname('.png') is '' — dotfiles have no extension, so ".png"
    // is the stem. The result is still safe, which is what matters here.
    expect(safeFilename('///.png')).toBe('png');
  });

  it('never returns an empty name', () => {
    expect(safeFilename('///')).toBe('file');
  });

  it('caps the stem at 60 characters', () => {
    const long = 'a'.repeat(200) + '.png';
    const result = safeFilename(long);
    const stem = result.slice(0, result.length - '.png'.length);
    expect(stem.length).toBeLessThanOrEqual(60);
    expect(result.endsWith('.png')).toBe(true);
  });
});

describe('extensionForMime', () => {
  it('maps each allowed mime to its real extension', () => {
    expect(extensionForMime('image/webp')).toBe('.webp');
    expect(extensionForMime('image/jpeg')).toBe('.jpg');
    expect(extensionForMime('image/png')).toBe('.png');
    expect(extensionForMime('image/svg+xml')).toBe('.svg');
  });

  it('returns null for anything not in the allowlist', () => {
    expect(extensionForMime('text/html')).toBe(null);
    expect(extensionForMime('application/x-php')).toBe(null);
    expect(extensionForMime('')).toBe(null);
    expect(extensionForMime(undefined)).toBe(null);
  });

  it('never resolves a prototype key — a plain object lookup would leak these', () => {
    expect(extensionForMime('constructor')).toBe(null);
    expect(extensionForMime('toString')).toBe(null);
    expect(extensionForMime('__proto__')).toBe(null);
    expect(extensionForMime('hasOwnProperty')).toBe(null);
  });

  it('agrees with ALLOWED_MIME_TYPES, so the route and the extension map cannot drift', () => {
    for (const mime of ALLOWED_MIME_TYPES) {
      expect(extensionForMime(mime)).toBeTruthy();
    }
  });
});
