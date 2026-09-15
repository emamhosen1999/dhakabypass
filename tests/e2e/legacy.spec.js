import { test, expect } from '@playwright/test';

// One address per page (concession audit CON-SEO-A-02), in the reader's language.
test('the root redirects to the homepage in the language the reader prefers', async ({ page, request }) => {
  const zh = await request.get('/', { maxRedirects: 0, headers: { 'accept-language': 'zh-CN,zh;q=0.9,en;q=0.8' } });
  expect(new URL(zh.headers().location, 'http://x').pathname).toBe('/zh');
  const bn = await request.get('/', { maxRedirects: 0, headers: { 'accept-language': 'bn-BD,bn;q=0.9' } });
  expect(new URL(bn.headers().location, 'http://x').pathname).toBe('/bn');
  const chosen = await request.get('/', { maxRedirects: 0, headers: { 'accept-language': 'zh-CN', cookie: 'db_locale=en' } });
  expect(new URL(chosen.headers().location, 'http://x').pathname).toBe('/en');
  const bare = await request.get('/', { maxRedirects: 0, headers: { 'accept-language': 'en-GB,en;q=0.9' } });
  expect(bare.status()).toBe(307);
  expect(new URL(bare.headers().location, 'http://x').pathname).toBe('/en');
  await page.goto('/');
  expect(new URL(page.url()).pathname).toBe('/en');
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
