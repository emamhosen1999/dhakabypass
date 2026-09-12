import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { BRAND_DEFAULTS, contrast, validateBrand, brandCss, AA } from '../../lib/brand/tokens.js';

const root = path.resolve(import.meta.dirname, '../..');

describe('brand tokens (W1.16)', () => {
  it('ships the values app/design-tokens.css actually carries', () => {
    const css = fs.readFileSync(path.join(root, 'app/design-tokens.css'), 'utf8');
    expect(css).toMatch(new RegExp(`--db-plate-bg:${BRAND_DEFAULTS.plateBg};`));
    expect(css).toMatch(new RegExp(`--db-plate-accent:${BRAND_DEFAULTS.plateAccent};`));
    expect(css).toMatch(new RegExp(`--db-shell:${BRAND_DEFAULTS.shell}px;`));
  });

  it('measures contrast the way the stylesheet comments do', () => {
    // The stylesheet records --db-plate-accent on --db-plate-bg as 5.83:1.
    expect(contrast('#EF8221', '#06263D')).toBe(5.83);
    expect(contrast('#000000', '#FFFFFF')).toBe(21);
  });

  it('accepts the shipped brand as "nothing changed"', () => {
    const r = validateBrand({ plateBg: '#06263d', plateAccent: '#ef8221', shell: '1180' });
    expect(r).toEqual({ ok: true, errors: [], value: {} });
    expect(brandCss({})).toBe('');
  });

  it('refuses a plate that leaves the light text or the accent under AA, with the ratio', () => {
    const pale = validateBrand({ plateBg: '#9FB4C4' });
    expect(pale.ok).toBe(false);
    expect(pale.errors[0]).toMatch(/measures \d+(\.\d+)?:1; it must reach 4\.5:1/);
    const dimAccent = validateBrand({ plateAccent: '#5A3A10' });
    expect(dimAccent.ok).toBe(false);
    expect(dimAccent.errors[0]).toMatch(/#5A3A10 on #06263D measures/);
  });

  it('refuses malformed hex and an out-of-range width', () => {
    expect(validateBrand({ plateBg: 'blue' }).errors[0]).toMatch(/six hex digits/);
    expect(validateBrand({ shell: '400' }).errors[0]).toMatch(/between 960 and 1600/);
    expect(validateBrand({ shell: '12.5' }).ok).toBe(false);
  });

  it('writes only what changed, in both themes for the plate', () => {
    const css = brandCss({ plateBg: '#0B2E4A', shell: 1280 });
    expect(css).toContain(':root{--db-plate-bg:#0B2E4A;--db-shell:1280px}');
    expect(css).toContain('@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){--db-plate-bg:color-mix(in srgb,#0B2E4A 86%,#FFFFFF)}}');
    expect(css).toContain(':root[data-theme="dark"]{--db-plate-bg:color-mix(in srgb,#0B2E4A 86%,#FFFFFF)}');
    expect(css).not.toContain('--db-plate-accent');
    expect(AA).toBe(4.5);
  });

  it('never emits a value it did not validate', () => {
    expect(brandCss({ plateBg: 'url(evil)', plateAccent: '#EF8221; } body{display:none', shell: '99999' })).toBe('');
  });
});
