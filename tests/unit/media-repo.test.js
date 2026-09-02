import { describe, it, expect } from 'vitest';
import { mediaAlt } from '../../lib/media/repo.js';

describe('mediaAlt', () => {
  it('returns the requested locale', () => {
    expect(mediaAlt({ alt: { en: 'Aerial view', bn: 'আকাশ থেকে' } }, 'bn')).toBe('আকাশ থেকে');
  });

  it('falls back to English when the locale is missing', () => {
    expect(mediaAlt({ alt: { en: 'Aerial view' } }, 'zh')).toBe('Aerial view');
  });

  it('returns empty string when there is no alt at all', () => {
    expect(mediaAlt({ alt: null }, 'en')).toBe('');
    expect(mediaAlt({}, 'en')).toBe('');
    expect(mediaAlt(null, 'en')).toBe('');
  });

  it('survives a scalar or malformed alt value', () => {
    // A hand-edited row can put a string where an object belongs. It must
    // degrade to no alt text, never take the page down.
    expect(mediaAlt({ alt: 'just a string' }, 'en')).toBe('');
    expect(mediaAlt({ alt: ['array'] }, 'en')).toBe('');
  });

  it('ignores a non-string value for the requested locale', () => {
    expect(mediaAlt({ alt: { en: 'ok', bn: 42 } }, 'bn')).toBe('ok');
  });
});
