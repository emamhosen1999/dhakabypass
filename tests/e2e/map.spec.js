import { test, expect } from '@playwright/test';

const box = (page) => page.locator('.db-map').evaluate((svg) => {
  const b = svg.viewBox.baseVal;
  return { x: b.x, y: b.y, w: b.width, h: b.height };
});
const pointOnSection = (page, index = 1) => page.locator('.db-map-section').nth(index).evaluate((path) => {
  const p = path.getPointAtLength(path.getTotalLength() * 0.55).matrixTransform(path.getScreenCTM());
  return { x: p.x, y: p.y };
});

for (const locale of ['en', 'bn', 'zh']) {
  for (const [device, viewport] of Object.entries({ desktop: { width: 1280, height: 900 }, mobile: { width: 390, height: 844 } })) {
    for (const theme of ['light', 'dark']) {
      test(`map fills its column: ${locale} ${device} ${theme}`, async ({ page }, testInfo) => {
        await page.setViewportSize(viewport);
        await page.emulateMedia({ colorScheme: theme });
        await page.goto(`/${locale}/travel/map`);
        await expect(page.locator('.db-map-wrap')).toHaveClass(/is-enhanced/);
        await page.evaluate(() => document.fonts.ready);
        const measured = await page.locator('.db-map-wrap').evaluate((el) => ({
          width: el.getBoundingClientRect().width,
          column: Number.parseFloat(getComputedStyle(el.parentElement).gridTemplateColumns),
          overflow: document.documentElement.scrollWidth > innerWidth,
        }));
        expect(measured.width).toBeGreaterThan(measured.column - 2);
        expect(measured.overflow).toBe(false);
        await testInfo.attach('dimensions', { body: JSON.stringify(measured), contentType: 'application/json' });
        await page.screenshot({ path: `var/shots/map-${locale}-${device}-${theme}.png`, fullPage: true });
      });
    }
  }
}

test.describe('map interaction', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/en/travel/map');
    await expect(page.locator('.db-map-wrap')).toHaveClass(/is-enhanced/);
    await page.locator('.db-map-wrap').scrollIntoViewIfNeeded();
  });

  test('wheel zoom stays under the cursor and reset restores home', async ({ page }) => {
    const home = await box(page);
    const frame = await page.locator('.db-map').boundingBox();
    const cursor = { x: frame.x + frame.width * 0.42, y: frame.y + frame.height * 0.4 };
    const svgPoint = () => page.locator('.db-map').evaluate((svg, p) =>
      new DOMPoint(p.x, p.y).matrixTransform(svg.getScreenCTM().inverse()).toJSON(), cursor);
    const before = await svgPoint();
    await page.mouse.move(cursor.x, cursor.y);
    await page.mouse.wheel(0, -120);
    await expect.poll(async () => (await box(page)).w).toBeLessThan(home.w);
    const after = await svgPoint();
    expect(Math.abs(before.x - after.x)).toBeLessThan(1);
    expect(Math.abs(before.y - after.y)).toBeLessThan(1);
    await expect(page.locator('.db-map-reset')).toBeEnabled();
    await page.locator('.db-map-reset').click();
    await expect.poll(() => box(page)).toEqual(home);
    await expect(page.locator('.db-map-reset')).toBeDisabled();
  });

  test('drag pans at full scale and enables reset without selecting a section', async ({ page }) => {
    const home = await box(page);
    const p = await pointOnSection(page);
    await page.mouse.move(p.x, p.y);
    await page.mouse.down();
    await page.mouse.move(p.x + 45, p.y + 30, { steps: 8 });
    await page.mouse.up();
    await expect.poll(async () => (await box(page)).x).not.toBe(home.x);
    await expect(page.locator('.db-sectionrow.is-selected')).toHaveCount(0);
    await expect(page.locator('.db-map-reset')).toBeEnabled();
    await page.locator('.db-map-reset').click();
    await expect.poll(() => box(page)).toEqual(home);
    await expect(page.locator('.db-map-wrap')).not.toHaveClass(/is-dragging/);
  });

  test('clicking the road selects its row; a second click restores the corridor', async ({ page }) => {
    const home = await box(page);
    let p = await pointOnSection(page);
    await page.mouse.click(p.x, p.y);
    await expect(page.locator('.db-sectionrow').nth(1)).toHaveClass(/is-selected/);
    await expect.poll(async () => (await box(page)).w).toBeLessThan(home.w);
    p = await pointOnSection(page);
    await page.mouse.click(p.x, p.y);
    await expect(page.locator('.db-sectionrow.is-selected')).toHaveCount(0);
    await expect.poll(() => box(page)).toEqual(home);
    await expect(page.locator('.db-map-reset')).toBeDisabled();
  });

  test('list hover thickens the matching road section', async ({ page }) => {
    const path = page.locator('.db-map-section').nth(2);
    const width = await path.evaluate((p) => Number.parseFloat(getComputedStyle(p).strokeWidth));
    await page.locator('.db-sectionbtn').nth(2).hover();
    await expect(page.locator('.db-map-hit').nth(2)).toHaveClass(/is-active/);
    await expect.poll(() => path.evaluate((p) => Number.parseFloat(getComputedStyle(p).strokeWidth))).toBeGreaterThan(width);
  });

  test('two touch pointers pinch to zoom', async ({ page, context }) => {
    const home = await box(page);
    const frame = await page.locator('.db-map').boundingBox();
    const cx = frame.x + frame.width * 0.5;
    const cy = Math.max(120, frame.y + frame.height * 0.35);
    const cdp = await context.newCDPSession(page);
    const points = (d) => [{ x: cx - d, y: cy, id: 1 }, { x: cx + d, y: cy, id: 2 }];
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: points(35) });
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: points(75) });
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await expect.poll(async () => (await box(page)).w).toBeLessThan(home.w * 0.8);
    await expect(page.locator('.db-sectionrow.is-selected')).toHaveCount(0);
    await expect(page.locator('.db-map-reset')).toBeEnabled();
  });

  test('page and map controls produce no browser errors', async ({ page }) => {
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
    await page.reload();
    await page.getByRole('button', { name: 'Zoom in', exact: true }).click();
    await page.getByRole('button', { name: 'Zoom out', exact: true }).click();
    await page.locator('.db-sectionbtn').first().click();
    await page.locator('.db-map-reset').click();
    expect(errors).toEqual([]);
  });
});
