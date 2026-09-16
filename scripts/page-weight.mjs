#!/usr/bin/env node
/**
 * The page-weight budget (W8.7, UI-PERF-01/02).
 *
 * A performance rule that is only ever measured by hand is a rule that holds
 * until the week nobody measures. This runs in CI straight after `npm run
 * build` and fails the build when the chrome, the styles or the fonts grow
 * past what a reader on a 3G phone in Gazipur can afford.
 *
 * WHAT IT MEASURES, and why each number is the one that matters:
 *
 *   JS  — the gzipped bytes of the shared first-load bundle, the files EVERY
 *         page loads before it can be interactive. Route chunks are reported
 *         per route but budgeted together with it, because the shared bundle
 *         is what a first visit pays for whichever page it lands on.
 *   CSS — the gzipped compiled stylesheet. One file serves the whole site, so
 *         it is a fixed cost on the first view and free afterwards.
 *   FONTS — the faces a first view can actually fetch. A @font-face WITH a
 *         unicode-range is only fetched when the page contains a character in
 *         that range, so an English page pays nothing for the Bangla or the
 *         Chinese faces. Faces with NO unicode-range are unconditional, and
 *         those are what this budget counts. This is also the check that keeps
 *         "/en loads no Bangla font" true: a Bangla face that loses its
 *         unicode-range becomes an unconditional 71 kB on every English page,
 *         and that is exactly the regression nobody notices by eye.
 *
 * Budgets live in scripts/page-weight.budget.json so raising one is a visible,
 * reviewable line in a diff rather than an edit buried in this file.
 *
 * Usage: node scripts/page-weight.mjs [--json] [--update]
 *   --update rewrites the budget file to the measured sizes. Use it when a
 *   deliberate change makes the old numbers meaningless, never to make a red
 *   build green.
 */
import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const next = path.join(root, '.next');
const budgetFile = path.join(root, 'scripts/page-weight.budget.json');
const args = new Set(process.argv.slice(2));

const kb = (bytes) => Math.round((bytes / 1024) * 10) / 10;
const gzipOf = (file) => (existsSync(file) ? gzipSync(readFileSync(file)).length : 0);

function fail(message) {
  console.error(`page-weight: ${message}`);
  process.exit(1);
}

if (!existsSync(path.join(next, 'build-manifest.json'))) {
  fail('no build found. Run `npm run build` first.');
}

/* ---- JavaScript: the shared first-load bundle ---------------------------- */
const buildManifest = JSON.parse(readFileSync(path.join(next, 'build-manifest.json'), 'utf8'));
const appManifest = existsSync(path.join(next, 'app-build-manifest.json'))
  ? JSON.parse(readFileSync(path.join(next, 'app-build-manifest.json'), 'utf8'))
  : { pages: {} };

const asset = (p) => path.join(next, p.startsWith('static/') ? p : p);
const sizeOf = (files) => [...new Set(files)].reduce((n, f) => n + gzipOf(asset(f)), 0);

const shared = [...(buildManifest.rootMainFiles || []), ...(buildManifest.polyfillFiles || [])];
const sharedBytes = sizeOf(shared);

// The public shell: the layout every reader loads, plus the two routes that
// serve every public page (every corridor, toll and travel page is the
// catch-all block route, so a heavy block lands in its number).
const ROUTES = [
  '/[locale]/layout',
  '/[locale]/[[...slug]]/page',
  '/[locale]/news/[slug]/page',
];
const routeBytes = {};
for (const route of ROUTES) {
  const files = appManifest.pages?.[route] || [];
  routeBytes[route] = sizeOf(files.filter((f) => !shared.includes(f)));
}

/* ---- CSS ----------------------------------------------------------------- */
const cssDir = path.join(next, 'static/css');
const cssBytes = existsSync(cssDir)
  ? readdirSync(cssDir).filter((f) => f.endsWith('.css')).reduce((n, f) => n + gzipOf(path.join(cssDir, f)), 0)
  : 0;

/* ---- Fonts --------------------------------------------------------------- */
// Every @font-face the site declares, from the source stylesheets: the
// compiled CSS is minified but the declarations survive, and the source is
// what a reviewer reads.
const faceSources = [
  path.join(root, 'app/design-tokens.css'),
  path.join(root, 'public/fonts/noto-sans-sc.css'),
];
const faces = [];
for (const file of faceSources) {
  if (!existsSync(file)) continue;
  const css = readFileSync(file, 'utf8');
  for (const block of css.match(/@font-face\s*{[^}]*}/g) || []) {
    const url = block.match(/url\(['"]?([^'")]+)['"]?\)/)?.[1] || '';
    faces.push({
      file: path.basename(file),
      family: block.match(/font-family:\s*['"]?([^;'"]+)/)?.[1]?.trim() || '?',
      url,
      conditional: /unicode-range:/.test(block),
      bytes: url.startsWith('/') && existsSync(path.join(root, 'public', url)) ? statSync(path.join(root, 'public', url)).size : 0,
    });
  }
}
const unconditional = faces.filter((f) => !f.conditional);
const fontBytes = unconditional.reduce((n, f) => n + f.bytes, 0);

// Faces that must never become unconditional, by the script they carry.
const NON_LATIN = /HindSiliguri|Bengali|NotoSansSC|noto-sans-sc/i;
const leaked = unconditional.filter((f) => NON_LATIN.test(f.url) || NON_LATIN.test(f.family));

/* ---- Compare ------------------------------------------------------------- */
const measured = {
  sharedJsGzipKb: kb(sharedBytes),
  routeJsGzipKb: Object.fromEntries(Object.entries(routeBytes).map(([k, v]) => [k, kb(v)])),
  cssGzipKb: kb(cssBytes),
  unconditionalFontsKb: kb(fontBytes),
};

if (args.has('--json')) console.log(JSON.stringify(measured, null, 2));

if (args.has('--update')) {
  const budget = JSON.parse(readFileSync(budgetFile, 'utf8'));
  budget.budgets = {
    sharedJsGzipKb: Math.ceil(measured.sharedJsGzipKb * 1.1),
    cssGzipKb: Math.ceil(measured.cssGzipKb * 1.1),
    unconditionalFontsKb: Math.ceil(measured.unconditionalFontsKb * 1.1),
    routeJsGzipKb: Object.fromEntries(Object.entries(measured.routeJsGzipKb).map(([k, v]) => [k, Math.ceil(v * 1.1)])),
  };
  writeFileSync(budgetFile, `${JSON.stringify(budget, null, 2)}\n`);
  console.log('page-weight: budgets rewritten to the measured sizes + 10%.');
  process.exit(0);
}

const { budgets } = JSON.parse(readFileSync(budgetFile, 'utf8'));
const rows = [
  ['shared first-load JS', measured.sharedJsGzipKb, budgets.sharedJsGzipKb],
  ['compiled CSS', measured.cssGzipKb, budgets.cssGzipKb],
  ['fonts fetched by every page', measured.unconditionalFontsKb, budgets.unconditionalFontsKb],
  ...Object.entries(measured.routeJsGzipKb).map(([route, v]) => [`route JS ${route}`, v, budgets.routeJsGzipKb?.[route] ?? Infinity]),
];

const over = rows.filter(([, value, limit]) => value > limit);
const width = Math.max(...rows.map(([label]) => label.length));
console.log('\n  page weight (gzipped)\n');
for (const [label, value, limit] of rows) {
  const mark = value > limit ? 'x' : 'ok';
  console.log(`  ${mark.padEnd(3)}${label.padEnd(width + 2)}${String(value).padStart(7)} kB   budget ${limit} kB`);
}
console.log('');

for (const face of leaked) {
  console.error(`  x  ${face.family} (${face.url}) has no unicode-range, so every page in every language now downloads it.`);
}

if (over.length || leaked.length) {
  fail(`${over.length + leaked.length} budget${over.length + leaked.length === 1 ? '' : 's'} exceeded. `
    + 'Reduce the weight, or change the budget in scripts/page-weight.budget.json in the same commit, with the reason in the message.');
}
console.log('  page-weight: within budget.\n');
