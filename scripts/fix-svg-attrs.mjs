/** One-off: fix SVG camelCase attributes that the first converter run lowercased. */
import fs from 'node:fs';
import path from 'node:path';

const MAP = {
  stddeviation: 'stdDeviation',
  preserveaspectratio: 'preserveAspectRatio',
  gradientunits: 'gradientUnits',
  gradienttransform: 'gradientTransform',
  patternunits: 'patternUnits',
  clippath: 'clipPath',
  markerwidth: 'markerWidth',
  markerheight: 'markerHeight',
  stopcolor: 'stopColor',
  stopopacity: 'stopOpacity',
  textanchor: 'textAnchor',
  filterunits: 'filterUnits',
  numoctaves: 'numOctaves',
  basefrequency: 'baseFrequency',
  spreadmethod: 'spreadMethod',
  floodcolor: 'floodColor',
  floodopacity: 'floodOpacity',
};

let total = 0;
function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p);
    else if (e.name === 'page.jsx') {
      let s = fs.readFileSync(p, 'utf8');
      let n = 0;
      for (const [k, v] of Object.entries(MAP)) {
        const re = new RegExp(`(\\s)${k}=`, 'g');
        s = s.replace(re, (_m, sp) => {
          n++;
          return `${sp}${v}=`;
        });
      }
      if (n) {
        fs.writeFileSync(p, s);
        total += n;
        console.log(`  fixed ${n} attr(s) in ${p}`);
      }
    }
  }
}
walk('app');
console.log(`total: ${total}`);
