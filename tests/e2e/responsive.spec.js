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

    // exact: true — an unqualified 'Primary' also substring-matches the
    // compact nav's "Primary, compact" accessible name.
    const full = page.getByRole('navigation', { name: 'Primary', exact: true });
    const compact = page.getByRole('navigation', { name: 'Primary, compact' });
    const fullVisible = await full.isVisible();
    const compactVisible = await compact.isVisible();

    // Either the full nav or the compact row must be visible — never neither.
    expect(fullVisible || compactVisible, 'no navigation visible at this width').toBe(true);
    // ...and never both — a CSS breakpoint regression showing both at once
    // would otherwise go undetected by the "at least one" check above.
    expect(fullVisible && compactVisible, 'both navigations visible at this width').toBe(false);
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

  // The 44px rule in design-tokens.css applies to every
  // `a, button, [role=button], summary` under .db-root, not just nav links —
  // the header's theme and locale controls are equally touch targets.
  const targets = [
    { label: 'nav link', locator: page.locator('.db-nav-mobile a') },
    { label: 'theme button', locator: page.locator('.db-theme-btn') },
    { label: 'locale link', locator: page.locator('.db-locale-btn') },
  ];

  for (const { label, locator } of targets) {
    const count = await locator.count();
    expect(count, `no ${label} elements found`).toBeGreaterThan(0);
    for (let i = 0; i < count; i += 1) {
      const box = await locator.nth(i).boundingBox();
      expect(box.height, `${label} ${i} is only ${box.height}px tall`).toBeGreaterThanOrEqual(44);
    }
  }
  await context.close();
});
