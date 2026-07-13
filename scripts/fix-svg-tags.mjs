/**
 * SVG element names are case-sensitive in JSX/React. The HTML parser lowercases
 * them, so <linearGradient> became <lineargradient> etc., which React renders as
 * unknown elements — gradients, filters and clip paths silently stop working.
 */
import fs from 'node:fs';
import path from 'node:path';

const TAGS = [
  'linearGradient', 'radialGradient', 'clipPath', 'textPath', 'foreignObject',
  'feGaussianBlur', 'feComposite', 'feDropShadow', 'feBlend', 'feColorMatrix',
  'feOffset', 'feMerge', 'feMergeNode', 'feFlood', 'feImage', 'feTile',
  'feTurbulence', 'feDisplacementMap', 'feMorphology', 'feSpecularLighting',
  'feDiffuseLighting', 'fePointLight', 'feSpotLight', 'feDistantLight',
  'animateTransform', 'animateMotion',
];

let total = 0;
function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p);
    else if (e.name === 'page.jsx') {
      let s = fs.readFileSync(p, 'utf8');
      let n = 0;
      for (const tag of TAGS) {
        const lower = tag.toLowerCase();
        const open = new RegExp(`<${lower}(\\s|>|/>)`, 'g');
        const close = new RegExp(`</${lower}>`, 'g');
        s = s.replace(open, (_m, tail) => { n++; return `<${tag}${tail}`; });
        s = s.replace(close, () => { n++; return `</${tag}>`; });
      }
      if (n) {
        fs.writeFileSync(p, s);
        total += n;
        console.log(`  fixed ${n} SVG tag(s) in ${p}`);
      }
    }
  }
}
walk('app');
console.log(`total: ${total}`);
