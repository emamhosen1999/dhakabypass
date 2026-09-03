// tests/e2e/home.spec.js
//
// End-to-end cover for the home page (Task 14).
//
// The page is assembled from three independent sources and each of them has
// broken at least once during this build:
//
//   1. the block CMS (scripts/seed-home-v2.mjs) — hero, toll-preview,
//      media-prose x2, card-grid, stat-row, figure-grid, partner-row, cta-band
//   2. the corridor repositories — the progress bar, the schematic strip and
//      the five-row interchange table between the hero and the first block
//   3. lib/media — every <img> on the page comes from an audited media row
//
// Assertions here are on visible text and measured geometry. A status code is
// never asserted on its own: `/bn` returning 200 after silently serving the
// English page would satisfy that and prove nothing.
import { test, expect } from '@playwright/test';
import { t } from '../../lib/i18n/ui.js';

// The headings actually seeded in English by scripts/seed-home-v2.mjs, in
// document order, plus the corridor summary's heading which comes from
// lib/i18n/ui.js rather than from content.
//
// NOTE: the plan's draft of this test listed a closing CTA of "Something wrong
// on the road". The seeded cta-band is headed "Before you drive it" — the seed
// comment explains why (no localised contact route and no hotline from DBEDC
// yet). The seed is the thing that ships, so it is what is asserted.
const EN_HEADINGS = [
  'What it costs',
  'A road around the city, not through it',
  'What it connects',
  'What the open section changes now',
  'The corridor',
  'Who builds and runs it',
  'Before you drive it',
];

// Ten inherited files the media audit rejected: third-party infographics, two
// Google Maps screenshots, internal working drawings, and a stock flag graphic.
// scripts/import-legacy-media.mjs refuses to register them; this proves none
// reaches a page by some other route (a hand-written <img>, a stale block
// record, a CSS background hard-coded into a renderer).
const REJECTED_IMAGE = /cbri|hma|\/road\.webp|eco-eff|friends|\/map\.webp|\/photo\/2\.webp|\/photo\/3\.webp|\/photo\/5\.webp|\/photo\/6\.webp/;

// Links that legitimately leave the current locale prefix: the language
// switcher, whose entire job is to point at the other two locale roots.
// Anything else starting with "/" on /bn must stay under /bn.
const NON_LOCALISED_EXCEPTIONS_ON_BN = new Set(['/en', '/zh']);

test.describe('home page', () => {
  test('leads with the hero, then the corridor summary', async ({ page }) => {
    await page.goto('/en');
    const h1 = page.locator('h1');
    await expect(h1).toHaveCount(1);
    await expect(h1).toContainText(/open/i);

    // The corridor summary must come before every other section: the first
    // actionable thing on a road operator's front door is the state of the
    // road, not marketing copy.
    const headings = page.locator('h1, h2');
    await expect(headings.nth(1)).toHaveText(t('en', 'homeCorridorHeading'));
  });

  test('shows live toll amounts that match the toll page', async ({ page }) => {
    // The toll-preview block reads live rates precisely so that the home page
    // and /travel/toll can never quote different money for the same vehicle.
    // Match on the CLASS, not on row position: "cheapest first on both pages"
    // would still pass if the two pages disagreed about which class is cheapest.
    // textContent, not innerText, on both sides: .db-tollpreview-class is
    // uppercased in CSS and the toll table's row header is not, so innerText
    // would compare "SEDAN / PRIVATE CAR" against "Sedan / Private Car" and
    // fail on styling rather than on the money.
    const norm = (s) => (s || '').replace(/\s+/g, ' ').trim();

    await page.goto('/en');
    await expect(page.locator('.db-tollpreview-amount').first()).toBeVisible();
    const preview = await page.$$eval('.db-tollpreview-item', (els) => els.map((el) => [
      el.querySelector('.db-tollpreview-class').textContent,
      el.querySelector('.db-tollpreview-amount').textContent,
    ]));
    expect(preview.length, 'the toll preview rendered no rates').toBeGreaterThan(0);

    const [vehicle, shown] = preview[0].map(norm);
    expect(vehicle.length).toBeGreaterThan(0);
    expect(shown).toMatch(/৳\s*\d/);

    await page.goto('/en/travel/toll');
    await expect(page.locator('table.db-table tbody tr').first()).toBeVisible();
    const table = await page.$$eval('table.db-table tbody tr', (rows) => rows.map((tr) => [
      tr.querySelector('th').textContent,
      tr.querySelector('.db-toll-amount').textContent,
    ]));
    const match = table.map(([c, a]) => [norm(c), norm(a)]).filter(([c]) => c === vehicle);
    expect(match.length, `no row on /en/travel/toll for "${vehicle}" (rows: ${table.map(([c]) => norm(c)).join(', ')})`)
      .toBe(1);
    expect(match[0][1], `home shows ${shown} for ${vehicle}, /travel/toll shows ${match[0][1]}`).toBe(shown);
  });

  test('renders every seeded section', async ({ page }) => {
    await page.goto('/en');
    for (const name of EN_HEADINGS) {
      // Exact match: "The corridor" (the figure grid) and "The corridor today"
      // (the summary above it) are different sections, and a substring match
      // would let either stand in for the other.
      await expect(
        page.getByRole('heading', { name, exact: true }),
        `missing section heading "${name}"`,
      ).toBeVisible();
    }

    // The stat row is the one seeded block with no heading of its own.
    const stats = page.locator('.db-statrow-grid .db-stat');
    await expect(stats).toHaveCount(4);
    await expect(stats.first()).toBeVisible();

    // The corridor summary between the hero and the blocks: progress bar,
    // schematic strip and the five-row interchange table.
    await expect(page.getByRole('progressbar')).toBeVisible();
    await expect(page.locator('.db-strip')).toHaveCount(1);
    await expect(page.locator('table.db-table tbody tr')).toHaveCount(5);
  });

  test('hero image carries dimensions so the page does not shift', async ({ page }) => {
    await page.goto('/en');
    const img = page.locator('.db-hero-bg img');
    await expect(img).toHaveAttribute('width', /\d+/);
    await expect(img).toHaveAttribute('height', /\d+/);
  });

  test('does not scroll sideways on a phone', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/en');
    const overflow = await page.evaluate(() =>
      document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow, `the home page scrolls sideways by ${overflow}px at 390px`).toBeLessThanOrEqual(0);
  });

  test('renders in Bangla without falling back to English headings', async ({ page }) => {
    await page.goto('/en');
    const englishH1 = (await page.locator('h1').innerText()).trim();

    await page.goto('/bn');
    const banglaH1 = page.locator('h1');
    await expect(banglaH1).toHaveCount(1);
    await expect(banglaH1).not.toContainText('Eighteen kilometres');
    expect((await banglaH1.innerText()).trim()).not.toBe(englishH1);

    // Per-block fallback means a single untranslated block shows English while
    // the rest of the page is Bangla — which a check on the h1 alone would
    // miss entirely. Assert that NONE of the English section headings survive.
    const bodyText = await page.locator('#main').innerText();
    for (const name of EN_HEADINGS) {
      expect(bodyText, `"${name}" fell back to English on /bn`).not.toContain(name);
    }
    // The chrome's own strings come from lib/i18n/ui.js, not from content.
    await expect(page.locator('h2').first()).toHaveText(t('bn', 'homeCorridorHeading'));
  });

  // ---- Defects found in this build, now nailed down --------------------

  test('no two strip labels overlap at 1440, 1024 or 768', async ({ page }) => {
    // This regressed three times behind three different causes (a constant
    // row count, index-parity row assignment, and an unbounded label height)
    // and a visual check missed it every time. Measure the real boxes.
    for (const width of [1440, 1024, 768]) {
      await page.setViewportSize({ width, height: 1000 });
      await page.goto('/en');

      const strip = page.locator('.db-strip');
      await expect(strip, `the strip is not rendered at ${width}px`).toBeVisible();

      const markers = await page.$$eval('.db-marker', (els) => els.map((el) => {
        const r = el.getBoundingClientRect();
        return {
          label: el.textContent.replace(/\s+/g, ' ').trim(),
          x: r.x, y: r.y, right: r.right, bottom: r.bottom,
        };
      }));

      // A collision test over one marker passes for the wrong reason.
      expect(markers.length, `only ${markers.length} markers at ${width}px`).toBeGreaterThan(1);

      for (let i = 0; i < markers.length; i += 1) {
        for (let j = i + 1; j < markers.length; j += 1) {
          const a = markers[i];
          const b = markers[j];
          // Touching edges are fine; genuine overlap is not. Half a pixel of
          // tolerance absorbs subpixel layout rounding.
          const overlapX = Math.min(a.right, b.right) - Math.max(a.x, b.x);
          const overlapY = Math.min(a.bottom, b.bottom) - Math.max(a.y, b.y);
          const collides = overlapX > 0.5 && overlapY > 0.5;
          expect(
            collides,
            `at ${width}px "${a.label}" and "${b.label}" overlap by ${overlapX.toFixed(1)}x${overlapY.toFixed(1)}px`,
          ).toBe(false);
        }
      }
    }
  });

  test('serves none of the ten images the media audit rejected', async ({ page }) => {
    await page.goto('/en');
    // Scroll the whole page so lazy-loaded figures below the fold are in the
    // DOM with their real src before anything is asserted.
    await page.evaluate(async () => {
      for (let y = 0; y < document.body.scrollHeight; y += 600) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 60));
      }
      window.scrollTo(0, 0);
    });

    const srcs = await page.$$eval('img[src]', (els) => els.map((el) => el.getAttribute('src')));
    expect(srcs.length, 'no images on the home page at all').toBeGreaterThan(0);
    for (const src of srcs) {
      expect(src, `${src} is a rejected image and must never be served`).not.toMatch(REJECTED_IMAGE);
    }

    const srcsets = await page.$$eval('img[srcset], source[srcset]',
      (els) => els.map((el) => el.getAttribute('srcset')));
    for (const set of srcsets) {
      expect(set, `${set} references a rejected image`).not.toMatch(REJECTED_IMAGE);
    }
  });

  test('every internal link on /bn stays inside /bn', async ({ page }) => {
    // A link to /gallery or /contact from /bn drops a Bangla reader onto the
    // legacy English site.
    await page.goto('/bn');
    const hrefs = await page.$$eval('a[href]', (els) => els.map((el) => el.getAttribute('href')));
    const internal = hrefs.filter((h) => h && h.startsWith('/'));
    expect(internal.length, 'no internal links found — the page did not render').toBeGreaterThan(0);

    const localised = internal.filter((h) => !NON_LOCALISED_EXCEPTIONS_ON_BN.has(h));
    expect(localised.length, 'every internal link was an exception — nothing was actually checked')
      .toBeGreaterThan(0);

    for (const href of localised) {
      expect(
        href === '/bn' || href.startsWith('/bn/'),
        `${href} on /bn leaves the Bangla site and is not a declared exception`,
      ).toBe(true);
    }
  });

  test('has exactly one h1 and skips no heading level', async ({ page }) => {
    await page.goto('/en');
    await expect(page.locator('h1')).toHaveCount(1);

    const levels = await page.$$eval('#main h1, #main h2, #main h3, #main h4, #main h5, #main h6',
      (els) => els.map((el) => ({ level: Number(el.tagName[1]), text: el.textContent.trim() })));
    expect(levels.length, 'no headings inside #main').toBeGreaterThan(1);
    expect(levels[0].level, `the first heading in #main is an h${levels[0].level}, not the h1`).toBe(1);

    for (let i = 1; i < levels.length; i += 1) {
      const jump = levels[i].level - levels[i - 1].level;
      expect(
        jump,
        `"${levels[i - 1].text}" (h${levels[i - 1].level}) is followed by `
        + `"${levels[i].text}" (h${levels[i].level}) — a skipped level`,
      ).toBeLessThanOrEqual(1);
    }
  });
});
