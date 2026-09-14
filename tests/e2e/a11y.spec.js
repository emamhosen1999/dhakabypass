// tests/e2e/a11y.spec.js
//
// W5.17: an automated WCAG 2.1 AA check (axe-core) of the pages a road user
// relies on — the map, the toll tables and calculator, traffic status — in
// all three languages. Automated rules catch roughly a third of real
// barriers; the manual findings are recorded in the accessibility statement.
// A serious or critical violation fails the suite.
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const PAGES = [
  '/en', '/bn', '/zh',
  '/en/travel/toll', '/bn/travel/toll', '/zh/travel/toll',
  '/en/travel/map', '/en/travel/status', '/bn/travel/status',
  '/en/travel/route', '/en/travel/rules', '/en/contact', '/en/grievances', '/en/search?q=toll',
  '/en/faq', '/bn/faq', '/en/travel/advisories', '/en/travel/vehicle-classes', '/en/travel/payment',
  '/en/travel/toll-dispute', '/en/disclosures/right-to-information', '/zh/disclosures/citizen-charter',
  '/en/about/organisation', '/en/downloads', '/en/media', '/en/project/structures', '/bn/sitemap',
];

for (const path of PAGES) {
  test(`${path} has no serious or critical WCAG 2.1 AA violations`, async ({ page }) => {
    test.setTimeout(90_000);
    await page.goto(path, { waitUntil: 'networkidle' });
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();
    const serious = results.violations
      .filter((v) => v.impact === 'serious' || v.impact === 'critical')
      .map((v) => `${v.id} (${v.impact}): ${v.nodes.slice(0, 3).map((n) => n.target.join(' ')).join(' | ')}`);
    expect(serious, serious.join('\n')).toEqual([]);
  });
}
