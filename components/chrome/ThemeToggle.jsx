'use client';

import { useEffect, useState } from 'react';
import { THEME_KEY, THEMES, DEFAULT_THEME, normalizeTheme } from '../../lib/theme.js';

const LABELS = { light: 'Light', dark: 'Dark', system: 'System' };

export default function ThemeToggle({ label = 'Theme' }) {
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
          {LABELS[t]}
        </button>
      ))}
    </div>
  );
}
