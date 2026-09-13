// tests/e2e/admin.spec.js
//
// The operator's whole job, end to end (W6.9): sign in, create a page, add a
// block, write and publish it in English and Bangla, see both on the public
// site, upload a picture, replace it, and clean up after itself.
//
// Unit tests mock the action layer, and a class of admin bug only shows in a
// real browser against a real server (Next redacting action errors in
// production, a form resetting after an action). This suite drives the forms
// the way a person does.
//
// It signs in with a throwaway account it creates in the database named by
// .env.local, and deletes that account and everything it made at the end. So
// it runs only against a local server: against a deployment
// (PLAYWRIGHT_BASE_URL) it is skipped rather than creating users in
// production.
import { test, expect } from '@playwright/test';
import path from 'node:path';
import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';


// E2E_LOCAL_BUILD=1 runs it against a local production build (PLAYWRIGHT_BASE_URL
// pointing at the standalone server), where admin behaviour differs from dev.
test.skip(Boolean(process.env.PLAYWRIGHT_BASE_URL) && !process.env.E2E_LOCAL_BUILD, 'creates a throwaway admin account; local only');
test.describe.configure({ mode: 'serial' });

const STAMP = Date.now();
const EMAIL = `e2e-admin-${STAMP}@example.test`;
const PASSWORD = `e2e-${STAMP}-Pass!`;
const SLUG = `e2e-admin-${STAMP}`;
const PICTURE = path.resolve(process.cwd(), 'public/brand/dbedc-mark.png');

let db;

test.beforeAll(async () => {
  (await import('../../scripts/load-env.mjs')).loadEnv();
  db = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1', port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root', password: process.env.DB_PASSWORD || '', database: process.env.DB_NAME,
  });
  await db.execute("INSERT INTO users (email, name, password_hash, role) VALUES (?, 'E2E admin', ?, 'admin')",
    [EMAIL, await bcrypt.hash(PASSWORD, 10)]);
});

test.afterAll(async () => {
  if (!db) return;
  const [pages] = await db.execute('SELECT id FROM pages WHERE slug = ?', [SLUG]);
  for (const { id } of pages) {
    await db.execute('DELETE t FROM block_translations t JOIN blocks b ON b.id = t.block_id WHERE b.page_id = ?', [id]);
    await db.execute('DELETE FROM revisions WHERE entity_id IN (SELECT id FROM blocks WHERE page_id = ?)', [id]);
    await db.execute('DELETE FROM blocks WHERE page_id = ?', [id]);
    await db.execute('DELETE FROM page_translations WHERE page_id = ?', [id]);
    await db.execute('DELETE FROM pages WHERE id = ?', [id]);
  }
  await db.execute('DELETE FROM media WHERE JSON_UNQUOTE(JSON_EXTRACT(alt, "$.en")) LIKE ?', [`E2E picture ${STAMP}%`]);
  await db.execute('DELETE FROM users WHERE email = ?', [EMAIL]);
  await db.end();
});

async function signIn(page) {
  await page.goto('/admin/login');
  await page.getByLabel('Email').fill(EMAIL);
  await page.getByLabel('Password').fill(PASSWORD);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.waitForURL((u) => u.pathname.startsWith('/admin') && !u.pathname.startsWith('/admin/login'));
}

test('an operator builds, translates and publishes a page from the admin', async ({ page }) => {
  test.setTimeout(180_000);
  await signIn(page);

  // Create the page.
  await page.goto('/admin/pages-v2');
  await page.locator('input[name="title"]').first().fill(`E2E page ${STAMP}`);
  await page.locator('input[name="slug"]').first().fill(SLUG);
  await page.getByRole('button', { name: 'Create page' }).click();
  // Wait for the action to land before navigating, or the navigation aborts it.
  let pageId;
  await expect.poll(async () => {
    const [[p]] = await db.execute('SELECT id FROM pages WHERE slug = ?', [SLUG]);
    pageId = p?.id;
    return Boolean(pageId);
  }, { timeout: 60_000 }).toBe(true);
  await page.goto('/admin/pages-v2');
  await expect(page.getByRole('link', { name: `E2E page ${STAMP}` })).toBeVisible();
  const editor = `/admin/pages-v2/${pageId}`;
  await page.goto(editor);

  // Add a page-header block.
  await page.locator('select[name="type"]').first().selectOption('page-header');
  await page.getByRole('button', { name: 'Add', exact: true }).click();
  // A first compile of the editor action under next dev can take a while.
  await expect(page.locator('input[name="f.heading"]').first()).toBeVisible({ timeout: 60_000 });

  // English, published.
  await page.locator('input[name="f.heading"]').first().fill(`E2E heading ${STAMP}`);
  await page.locator('[name="f.lede"]').first().fill('Written by the admin end-to-end test.');
  await page.getByRole('button', { name: 'Publish' }).first().click();
  await page.waitForLoadState('networkidle');

  // Bangla, published.
  await page.goto(`${editor}?locale=bn`);
  await page.locator('input[name="f.heading"]').first().fill(`ই২ই শিরোনাম ${STAMP}`);
  await page.getByRole('button', { name: 'Publish' }).first().click();
  await page.waitForLoadState('networkidle');

  // Both reach the public site, each in its own language.
  await expect.poll(async () => {
    const res = await page.request.get(`/en/${SLUG}`);
    return res.status() === 200 && (await res.text()).includes(`E2E heading ${STAMP}`);
  }, { timeout: 30_000 }).toBe(true);
  await expect.poll(async () => (await (await page.request.get(`/bn/${SLUG}`)).text()).includes(`ই২ই শিরোনাম ${STAMP}`),
    { timeout: 30_000 }).toBe(true);
});

test('an operator adds a picture to the library and replaces it', async ({ page }) => {
  test.setTimeout(120_000);
  await signIn(page);
  await page.goto('/admin/media');
  const add = page.locator('form').filter({ has: page.getByRole('button', { name: 'Add to library' }) });
  await add.locator('input[type="file"]').setInputFiles(PICTURE);
  await add.locator('input[name="alt_en"]').fill(`E2E picture ${STAMP}`);
  await add.getByRole('button', { name: 'Add to library' }).click();

  // The action finishes with a redirect back to the library; wait for the row
  // rather than for the network to go quiet, which can happen mid-upload.
  let row;
  await expect.poll(async () => {
    [[row]] = await db.execute(
      'SELECT id, path FROM media WHERE JSON_UNQUOTE(JSON_EXTRACT(alt, "$.en")) = ? LIMIT 1', [`E2E picture ${STAMP}`]);
    return Boolean(row);
  }, { timeout: 60_000 }).toBe(true);
  await page.goto('/admin/media');

  const card = page.locator('form')
    .filter({ has: page.locator(`input[name="id"][value="${row.id}"]`) })
    .filter({ has: page.getByRole('button', { name: 'Replace' }) });
  await card.locator('input[type="file"]').setInputFiles(PICTURE);
  await card.getByRole('button', { name: 'Replace' }).click();

  // Replacing moves the row to a new file and keeps its description.
  await expect.poll(async () => {
    const [[after]] = await db.execute('SELECT path, JSON_UNQUOTE(JSON_EXTRACT(alt, "$.en")) AS alt FROM media WHERE id = ?', [row.id]);
    return after && after.path !== row.path ? after.alt : null;
  }, { timeout: 60_000 }).toBe(`E2E picture ${STAMP}`);
});
