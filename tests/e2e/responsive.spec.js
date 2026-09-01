// tests/e2e/responsive.spec.js
import { test, expect } from '@playwright/test';

// 320 is the narrowest phone still in real use; 2560 is a desktop monitor.
const VIEWPORTS = [
  { name: 'phone-320', width: 320, height: 640 },
  { name: 'phone-375', width: 375, height: 812 },
  { name: 'tablet-768', width: 768, height: 1024 },
  { name: 'tablet-1024', width: 1024, height: 768 },
  { name: 'laptop-1280', width: 1280, height: 800 },
  { name: 'desktop-2560', width: 2560, height: 1440 },
];

for (const vp of VIEWPORTS) {
  test(`no horizontal overflow at ${vp.name}`, async ({ page }) => {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await page.goto('/en');

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth
    );
    expect(overflow, `page scrolls sideways by ${overflow}px`).toBeLessThanOrEqual(1);
  });

  test(`primary navigation is reachable at ${vp.name}`, async ({ page }) => {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await page.goto('/en');

    // Either the full nav or the compact row must be visible — never neither.
    const full = page.getByRole('navigation', { name: 'Primary' });
    const compact = page.getByRole('navigation', { name: 'Primary, compact' });
    const visible = (await full.isVisible()) || (await compact.isVisible());
    expect(visible, 'no navigation visible at this width').toBe(true);
  });
}

test('zooming is not disabled', async ({ page }) => {
  await page.goto('/en');
  const content = await page.locator('meta[name="viewport"]').getAttribute('content');
  expect(content).not.toMatch(/user-scalable\s*=\s*no/);
  expect(content).not.toMatch(/maximum-scale\s*=\s*1\b/);
});

test('touch targets meet the 44px minimum', async ({ browser }) => {
  // A coarse pointer is what triggers the min-height rule.
  const context = await browser.newContext({
    viewport: { width: 375, height: 812 },
    hasTouch: true,
    isMobile: true,
  });
  const page = await context.newPage();
  await page.goto('/en');

  const links = page.locator('.db-nav-mobile a');
  const count = await links.count();
  expect(count).toBeGreaterThan(0);
  for (let i = 0; i < count; i += 1) {
    const box = await links.nth(i).boundingBox();
    expect(box.height, `nav link ${i} is only ${box.height}px tall`).toBeGreaterThanOrEqual(44);
  }
  await context.close();
});
