/**
 * Brand tokens an operator may change (W1.16), and the rule that keeps a
 * change from making the site unreadable.
 *
 * app/design-tokens.css carries seventy-odd custom properties, each with a
 * measured contrast ratio in a comment beside it. Most of them are not for
 * an operator to touch: they are the relationships that make a status tag
 * legible on a table row. Three ARE the brand and are exposed here:
 *
 *   plateBg      the DBEDC blue — header, footer, dark bands
 *   plateAccent  the DBEDC orange on that blue — buttons, the live nav item
 *   shell        the page column's width in pixels
 *
 * A colour is only accepted if the text that sits on it still clears WCAG
 * AA: the plate's light text (#EDF2F5) on plateBg, and plateAccent on
 * plateBg, both at 4.5:1 or better — the same floor the stylesheet's own
 * measurements were taken against. The save is refused with the measured
 * ratio, so "a slightly lighter blue" is refused with a number, not a
 * shrug. Dark mode derives its plate by lifting the chosen blue with
 * color-mix, as the stylesheet does by hand for the default.
 *
 * Pure: no database, no Next. Read by the settings action (validation) and
 * by components/chrome/BrandTokens.jsx (the <style> tag).
 */

export const BRAND_KEYS = Object.freeze({
  plateBg: 'brand.plate_bg',
  plateAccent: 'brand.plate_accent',
  shell: 'brand.shell',
});

/** The shipped values, verbatim from app/design-tokens.css. */
export const BRAND_DEFAULTS = Object.freeze({
  plateBg: '#06263D',
  plateAccent: '#EF8221',
  shell: 1180,
});

const PLATE_FG = '#EDF2F5';
export const AA = 4.5;
export const SHELL_MIN = 960;
export const SHELL_MAX = 1600;

export const isHex = (v) => /^#[0-9a-fA-F]{6}$/.test(String(v || ''));

function luminance(hex) {
  const n = parseInt(hex.slice(1), 16);
  const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2];
}

/** WCAG contrast ratio between two #rrggbb colours, to two decimals. */
export function contrast(a, b) {
  const la = luminance(a);
  const lb = luminance(b);
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return Math.round(((hi + 0.05) / (lo + 0.05)) * 100) / 100;
}

/**
 * Validate a candidate set. Returns `{ ok, errors, value }` where `value`
 * is normalised (upper-case hex, integer shell) and blank fields mean "the
 * default" and are dropped, so a never-changed brand stays `{}`.
 */
export function validateBrand(input = {}) {
  const errors = [];
  const value = {};
  const bg = String(input.plateBg || '').trim();
  const accent = String(input.plateAccent || '').trim();
  const shellRaw = String(input.shell ?? '').trim();

  if (bg && !isHex(bg)) errors.push('The plate colour must be six hex digits, like #06263D.');
  if (accent && !isHex(accent)) errors.push('The accent colour must be six hex digits, like #EF8221.');

  const effBg = isHex(bg) ? bg.toUpperCase() : BRAND_DEFAULTS.plateBg;
  const effAccent = isHex(accent) ? accent.toUpperCase() : BRAND_DEFAULTS.plateAccent;
  if (errors.length === 0) {
    const fgRatio = contrast(PLATE_FG, effBg);
    if (fgRatio < AA) errors.push(`Light text on ${effBg} measures ${fgRatio}:1; it must reach ${AA}:1. Choose a darker plate.`);
    const accentRatio = contrast(effAccent, effBg);
    if (accentRatio < AA) errors.push(`${effAccent} on ${effBg} measures ${accentRatio}:1; it must reach ${AA}:1. Choose a brighter accent or a darker plate.`);
  }

  if (shellRaw) {
    const n = Number(shellRaw);
    if (!Number.isInteger(n) || n < SHELL_MIN || n > SHELL_MAX) {
      errors.push(`The page width must be a whole number of pixels between ${SHELL_MIN} and ${SHELL_MAX}.`);
    } else if (n !== BRAND_DEFAULTS.shell) {
      value.shell = n;
    }
  }
  if (isHex(bg) && effBg !== BRAND_DEFAULTS.plateBg) value.plateBg = effBg;
  if (isHex(accent) && effAccent !== BRAND_DEFAULTS.plateAccent) value.plateAccent = effAccent;

  return { ok: errors.length === 0, errors, value };
}

/**
 * The stylesheet override for a stored brand, or '' when nothing differs
 * from the shipped tokens. Only the properties that changed are written, so
 * the measured relationships of everything else stand.
 */
export function brandCss(stored = {}) {
  const light = [];
  const dark = [];
  const bg = isHex(stored.plateBg) ? stored.plateBg : '';
  const accent = isHex(stored.plateAccent) ? stored.plateAccent : '';
  const shell = Number.isInteger(stored.shell) ? stored.shell : 0;
  if (bg && bg.toUpperCase() !== BRAND_DEFAULTS.plateBg) {
    light.push(`--db-plate-bg:${bg}`);
    // The stylesheet lifts the plate in dark mode by hand (#06263D -> #0C3656)
    // so a dark card can sit on it; the same lift, derived.
    dark.push(`--db-plate-bg:color-mix(in srgb,${bg} 86%,#FFFFFF)`);
  }
  if (accent && accent.toUpperCase() !== BRAND_DEFAULTS.plateAccent) light.push(`--db-plate-accent:${accent}`);
  if (shell && shell !== BRAND_DEFAULTS.shell) light.push(`--db-shell:${shell}px`);
  if (light.length === 0) return '';
  let css = `:root{${light.join(';')}}`;
  if (dark.length) {
    css += `@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){${dark.join(';')}}}`;
    css += `:root[data-theme="dark"]{${dark.join(';')}}`;
  }
  return css;
}
