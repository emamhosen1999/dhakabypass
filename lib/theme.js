export const THEME_KEY = 'dbedc-theme';
export const THEMES = ['light', 'dark', 'system'];
export const DEFAULT_THEME = 'system';

export function normalizeTheme(value) {
  const v = String(value || '').toLowerCase();
  return THEMES.includes(v) ? v : DEFAULT_THEME;
}

/**
 * Runs before first paint so the page never flashes the wrong theme.
 * "system" deliberately removes the attribute, leaving prefers-color-scheme
 * in charge — that is the un-stamped state the CSS is written for.
 */
export function themeScriptSource() {
  return `(function(){try{var t=localStorage.getItem(${JSON.stringify(THEME_KEY)});` +
    `var r=document.documentElement;` +
    `if(t==="light"||t==="dark"){r.setAttribute("data-theme",t);}` +
    `else{r.removeAttribute("data-theme");}}catch(e){}})();`;
}
