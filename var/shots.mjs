/**
 * Local visual check of the new trilingual site plus the untouched legacy site.
 * Writes PNGs to var/shots/. Not part of the test suite — a manual eyeball aid.
 *   node var/shots.mjs
 */
import { chromium } from '@playwright/test';
import fs from 'node:fs';

const OUT = 'var/shots';
fs.mkdirSync(OUT, { recursive: true });

const BASE = 'http://localhost:3000';

const SHOTS = [
  // New site — the three locales, desktop
  { name: '01-en-desktop', url: '/en', vp: { width: 1280, height: 900 } },
  { name: '02-bn-desktop', url: '/bn', vp: { width: 1280, height: 900 } },
  { name: '03-zh-desktop', url: '/zh', vp: { width: 1280, height: 900 } },
  // Dark theme
  { name: '04-en-dark', url: '/en', vp: { width: 1280, height: 900 }, theme: 'dark' },
  // Narrow phone — the compact nav row and fluid layout
  { name: '05-en-phone-320', url: '/en', vp: { width: 320, height: 700 } },
  { name: '06-bn-phone-375', url: '/bn', vp: { width: 375, height: 800 } },
  // Legacy site — must be completely unchanged
  { name: '07-legacy-home', url: '/', vp: { width: 1280, height: 900 } },
  { name: '08-legacy-project', url: '/project', vp: { width: 1280, height: 900 } },
  // Admin — should bounce to the login screen, proving the gate works
  { name: '09-admin-pages-v2', url: '/admin/pages-v2', vp: { width: 1280, height: 900 } },
];

const browser = await chromium.launch();
const results = [];

for (const shot of SHOTS) {
  const context = await browser.newContext({ viewport: shot.vp });
  const page = await context.newPage();

  const errors = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  page.on('pageerror', (e) => errors.push(String(e)));

  if (shot.theme) {
    await context.addInitScript(
      ([k, v]) => window.localStorage.setItem(k, v),
      ['dbedc-theme', shot.theme]
    );
  }

  let status = 'ERR';
  try {
    const res = await page.goto(BASE + shot.url, { waitUntil: 'networkidle', timeout: 30000 });
    status = res ? res.status() : 'no-response';
  } catch (err) {
    errors.push(String(err.message));
  }

  await page.screenshot({ path: `${OUT}/${shot.name}.png`, fullPage: true });
  results.push({
    name: shot.name,
    url: shot.url,
    status,
    finalUrl: new URL(page.url()).pathname,
    errors: errors.length,
    firstError: errors[0] ? errors[0].slice(0, 120) : '',
  });
  await context.close();
}

await browser.close();

console.log('\n name                 requested        status  final            errs  first error');
console.log('-'.repeat(100));
for (const r of results) {
  console.log(
    ` ${r.name.padEnd(20)} ${r.url.padEnd(16)} ${String(r.status).padEnd(7)} ${r.finalUrl.padEnd(16)} ${String(r.errors).padEnd(5)} ${r.firstError}`
  );
}
console.log(`\n${results.length} screenshots in ${OUT}/`);
