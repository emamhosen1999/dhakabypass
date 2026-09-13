'use client';

import { useEffect, useState } from 'react';
import { THEME_KEY, THEMES, DEFAULT_THEME, normalizeTheme } from '../../lib/theme.js';

// English fallbacks for the admin, which has no locale; the public header
// passes ui_strings (themeLight/themeDark/themeSystem) so every locale reads
// its own words (audit 1.1).
const DEFAULT_LABELS = { light: 'Light', dark: 'Dark', system: 'System' };

export default function ThemeToggle({ label = 'Theme', labels = DEFAULT_LABELS }) {
  const [theme, setTheme] = useState(DEFAULT_THEME);

  useEffect(() => {
    setTheme(normalizeTheme(localStorage.getItem(THEME_KEY)));
  }, []);

  function choose(next) {
    const value = normalizeTheme(next);
    setTheme(value);
    localStorage.setItem(THEME_KEY, value);
    const root = document.documentElement;
    if (value === 'system') root.removeAttribute('data-theme');
    else root.setAttribute('data-theme', value);
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
