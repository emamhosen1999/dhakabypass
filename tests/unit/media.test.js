import { describe, it, expect } from 'vitest';
import { safeFilename } from '../../lib/media.js';

describe('safeFilename', () => {
  it('lowercases and slugifies', () => {
    expect(safeFilename('My Photo 01.WEBP')).toMatch(/^my-photo-01\.webp$/);
  });

  it('strips path traversal', () => {
    expect(safeFilename('../../etc/passwd.png')).toBe('etc-passwd.png');
    expect(safeFilename('..\\\\windows\\\\a.png')).toBe('windows-a.png');
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
});
