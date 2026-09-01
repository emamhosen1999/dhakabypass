// tests/e2e/theme.spec.js
import { test, expect } from '@playwright/test';

test('theme choice applies and survives a reload', async ({ page }) => {
  await page.goto('/en');
  const root = page.locator('html');

  // System is the default and must leave the attribute off.
  await expect(root).not.toHaveAttribute('data-theme', /.*/);

  await page.getByRole('button', { name: 'Dark' }).click();
  await expect(root).toHaveAttribute('data-theme', 'dark');

  await page.reload();
  await expect(root).toHaveAttribute('data-theme', 'dark');

  await page.getByRole('button', { name: 'System' }).click();
  await expect(root).not.toHaveAttribute('data-theme', /.*/);
});

test('the page never flashes the wrong theme', async ({ page }) => {
  await page.goto('/en');
  await page.getByRole('button', { name: 'Dark' }).click();

  // 'domcontentloaded' fires once the document has been fully parsed, which
  // is also the point at which a blocking inline <script> (ThemeScript,
  // with no defer/async) has already run — so the attribute must be present
  // by here if it was stamped before paint, not merely "eventually".
  await page.reload({ waitUntil: 'domcontentloaded' });

  // A single, non-retrying read. `toHaveAttribute` auto-retries for up to
  // 5s by default, which would let a regressed ThemeScript (e.g. moved into
  // a useEffect / hydration-driven client component — the exact flash this
  // test exists to catch) still pass, since 5s is easily enough time for
  // hydration to run. Reading the value directly and comparing it exactly
  // has no such grace period.
  const themeAttr = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
  expect(themeAttr).toBe('dark');
});

test('the theme script ships inline in the served HTML, ahead of visible content', async ({ page }) => {
  // Pin the mechanism structurally, independent of timing: the script that
  // stamps data-theme must be present in the raw server response (not
  // injected later by hydration) and must appear before the header markup
  // it is meant to run ahead of. (It is a child of `.db-root`, so it
  // necessarily comes after `.db-root`'s own opening tag — the claim being
  // pinned here is "ahead of the visible chrome", not "ahead of its own
  // parent element".)
  const html = await (await page.request.get('/en')).text();
  const scriptIndex = html.indexOf('localStorage.getItem("dbedc-theme")');
  const headerIndex = html.indexOf('db-header');

  expect(scriptIndex, 'inline theme script not found in served HTML').toBeGreaterThan(-1);
  expect(headerIndex, 'header markup not found in served HTML').toBeGreaterThan(-1);
  expect(scriptIndex, 'theme script does not precede the header markup').toBeLessThan(headerIndex);
});
