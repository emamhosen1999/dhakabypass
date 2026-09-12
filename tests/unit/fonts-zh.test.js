import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '../..');
const read = (f) => fs.readFileSync(path.join(root, f), 'utf8');

/**
 * W1.28 — Chinese typography. Noto Sans SC is self-hosted as Google's
 * unicode-range slices; the sheet is linked only under lang=zh. These pin
 * that every slice the sheet names is on disk (a missing slice is a silent
 * fallback to the platform font for that range) and that no other locale
 * loads the sheet.
 */
describe('Noto Sans SC', () => {
  const css = read('public/fonts/noto-sans-sc.css');
  const faces = [...css.matchAll(/@font-face\{[^}]*\}/g)].map((m) => m[0]);

  it('declares two weights sliced by unicode-range, every slice present', () => {
    expect(faces.length).toBe(202);
    const weights = new Set(faces.map((f) => f.match(/font-weight:(\d+)/)[1]));
    expect([...weights].sort()).toEqual(['400', '700']);
    for (const f of faces) {
      expect(f).toMatch(/unicode-range:U\+/);
      expect(f).toMatch(/font-display:swap/);
      const file = f.match(/url\(\/fonts\/noto-sans-sc\/([^)]+)\)/)[1];
      expect(fs.existsSync(path.join(root, 'public/fonts/noto-sans-sc', file)), file).toBe(true);
    }
    expect(css).not.toMatch(/https?:\/\//); // self-hosted: the CSP allows no font CDN
  });

  it('is linked only for the Chinese locale, and leads the zh font stack', () => {
    const layout = read('app/[locale]/layout.jsx');
    expect(layout).toMatch(/locale === 'zh' \? <link rel="stylesheet" href="\/fonts\/noto-sans-sc\.css"/);
    const tokens = read('app/design-tokens.css');
    expect(tokens).toMatch(/--db-font-zh:'Noto Sans SC'/);
    // Display runs on zh pages must name a CJK face after the Latin one.
    expect(tokens).toMatch(/\.db-root:lang\(zh\) \.db-h1[^{]*\{\s*font-family:'BarlowSemiCondensed','Noto Sans SC'/);
  });
});
