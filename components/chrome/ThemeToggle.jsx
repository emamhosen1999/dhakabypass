'use client';

import { useEffect, useLayoutEffect, useState } from 'react';
import { THEME_KEY, THEMES, DEFAULT_THEME, normalizeTheme } from '../../lib/theme.js';

/** Stamp the chosen theme on <html>; "system" removes the attribute. */
function applyTheme(value) {
  const root = document.documentElement;
  if (value === 'system') root.removeAttribute('data-theme');
  else root.setAttribute('data-theme', value);
}

// useLayoutEffect on the server is a no-op with a warning; this component is
// client-only but is still rendered to HTML once.
const useIsomorphicLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

// English fallbacks for the admin, which has no locale; the public header
// passes ui_strings (themeLight/themeDark/themeSystem) so every locale reads
// its own words (audit 1.1).
const DEFAULT_LABELS = { light: 'Light', dark: 'Dark', system: 'System' };

export default function ThemeToggle({ label = 'Theme', labels = DEFAULT_LABELS }) {
  const [theme, setTheme] = useState(DEFAULT_THEME);

  /**
   * Re-stamp the theme every time this mounts, before paint.
   *
   * ThemeScript sets data-theme once, before the first paint of a full load.
   * Switching language is a soft navigation into a REMOUNTED root layout, and
   * React 19 treats <html> as a singleton: when the new layout takes it over,
   * every attribute React did not put there is removed — so a reader who had
   * chosen dark, and switched to Bangla, got the light page back with the
   * toggle still saying "dark". This component lives in that layout, so its
   * mount is exactly the moment to put the attribute back; a layout effect
   * does it before the frame is painted. `storage` keeps a second tab in step.
   */
  useIsomorphicLayoutEffect(() => {
    let stored = DEFAULT_THEME;
    try { stored = normalizeTheme(localStorage.getItem(THEME_KEY)); } catch { stored = DEFAULT_THEME; }
    setTheme(stored);
    applyTheme(stored);
    const onStorage = (e) => {
      if (e.key !== THEME_KEY) return;
      const v = normalizeTheme(e.newValue);
      setTheme(v);
      applyTheme(v);
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  function choose(next) {
    const value = normalizeTheme(next);
    setTheme(value);
    try { localStorage.setItem(THEME_KEY, value); } catch { /* storage blocked: the choice lasts this page */ }
    applyTheme(value);
  }

  return (
    <div className="db-theme-toggle" role="group" aria-label={label}>
      {THEMES.map((t) => (
        <button
          key={t}
          type="button"
          onClick={() => choose(t)}
          aria-pressed={theme === t}
          className="db-theme-btn"
        >
          {labels[t] || DEFAULT_LABELS[t]}
        </button>
      ))}
    </div>
  );
}
