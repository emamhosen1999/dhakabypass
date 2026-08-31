/**
 * Moves the public pages under a (site) route group so the admin can have its
 * own chrome. Root layout becomes html/body only; (site)/layout.jsx carries the
 * public header/footer; /admin gets a separate guarded layout.
 *
 * Route groups add a real directory level, so relative imports gain one "../".
 */
import fs from 'node:fs';
import path from 'node:path';

const APP = 'app';
const SITE = path.join(APP, '(site)');

const PUBLIC_ROUTES = [
  'page.jsx',
  'project',
  'economic-impact',
  'routes-facilities',
  'stakeholders',
  'chinese-contribution',
  'latest-updates',
  'contact',
  'gallery',
];

fs.mkdirSync(SITE, { recursive: true });

for (const entry of PUBLIC_ROUTES) {
  const from = path.join(APP, entry);
  const to = path.join(SITE, entry);
  if (!fs.existsSync(from)) {
    console.log(`skip (missing): ${from}`);
    continue;
  }
  fs.renameSync(from, to);
  console.log(`moved ${from} -> ${to}`);
}

// Deepen relative imports by one level for everything now under (site)/
function fixImports(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) fixImports(p);
    else if (e.name.endsWith('.jsx') || e.name.endsWith('.js')) {
      let s = fs.readFileSync(p, 'utf8');
      const before = s;
      // ../../lib/content -> ../../../lib/content   (only ../ chains reaching out of app/)
      s = s.replace(/from '(\.\.\/)+(lib|components|content)\//g, (m, _u, seg) => {
        const ups = (m.match(/\.\.\//g) || []).length;
        return `from '${'../'.repeat(ups + 1)}${seg}/`;
      });
      if (s !== before) {
        fs.writeFileSync(p, s);
        console.log(`  imports fixed: ${p}`);
      }
    }
  }
}
fixImports(SITE);
console.log('\nDone.');
