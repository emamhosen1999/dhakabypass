// scripts/fetch-fonts.mjs
/**
 * Downloads the self-hosted Latin and Bengali faces into public/fonts.
 * Run ONCE by a developer; the .woff2 files are committed. The site never
 * touches a font CDN at runtime.
 *   node scripts/fetch-fonts.mjs
 */
import fs from 'node:fs';
import path from 'node:path';

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
const OUT = path.resolve('public/fonts');
fs.mkdirSync(OUT, { recursive: true });

const FAMILIES = [
  'Barlow+Semi+Condensed:wght@600;700',
  'Archivo:wght@400..700',
  'Noto+Sans+Bengali:wght@400;600;700',
];

const css = await (await fetch(
  `https://fonts.googleapis.com/css2?${FAMILIES.map((f) => `family=${f}`).join('&')}&display=swap`,
  { headers: { 'User-Agent': UA } }
)).text();

// Keep only the latin and bengali subsets; the rest are dead weight here.
const wanted = /\/\*\s*(latin|bengali)\s*\*\/\s*@font-face\s*\{(.*?)\}/gs;
const faces = [];
let m, n = 0;
while ((m = wanted.exec(css))) {
  const block = m[2];
  const family = /font-family: '([^']+)'/.exec(block)[1].replace(/\s+/g, '');
  const weight = /font-weight: ([\d ]+)/.exec(block)[1].trim().replace(/\s+/g, '-');
  const url = /url\((https[^)]+)\)/.exec(block)[1];
  // Each subset (latin, bengali, ...) covers a distinct codepoint range. Without
  // this descriptor every @font-face defaults to covering the whole codepoint
  // space, and the cascade picks whichever rule was declared last — silently
  // dropping every other subset at that weight, no matter which family it is.
  const unicodeRangeMatch = /unicode-range: ([^;]+);/.exec(block);
  const unicodeRange = unicodeRangeMatch ? unicodeRangeMatch[1].trim() : null;
  const file = path.join(OUT, `${family}-${m[1]}-${weight}.woff2`);
  const buf = Buffer.from(await (await fetch(url, { headers: { 'User-Agent': UA } })).arrayBuffer());
  fs.writeFileSync(file, buf);
  console.log(`${path.basename(file)}  ${(buf.length / 1024).toFixed(1)} KB`);
  faces.push(
    `@font-face{font-family:'${family}';font-style:normal;font-weight:${/font-weight: ([\d ]+)/.exec(block)[1].trim()};` +
    `font-display:swap;src:url('/fonts/${path.basename(file)}') format('woff2');` +
    (unicodeRange ? `unicode-range:${unicodeRange};` : '') +
    `}`
  );
  n += 1;
}
console.log(`\n${n} font files written to public/fonts`);
console.log('\n--- paste these @font-face blocks into app/design-tokens.css verbatim ---\n');
console.log(faces.join('\n'));
