// tests/e2e/legacy.spec.js
import { test, expect } from '@playwright/test';

// The live site must keep working untouched until cutover.
const LEGACY = ['/', '/project', '/economic-impact', '/stakeholders',
                '/chinese-contribution', '/routes-facilities', '/latest-updates',
                '/gallery', '/contact'];

for (const path of LEGACY) {
  test(`legacy ${path} still serves`, async ({ page }) => {
    const response = await page.goto(path);
    expect(response.status()).toBe(200);
  });
}
