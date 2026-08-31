import { describe, it, expect } from 'vitest';
import { THEME_KEY, THEMES, DEFAULT_THEME, normalizeTheme, themeScriptSource } from '../../lib/theme.js';

describe('theme', () => {
  it('offers three states and defaults to system', () => {
    expect(THEMES).toEqual(['light', 'dark', 'system']);
    expect(DEFAULT_THEME).toBe('system');
  });

  it('normalises anything unexpected to system', () => {
    expect(normalizeTheme('dark')).toBe('dark');
    expect(normalizeTheme('LIGHT')).toBe('light');
    expect(normalizeTheme('purple')).toBe('system');
    expect(normalizeTheme(null)).toBe('system');
  });

  it('produces a script that stamps only explicit choices', () => {
    const src = themeScriptSource();
    expect(src).toContain(THEME_KEY);
    expect(src).toContain('data-theme');
    // "system" must leave the attribute off so prefers-color-scheme decides.
    expect(src).toContain('removeAttribute');
    expect(src).not.toContain('\n\n\n');
  });
});
