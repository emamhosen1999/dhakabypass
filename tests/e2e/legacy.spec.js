import { test, expect } from '@playwright/test';

test('the root opens the English homepage without redirecting', async ({page}) => {
  const response = await page.goto('/');
  expect(response.status()).toBe(200);
  expect(response.request().redirectedFrom()).toBeNull();
  expect(new URL(page.url()).pathname).toBe('/');
  await expect(page.locator('.db-root')).toHaveAttribute('lang', 'en');
});

// The client authorised retiring the legacy site on 2026-09-06.
for (const [from, to] of [
  ['/project', '/en/project'], ['/project/overview', '/en/project'],
  ['/economic-impact', '/en/project'], ['/stakeholders', '/en/about/governance'],
  ['/chinese-contribution', '/en/about'], ['/routes-facilities', '/en/travel/map'],
  ['/latest-updates', '/en/news'], ['/gallery', '/en/gallery'], ['/contact', '/en/contact'],
]) {
  test(`retired ${from} redirects to ${to}`, async ({request}) => {
    const response = await request.get(from, {maxRedirects: 0});
    expect(response.status()).toBe(308);
    expect(new URL(response.headers().location, response.url()).pathname).toBe(to);
    const destination = await request.get(to);
    expect(destination.status()).toBe(200);
    expect(await destination.text()).toContain('db-root');
  });
}
