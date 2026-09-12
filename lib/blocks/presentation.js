/**
 * Per-block presentation settings (W1.15).
 *
 * Stored in `blocks.settings` — the JSON column that existed since the schema
 * was written and carried nothing — and therefore shared by every language:
 * a band is dark on /bn if it is dark on /en. Content is per locale; how it
 * sits on the page is not.
 *
 * Every setting is an ENUM validated here, for the reason `media-prose.side`
 * became a select: free text the operator can misspell fails silently, and
 * "silent" is the failure this site is not allowed to have. An unknown value
 * is treated as the default, never as an error on a public page.
 *
 * Applied by BlockRenderer as classes on a wrapper around the block, so no
 * block component knows these exist and every one of the 41 gains them at
 * once. The CSS lives in app/design-tokens.css under "Block presentation".
 */

export const PRESENTATION = Object.freeze({
  tone: {
    label: 'Background',
    default: 'default',
    options: [
      { value: 'default', label: 'Page background' },
      { value: 'surface', label: 'Raised (white card on the page)' },
      { value: 'plate', label: 'Dark plate (DBEDC blue, light text)' },
      { value: 'accent', label: 'Accent band (orange rule on the left)' },
    ],
  },
  spacing: {
    label: 'Space above and below',
    default: 'normal',
    options: [
      { value: 'normal', label: 'Normal' },
      { value: 'tight', label: 'Tight (half)' },
      { value: 'loose', label: 'Loose (double)' },
      { value: 'none', label: 'None (touches its neighbours)' },
    ],
  },
  width: {
    label: 'Width',
    default: 'normal',
    options: [
      { value: 'normal', label: 'Normal (the page column)' },
      { value: 'narrow', label: 'Narrow (reading measure)' },
      { value: 'full', label: 'Full width (edge to edge)' },
    ],
  },
  align: {
    label: 'Text alignment',
    default: 'start',
    options: [
      { value: 'start', label: 'Left (right in right-to-left scripts)' },
      { value: 'center', label: 'Centred' },
    ],
  },
});

export const PRESENTATION_KEYS = Object.freeze(Object.keys(PRESENTATION));

const valueOk = (key, v) => PRESENTATION[key].options.some((o) => o.value === v);

/** The effective value of each setting: the stored one if valid, else the
 *  default. Never throws — a public page must render whatever is stored. */
export function presentationOf(settings) {
  const s = settings && typeof settings === 'object' ? settings : {};
  const out = {};
  for (const key of PRESENTATION_KEYS) {
    const v = s[key];
    out[key] = valueOk(key, v) ? v : PRESENTATION[key].default;
  }
  return out;
}

/** The wrapper's class list for a block, or '' when everything is default so
 *  a page that never used these renders exactly as before. */
export function presentationClasses(settings) {
  const p = presentationOf(settings);
  const cls = [];
  for (const key of PRESENTATION_KEYS) {
    if (p[key] !== PRESENTATION[key].default) cls.push(`db-p-${key}-${p[key]}`);
  }
  return cls.join(' ');
}

/**
 * Parse the editor's form into a settings object. Only known keys, only
 * known values; a bad value is reported by name so the operator can see
 * which control was wrong. Defaults are stored as absent, so a block that
 * was never styled stays `{}`.
 */
export function parsePresentationForm(formData) {
  const out = {};
  const errors = [];
  for (const key of PRESENTATION_KEYS) {
    const raw = formData.get(`p.${key}`);
    if (raw == null || raw === '') continue;
    const v = String(raw);
    if (!valueOk(key, v)) { errors.push(`"${PRESENTATION[key].label}" has a value that is not one of its options`); continue; }
    if (v !== PRESENTATION[key].default) out[key] = v;
  }
  return { ok: errors.length === 0, errors, settings: out };
}
