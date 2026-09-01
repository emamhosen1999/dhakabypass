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
  await page.reload({ waitUntil: 'commit' });
  // Stamped before first paint by ThemeScript.
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
});
