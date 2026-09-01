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

    // A 200 is not enough — the tripwire this spec exists for is a redirect
    // (e.g. middleware widened to send '/' -> '/en' ahead of cutover) that
    // still ends in a 200, just on the NEW site. Reject any redirect and
    // confirm we're still looking at the URL we asked for.
    expect(response.request().redirectedFrom()).toBeNull();
    expect(new URL(page.url()).pathname).toBe(path);

    // Distinguish the old site from the new one structurally: the new
    // locale layout wraps everything in a `.db-root` element that the
    // legacy (site) layout never renders. The legacy header is the only
    // place the "DBEDC Logo" alt text appears (the new header renders
    // "DBEDC" as its own visible brand text, so that string alone would
    // match both sites and prove nothing).
    await expect(page.locator('.db-root')).toHaveCount(0);
    await expect(page.locator('img[alt="DBEDC Logo"]')).toBeVisible();
  });
}
