// tests/e2e/locales.spec.js
import { test, expect } from '@playwright/test';

const LOCALES = [
  { code: 'en', lang: 'en', nav: 'Travel Info' },
  { code: 'bn', lang: 'bn', nav: 'ভ্রমণ তথ্য' },
  { code: 'zh', lang: 'zh-Hans', nav: '出行信息' },
];

for (const l of LOCALES) {
  test(`/${l.code} renders with no console errors`, async ({ page }) => {
    const errors = [];
    page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));

    const response = await page.goto(`/${l.code}`);
    expect(response.status()).toBe(200);

    await expect(page.locator('.db-root')).toHaveAttribute('lang', l.lang);
    // exact: true — Playwright's accessible-name matcher is substring by
    // default, so an unqualified 'Primary' also matches the compact nav's
    // "Primary, compact" label. Without `exact`, this only happened to
    // resolve to one element because the hidden nav was display:none (and
    // therefore out of the a11y tree) at the moment of the query.
    await expect(page.getByRole('navigation', { name: 'Primary', exact: true })).toContainText(l.nav);
    expect(errors).toEqual([]);
  });
}

test('an unknown locale is a 404', async ({ page }) => {
  const response = await page.goto('/fr');
  expect(response.status()).toBe(404);
});

test('the locale switch keeps you on the same page', async ({ page }) => {
  await page.goto('/en');
  await page.getByRole('navigation', { name: /Language|ভাষা|语言/ }).getByText('বাংলা').click();
  await expect(page).toHaveURL(/\/bn$/);
});
