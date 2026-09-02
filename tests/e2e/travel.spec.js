// tests/e2e/travel.spec.js
//
// Regression net for the Travel Info section (P2+P3). The seed data behind
// these assertions is the client's real surveyed corridor (Task 13b), not
// the fictional placeholder the section was originally built against:
//
//   - corridor spans 0 -> 47611 m (20 points: 8 interchange, 9 toll_plaza,
//     3 bridge)
//   - segments: 0-3218 construction, 3218-21218 open (18000 m exactly),
//     21218-47611 construction
//   - 9 toll classes, class_order ascending == amount ascending, 150..740
//     BDT, every row's section is 'Vogra – K21+218 (open section)'
//   - prohibited vehicles: motorcycles, three-wheelers (rendered on /toll
//     and /rules)
//   - corridor.illustrative = true, so IllustrativeNotice renders everywhere
//   - no interchange has kind = 'service_area', so /facilities is empty
//
// Where a figure is still provisional (segment status, percentOpen) the
// assertions below check it against other rendered data or basic bounds
// instead of a hard-coded number. Where a figure is client-confirmed (toll
// amounts, point names, the prohibition) it is asserted directly.
import { test, expect } from '@playwright/test';
import { t } from '../../lib/i18n/ui.js';
import { LOCALES } from '../../lib/i18n/locales.js';

const PAGES = ['/travel/status', '/travel/toll', '/travel/route', '/travel/facilities', '/travel/rules'];
const PAGE_TITLE_KEY = {
  '/travel/status': 'travelStatus',
  '/travel/toll': 'travelToll',
  '/travel/route': 'travelRoute',
  '/travel/facilities': 'travelFacilities',
  '/travel/rules': 'travelRules',
};
// Exact string from scripts/seed-corridor.mjs's OPEN_SECTION_LABEL.
const TOLL_SECTION = 'Vogra – K21+218 (open section)';
const PROHIBITED_EN = ['Motorcycles', 'Three-wheelers (CNG and auto-rickshaw)'];

for (const locale of LOCALES) {
  for (const path of PAGES) {
    test(`/${locale}${path} renders with no console errors`, async ({ page }) => {
      const errors = [];
      page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
      page.on('pageerror', (e) => errors.push(String(e)));

      const res = await page.goto(`/${locale}${path}`);
      expect(res.status()).toBe(200);

      const h1 = page.locator('h1');
      await expect(h1).toBeVisible();
      // Compare against the same t() the page itself calls, so a wrong key
      // or a broken import (rendering nothing, or the raw key string) fails
      // this instead of the vaguer "h1 is visible" check alone.
      await expect(h1).toHaveText(t(locale, PAGE_TITLE_KEY[path]));

      expect(errors).toEqual([]);
    });
  }
}

test('/travel issues a genuine HTTP redirect to the status page', async ({ request }) => {
  // A 200 response that merely ends up on the right URL (e.g. a client-side
  // redirect, or the wrong page happening to reuse the same layout) would
  // pass a status-only or URL-only check. Assert the actual redirect
  // mechanism: a 3xx with a Location header, not just where you land.
  const res = await request.get('/en/travel', { maxRedirects: 0 });
  expect([301, 302, 307, 308]).toContain(res.status());
  expect(res.headers()['location']).toMatch(/\/en\/travel\/status$/);
});

test('/travel redirects to the status page in the browser', async ({ page }) => {
  const res = await page.goto('/en/travel');
  expect(res.status()).toBe(200);
  await expect(page).toHaveURL(/\/en\/travel\/status$/);
  await expect(page.locator('h1')).toHaveText(t('en', 'travelStatus'));
});

test('the toll table shows all nine confirmed classes, cheapest first, with a taka amount and section on every row', async ({ page }) => {
  await page.goto('/en/travel/toll');
  const rows = page.locator('table.db-table tbody tr');
  await expect(rows.first()).toBeVisible();

  const count = await rows.count();
  // Nine real toll classes are seeded — a table with more or fewer rows is
  // a defect, not a "greater than zero" pass.
  expect(count).toBe(9);

  const amounts = [];
  for (let i = 0; i < count; i += 1) {
    const row = rows.nth(i);

    const amountCell = row.locator('.db-toll-amount');
    await expect(amountCell).toContainText('৳');
    const raw = await amountCell.innerText();
    amounts.push(Number(raw.replace(/[^\d.]/g, '')));

    // Every row prices the same open section — a blank or wrong section
    // here is worse than a missing table.
    await expect(row.locator('td').first()).toHaveText(TOLL_SECTION);
  }

  expect(amounts[0]).toBe(150);
  expect(amounts[amounts.length - 1]).toBe(740);
  for (let i = 1; i < amounts.length; i += 1) {
    expect(amounts[i], `row ${i} (${amounts[i]}) is not strictly more than row ${i - 1} (${amounts[i - 1]})`)
      .toBeGreaterThan(amounts[i - 1]);
  }
});

test('provisional data is labelled on every Travel Info page', async ({ page }) => {
  // corridor.illustrative = true is seeded, so the notice must appear on
  // every corridor-backed page, not only the toll page.
  for (const path of PAGES) {
    await page.goto(`/en${path}`);
    await expect(page.getByRole('note'), `no provisional notice on ${path}`).toBeVisible();
  }
});

test('prohibited vehicles are listed on both the toll and rules pages', async ({ page }) => {
  for (const path of ['/travel/toll', '/travel/rules']) {
    await page.goto(`/en${path}`);
    const list = page.locator('.db-prohibited-list');
    await expect(list).toBeVisible();
    for (const vehicle of PROHIBITED_EN) {
      await expect(list).toContainText(vehicle);
    }
  }
});

test('the interchange table has identical content at every width, including where the strip hides', async ({ page }) => {
  const counts = [];
  for (const width of [360, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/en/travel/route');
    // The strip is aria-hidden and hides below 700px; the table is the real
    // content and must always be there, with the same rows.
    const table = page.locator('table.db-table');
    await expect(table).toBeVisible();
    const rows = table.locator('tbody tr');
    await expect(rows.first()).toBeVisible();
    counts.push(await rows.count());
  }
  expect(counts[0]).toBeGreaterThan(0);
  expect(counts[0]).toBe(counts[1]);
});

test('the route table excludes the bridges the status table includes', async ({ page }) => {
  await page.goto('/en/travel/status');
  const statusRows = await page.locator('table.db-table tbody tr').count();

  await page.goto('/en/travel/route');
  const routeRows = await page.locator('table.db-table tbody tr').count();

  // /route filters markers to kind === interchange | toll_plaza; /status
  // shows every marker, including the three bridge rows.
  // Route must show strictly fewer rows, not the same set re-labelled.
  expect(routeRows).toBeLessThan(statusRows);

  const bridgeLabel = t('en', 'kindBridge');
  const bridgeCells = page.locator('table.db-table tbody tr', { hasText: bridgeLabel });
  expect(await bridgeCells.count()).toBe(0);
});

test('the facilities page shows the no-facilities message when no service areas are seeded', async ({ page }) => {
  await page.goto('/en/travel/facilities');
  // The current seed has zero interchanges of kind service_area (8
  // interchange, 9 toll_plaza, 3 bridge) — this must degrade
  // to the empty state, not throw or silently render an empty list.
  await expect(page.locator('.db-empty-inline')).toHaveText(t('en', 'noFacilities'));
  expect(await page.locator('.db-facility-list').count()).toBe(0);
});

test('status is shown as text on the route table, never colour alone', async ({ page }) => {
  await page.goto('/en/travel/route');
  const tags = page.locator('table.db-table .db-tag');
  const count = await tags.count();
  expect(count).toBeGreaterThan(0);
  for (let i = 0; i < count; i += 1) {
    const text = (await tags.nth(i).innerText()).trim();
    expect(text.length, `status tag ${i} has no visible text`).toBeGreaterThan(0);
  }
});

test('the corridor strip is hidden from assistive technology', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/en/travel/status');
  // Segments are seeded, so CorridorStrip (which renders null when there are
  // no bands) must actually render — this must not silently pass on an
  // absent element the way an `if (await strip.count())` guard would.
  const strip = page.locator('.db-strip');
  await expect(strip).toHaveCount(1);
  await expect(strip).toHaveAttribute('aria-hidden', 'true');
});

test('no horizontal overflow on any Travel Info page at 320px', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 });
  for (const path of PAGES) {
    await page.goto(`/en${path}`);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth
    );
    expect(overflow, `${path} scrolls sideways by ${overflow}px`).toBeLessThanOrEqual(1);
  }
});

test('the section navigation is reachable at 320px', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 });
  await page.goto('/en/travel/status');

  const links = page.locator('.db-subnav a:visible');
  const count = await links.count();
  expect(count).toBe(5);
  // The row scrolls horizontally on purpose, so only the first item has to
  // be in view without scrolling — but it must be.
  const box = await links.first().boundingBox();
  expect(box.x).toBeGreaterThanOrEqual(-1);
  expect(box.x + box.width).toBeLessThanOrEqual(321);
});

test('the section navigation marks the current page, and only the current page', async ({ page }) => {
  // TravelSubnav is a client component keyed off usePathname — this is the
  // thing that actually breaks if that comparison stops matching (trailing
  // slash, locale mismatch, stale pathname on client-side nav).
  for (const path of PAGES) {
    await page.goto(`/en${path}`);
    const links = page.locator('.db-subnav a');
    const count = await links.count();
    expect(count).toBe(5);

    let currentHrefs = [];
    for (let i = 0; i < count; i += 1) {
      const link = links.nth(i);
      if ((await link.getAttribute('aria-current')) === 'page') {
        currentHrefs.push(await link.getAttribute('href'));
      }
    }
    expect(currentHrefs, `expected exactly one current link on ${path}`).toEqual([`/en${path}`]);
  }
});

test('the progress figure on the status page matches the open-length note beside it', async ({ page }) => {
  await page.goto('/en/travel/status');
  const bar = page.getByRole('progressbar');
  await expect(bar).toBeVisible();

  const now = Number(await bar.getAttribute('aria-valuenow'));
  expect(now).toBeGreaterThan(0);
  expect(now).toBeLessThanOrEqual(100);

  // percentOpen (lib/corridor/geometry.js) is computed from segments and
  // never hand-typed. Cross-check it against the "X km / Y km" note the same
  // page renders instead of hard-coding a percentage — segment status is
  // still provisional and Task 13b already moved this figure once when the
  // real survey replaced the placeholder geometry.
  const noteText = (await page.locator('.db-progress-note').innerText()).trim();
  const match = noteText.match(/^([\d.]+)\s*km\s*\/\s*([\d.]+)\s*km$/);
  expect(match, `progress note text didn't match "X km / Y km": "${noteText}"`).not.toBeNull();
  const openKm = Number(match[1]);
  const totalKm = Number(match[2]);
  expect(totalKm).toBeGreaterThan(0);

  const expectedPct = (openKm / totalKm) * 100;
  // formatKm rounds each figure to 1 decimal before this re-derivation, so
  // allow a small tolerance rather than expecting bit-for-bit equality with
  // percentOpen's own rounding.
  expect(Math.abs(now - expectedPct), `aria-valuenow=${now} but ${openKm}/${totalKm} km implies ${expectedPct.toFixed(2)}%`)
    .toBeLessThan(1);
});
