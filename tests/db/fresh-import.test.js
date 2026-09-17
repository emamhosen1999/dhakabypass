import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import mysql from 'mysql2/promise';

/**
 * The production rehearsal.
 *
 * Production is built by hand-importing db/sql/*.sql in number order through
 * phpMyAdmin — never from the development database. That matters because the
 * development database has been re-seeded and numbers its pages and blocks
 * differently from 02-seed.sql (grievances is page 13 here and page 11 there;
 * the governance prose is block 135 here and 16 there). A numbered file that
 * quietly assumed a development id would import cleanly, do nothing, or do
 * the wrong thing, and nobody would know until the site was live.
 *
 * So: build a database from NOTHING but the SQL files, in order, twice — the
 * second pass proves idempotence — and assert the things each file promised.
 * This is the only test that exercises the files the way production does.
 *
 * Runs under `npm run test:db` only (a throwaway database, a mysql client on
 * PATH or at Laragon's path) — never under `npx vitest run tests/unit`.
 */
const ROOT = path.resolve(import.meta.dirname, '../..');
const DB = `${process.env.DB_NAME_TEST || 'dhakabypass_test'}_fresh`;
const HOST = process.env.DB_HOST || '127.0.0.1';
const USER = process.env.DB_USER || 'root';
const PASS = process.env.DB_PASSWORD || '';

const files = fs.readdirSync(path.join(ROOT, 'db/sql'))
  .filter((f) => /^\d\d-.*\.sql$/.test(f))
  .sort();

let conn;

async function importFile(file) {
  const sql = fs.readFileSync(path.join(ROOT, 'db/sql', file), 'utf8');
  const c = await mysql.createConnection({ host: HOST, user: USER, password: PASS, database: DB, charset: 'utf8mb4', multipleStatements: true });
  try {
    await c.query(sql);
  } finally {
    await c.end();
  }
}

beforeAll(async () => {
  const admin = await mysql.createConnection({ host: HOST, user: USER, password: PASS });
  await admin.query(`DROP DATABASE IF EXISTS \`${DB}\``);
  await admin.query(`CREATE DATABASE \`${DB}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
  await admin.end();
  for (const f of files) await importFile(f);
  for (const f of files) await importFile(f); // idempotence: a second pass must change nothing
  conn = await mysql.createConnection({ host: HOST, user: USER, password: PASS, database: DB, charset: 'utf8mb4' });
}, 300_000);

afterAll(async () => {
  if (conn) await conn.end();
  if (process.env.KEEP_FRESH_DB) return; // leave it for inspection
  const admin = await mysql.createConnection({ host: HOST, user: USER, password: PASS });
  await admin.query(`DROP DATABASE IF EXISTS \`${DB}\``);
  await admin.end();
});

const one = async (sql, params = []) => (await conn.query(sql, params))[0][0];
const all = async (sql, params = []) => (await conn.query(sql, params))[0];

describe('a database built from db/sql/*.sql alone', () => {
  it('imports every numbered file in order, and the ledger records all of them (W6.6)', async () => {
    expect(files.length).toBeGreaterThanOrEqual(18);
    const { MIGRATIONS } = await import('../../lib/db/migrations.js');
    const rows = await all('SELECT name FROM schema_migrations ORDER BY name');
    expect(rows.map((r) => r.name)).toEqual([...MIGRATIONS]);
  });

  it('carries no provenance marker or pending notice after 22, 29 and 30', async () => {
    const r = await one(`SELECT COUNT(*) AS c FROM block_translations
      WHERE JSON_UNQUOTE(JSON_EXTRACT(data, '$.body')) LIKE '%db-pending%'
         OR JSON_UNQUOTE(JSON_EXTRACT(data, '$.body')) LIKE '%db-archive%'`);
    expect(r.c).toBe(0);
    // 29-legacy-as-current: no block is framed as "from the previous website"
    // any more — the six legacy-tone notices are deleted or plain rich-text,
    // and the restored facts carry no notice. What remains is the 9 pending
    // notices (information DBEDC still has to supply).
    const legacy = await one(`SELECT COUNT(*) AS c FROM block_translations WHERE JSON_UNQUOTE(JSON_EXTRACT(data, '$.tone')) = 'legacy'`);
    expect(legacy.c).toBe(0);
    const framed = await one(`SELECT COUNT(*) AS c FROM block_translations
      WHERE JSON_UNQUOTE(JSON_EXTRACT(data, '$.body')) LIKE '%previous website%' OR JSON_UNQUOTE(JSON_EXTRACT(data, '$.heading')) LIKE '%previously published%'`);
    expect(framed.c).toBe(0);
    // 30-pending-drafts: every "Not yet published" notice is content now.
    expect((await one(`SELECT COUNT(*) AS c FROM block_translations WHERE JSON_UNQUOTE(JSON_EXTRACT(data, '$.tone')) = 'pending'`)).c).toBe(0);
    expect((await one("SELECT COUNT(*) AS c FROM blocks WHERE type = 'callout'")).c).toBe(0);
    // 31 deleted three of them: the retyped toll schedule, key locations and
    // facility cards that copied records.
    expect((await one('SELECT COUNT(*) AS c FROM blocks WHERE id BETWEEN 400 AND 432')).c).toBe(23);
  });

  it('gives the records the columns, rows and settings the code reads (31)', async () => {
    const cols = await all(`SELECT TABLE_NAME AS t, COLUMN_NAME AS c FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND ((TABLE_NAME = 'toll_rates' AND COLUMN_NAME LIKE 'sro_%')
        OR (TABLE_NAME = 'interchanges' AND COLUMN_NAME = 'connects_to_labels'))`);
    expect(cols.map((r) => `${r.t}.${r.c}`).sort()).toEqual(
      ['interchanges.connects_to_labels', 'toll_rates.sro_date', 'toll_rates.sro_link', 'toll_rates.sro_number']);
    expect((await one('SELECT COUNT(*) AS c FROM corridor_roads')).c).toBe(7);
    // MariaDB (production, CI) hands a JSON column back as text; MySQL parses it.
    const setting = async (k) => {
      const v = (await one('SELECT value FROM site_settings WHERE setting_key = ?', [k]))?.value;
      return typeof v === 'string' && /^[{["]/.test(v) ? JSON.parse(v) : v;
    };
    expect(await setting('contact.national_emergency_phone')).toBe('999');
    expect(await setting('corridor.road_code')).toBe('N105');
    for (const k of ['seo.site_title', 'seo.site_description']) {
      const v = await setting(k);
      expect(Object.keys(v).sort(), k).toEqual(['bn', 'en', 'zh']);
      expect(JSON.stringify(v), k).not.toMatch(/\d/);
    }
  });

  it('keeps no copy of a corridor length, open length or chainage in content (31, audit 6.18)', async () => {
    const rows = await all(`SELECT p.slug, b.type, t.locale, CONVERT(CAST(t.data AS CHAR) USING utf8mb4) COLLATE utf8mb4_unicode_ci AS d FROM block_translations t
      JOIN blocks b ON b.id = t.block_id JOIN pages p ON p.id = b.page_id
      UNION ALL SELECT p.slug, 'page', pt.locale, CONVERT(CONCAT_WS(' ', pt.title, pt.seo_title, pt.seo_description) USING utf8mb4) COLLATE utf8mb4_unicode_ci
      FROM page_translations pt JOIN pages p ON p.id = pt.page_id`);
    const FACT = /K\d+\+\d{2,3}|(18|48|47\.611|48\.07) ?(km|kilomet)|eighteen kilomet|forty-eight|[১৪]৮ ?(কিমি|কিলোমিটার)|আঠারো কিলো|(18|48) ?公里/i;
    const hits = rows.filter((r) => FACT.test(r.d)).map((r) => `${r.slug} ${r.type} ${r.locale}: ${r.d.match(FACT)[0]}`);
    expect(hits).toEqual([]);
    // Statistics that show a length read it from the records.
    const typed = rows.filter((r) => r.type === 'stat-row'
      && (JSON.parse(r.d).stats || []).some((st) => /^(km|কিমি|公里)$/.test(st.unit || '') && !st.source));
    expect(typed.map((r) => `${r.slug} ${r.locale}`)).toEqual([]);
  });

  it('publishes every page and every block in English, Bangla and Chinese (33, 34 — W3.25)', async () => {
    const blocks = await all(`SELECT p.slug, b.type FROM blocks b JOIN pages p ON p.id = b.page_id
      WHERE p.status = 'published'
        AND (SELECT COUNT(*) FROM block_translations t WHERE t.block_id = b.id AND t.status = 'published' AND t.locale IN ('en', 'bn', 'zh')) < 3`);
    expect(blocks.map((r) => `${r.slug} ${r.type}`)).toEqual([]);
    const pages = await all(`SELECT p.slug FROM pages p WHERE p.status = 'published'
        AND (SELECT COUNT(*) FROM page_translations pt WHERE pt.page_id = p.id AND pt.status = 'published' AND pt.locale IN ('en', 'bn', 'zh')) < 3`);
    expect(pages.map((r) => r.slug)).toEqual([]);
  });

  it('creates the W3, W4 and W5 pages, once each, with their live blocks (34)', async () => {
    for (const slug of ['about/concession', 'about/organisation', 'about/careers', 'about/integrity',
      'disclosures/right-to-information', 'disclosures/citizen-charter', 'disclosures/reports', 'disclosures/policies',
      'disclosures/environment', 'disclosures/consultations', 'project/standards', 'travel/vehicle-classes',
      'travel/payment', 'travel/advisories', 'travel/freight', 'travel/breakdown', 'travel/lost-found',
      'travel/toll-dispute', 'faq', 'downloads', 'media', 'press-releases', 'project/structures',
      'safety/education', 'search', 'sitemap']) {
      const r = await one('SELECT status FROM pages WHERE slug = ?', [slug]);
      expect(r?.status, slug).toBe('published');
    }
    const types = async (slug) => (await all(`SELECT b.type FROM blocks b JOIN pages p ON p.id = b.page_id WHERE p.slug = ? ORDER BY b.sort_order`, [slug])).map((r) => r.type);
    expect(await types('travel/advisories')).toContain('advisory-list');
    expect(await types('search')).toEqual(['page-header', 'site-search']);
    expect(await types('project/structures')).toContain('interchange-table');
    // The additions to existing pages land once, after a second import.
    const grs = await one(`SELECT COUNT(*) AS c FROM blocks b JOIN pages p ON p.id = b.page_id JOIN block_translations t ON t.block_id = b.id AND t.locale = 'en'
      WHERE p.slug = 'grievances' AND CAST(t.data AS CHAR) LIKE '%grs.gov.bd%'`);
    expect(grs.c).toBe(1);
  });

  it('creates the camera, alert and application records and their pages (35, 36)', async () => {
    const cameras = await all('SELECT is_sample, snapshot_url FROM cameras');
    expect(cameras).toHaveLength(4);
    expect(cameras.every((c) => Number(c.is_sample) === 1 && c.snapshot_url.startsWith('/photo/'))).toBe(true);
    for (const t of ['alert_subscribers', 'alert_broadcasts']) {
      expect((await one(`SELECT COUNT(*) AS c FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?`, [t])).c, t).toBe(1);
    }
    const kind = await one(`SELECT COLUMN_TYPE AS t FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'service_requests' AND COLUMN_NAME = 'kind'`);
    expect(String(kind.t)).toMatch(/fleet_account.*etc_tag.*loyalty/);
    for (const slug of ['travel/cameras', 'travel/alerts', 'travel/etc', 'travel/fleet', 'travel/frequent-traveller', 'gallery/videos', 'project/virtual-tour', 'about/recognition']) {
      expect((await one('SELECT status FROM pages WHERE slug = ?', [slug]))?.status, slug).toBe('published');
    }
    const pins = await one(`SELECT COUNT(*) AS c FROM blocks b JOIN pages p ON p.id = b.page_id WHERE p.slug = 'contact' AND b.type = 'map-pin-list'`);
    expect(pins.c).toBe(1);
  });

  it('keeps traffic history, seeds the weather thresholds and places the five blocks of 17 September (54, 55, 56)', async () => {
    const table = await one(`SELECT COUNT(*) AS c FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'traffic_history'`);
    expect(table.c).toBe(1);
    const thresholds = await all(`SELECT setting_key, CAST(value AS CHAR) AS v FROM site_settings WHERE setting_key LIKE 'weather.%' ORDER BY setting_key`);
    expect(thresholds.map((r) => `${r.setting_key}=${r.v}`)).toEqual([
      'weather.fog_visibility_m=1000', 'weather.heavy_rain_mm=7.5', 'weather.strong_wind_kmh=50',
    ]);
    const types = async (slug) => (await all(`SELECT b.type FROM blocks b JOIN pages p ON p.id = b.page_id WHERE p.slug = ? ORDER BY b.sort_order`, [slug])).map((r) => r.type);
    expect(await types('travel/locate')).toEqual(['section-subnav', 'page-header', 'km-finder', 'rich-text']);
    expect(await types('travel/weather')).toEqual(['section-subnav', 'page-header', 'corridor-weather', 'rich-text']);
    expect(await types('disclosures/open-data')).toEqual(['page-header', 'open-data', 'rich-text']);
    // Placed once each, directly after their anchor, and the scorecard before the closing band.
    const breakdown = await types('travel/breakdown');
    expect(breakdown.indexOf('km-finder')).toBe(breakdown.indexOf('emergency-strip') + 1);
    expect(breakdown.filter((t) => t === 'km-finder')).toHaveLength(1);
    const advisories = await types('travel/advisories');
    expect(advisories.indexOf('corridor-weather')).toBe(advisories.indexOf('advisory-list') + 1);
    expect((await types('travel/status')).filter((t) => t === 'travel-time-history')).toHaveLength(1);
    expect((await types('disclosures/reports')).filter((t) => t === 'travel-time-history')).toHaveLength(1);
    const concession = await types('about/concession');
    expect(concession.slice(-2)).toEqual(['concession-scorecard', 'cta-band']);
    // Menu entries labelled from the pages, once each.
    const items = await all(`SELECT m.slug AS menu, mi.href, JSON_UNQUOTE(JSON_EXTRACT(mi.labels, '$.bn')) AS bn
      FROM menu_items mi JOIN menus m ON m.id = mi.menu_id WHERE mi.href IN ('travel/locate', 'travel/weather', 'disclosures/open-data') ORDER BY m.slug, mi.href`);
    expect(items.map((r) => `${r.menu}:${r.href}`)).toEqual([
      'disclosures:disclosures/open-data', 'safety:travel/locate', 'safety:travel/weather', 'travel:travel/locate', 'travel:travel/weather',
    ]);
    expect(items.every((r) => r.bn && r.bn !== '')).toBe(true);
  });

  it('opens the home page with the hero, the progress figure and the live map (18, 48)', async () => {
    // 18 put the strip and the interchange table here; 48 replaced them with
    // the compact corridor map and gave the opening blocks a real order.
    const rows = await all(`SELECT b.type, b.sort_order FROM blocks b JOIN pages p ON p.id = b.page_id
      WHERE p.slug = 'home' ORDER BY b.sort_order, b.id`);
    const types = rows.map((r) => r.type);
    // 49: fares first, then the calculator; 51: the strip is back under the figure.
    expect(types.slice(0, 6)).toEqual(['hero', 'progress-bar', 'corridor-strip', 'corridor-map', 'toll-preview', 'toll-calculator']);
    expect(types).not.toContain('interchange-table');
    expect(types.filter((t) => t === 'progress-bar')).toHaveLength(1);
    expect(new Set(rows.map((r) => r.sort_order)).size).toBe(rows.length);
    const map = await one(`SELECT JSON_UNQUOTE(JSON_EXTRACT(bt.data, '$.layout')) AS layout FROM block_translations bt
      JOIN blocks b ON b.id = bt.block_id JOIN pages p ON p.id = b.page_id WHERE p.slug = 'home' AND b.type = 'corridor-map' AND bt.locale = 'en'`);
    expect(map.layout).toBe('compact');
  });

  it('put the grievance form on the grievances page and rewrote its cta-band (20)', async () => {
    const rows = await all(`SELECT b.type, b.sort_order FROM blocks b JOIN pages p ON p.id = b.page_id
      WHERE p.slug = 'grievances' ORDER BY b.sort_order, b.id`);
    // 34 adds the GRS escalation before the closing band.
    // 41 adds the status lookup before the closing band.
    expect(rows.map((r) => r.type)).toEqual(['hero', 'card-grid', 'rich-text', 'request-form', 'rich-text', 'request-status', 'cta-band']);
    const cta = await one(`SELECT JSON_UNQUOTE(JSON_EXTRACT(t.data, '$.body')) AS body
      FROM block_translations t JOIN blocks b ON b.id = t.block_id JOIN pages p ON p.id = b.page_id
      WHERE p.slug = 'grievances' AND b.type = 'cta-band' AND t.locale = 'en'`);
    expect(cta.body).not.toMatch(/Until the dedicated grievance channels/);
  });

  it('gives /travel a page of its own and removes the redirect 21 seeded (45)', async () => {
    // 21 sent /travel to /travel/status. 45 makes /travel the section's hub —
    // the first item in the primary navigation had no address of its own — so
    // the redirect must be gone or it would shadow the page.
    const rows = await all("SELECT source FROM redirects WHERE source LIKE '%/travel'");
    expect(rows).toEqual([]);
    const hub = await one("SELECT id, status FROM pages WHERE slug = 'travel'");
    expect(hub?.status).toBe('published');
    const titles = await all('SELECT locale FROM page_translations WHERE page_id = ? AND title <> ? ORDER BY locale', [hub.id, '']);
    expect(titles.map((r) => r.locale).sort()).toEqual(['bn', 'en', 'zh']);
    const blocks = await all('SELECT type FROM blocks WHERE page_id = ? ORDER BY sort_order', [hub.id]);
    // 46 puts the toll calculator between them and turns the index into cards.
    expect(blocks.map((b) => b.type)).toEqual(['page-header', 'toll-calculator', 'section-subnav']);
    const index = await one("SELECT JSON_UNQUOTE(JSON_EXTRACT(bt.data, '$.layout')) AS layout FROM block_translations bt JOIN blocks b ON b.id = bt.block_id WHERE b.page_id = ? AND b.type = 'section-subnav' AND bt.locale = 'en'", [hub.id]);
    expect(index.layout).toBe('cards');
  });

  it('gives every section a menu whose labels are the pages own titles (45)', async () => {
    const menus = await all('SELECT m.slug, COUNT(mi.id) AS n FROM menus m LEFT JOIN menu_items mi ON mi.menu_id = m.id GROUP BY m.slug ORDER BY m.slug');
    const counts = Object.fromEntries(menus.map((m) => [m.slug, Number(m.n)]));
    // 45's counts, plus 56's two travel pages (in travel and safety) and the open-data page.
    expect(counts).toMatchObject({ about: 6, project: 3, disclosures: 10, safety: 6, media: 6, travel: 16 });
    // Authored form: no leading slash, so one stored link serves all three languages.
    expect((await one("SELECT COUNT(*) AS c FROM menu_items WHERE href LIKE '/%'")).c).toBe(0);
    const item = await one("SELECT labels FROM menu_items WHERE href = 'disclosures/reports'");
    const labels = typeof item.labels === 'string' ? JSON.parse(item.labels) : item.labels;
    const page = await one("SELECT pt.title FROM page_translations pt JOIN pages p ON p.id = pt.page_id WHERE p.slug = 'disclosures/reports' AND pt.locale = 'bn'");
    expect(labels.bn).toBe(page.title);
    const subnavs = await all("SELECT p.slug FROM blocks b JOIN pages p ON p.id = b.page_id WHERE b.type = 'section-subnav' AND p.slug NOT LIKE 'travel/%' ORDER BY p.slug");
    expect(subnavs.map((r) => r.slug)).toEqual(['about', 'disclosures', 'media', 'project', 'safety', 'travel']);
  });

  it('shows 24 gallery images and the provisional O-D matrix', async () => {
    expect((await one('SELECT COUNT(*) AS c FROM media WHERE in_gallery = 1')).c).toBe(24);
    // 23: the four brand marks are in the library but never in the gallery,
    // and the home partner row carries three of them plus RHD as a partner.
    expect((await one("SELECT COUNT(*) AS c FROM media WHERE path LIKE '/brand/%' AND in_gallery = 0")).c).toBe(4);
    const partners = await one(`SELECT JSON_EXTRACT(t.data, '$.items[*].name') AS names, JSON_LENGTH(JSON_EXTRACT(t.data, '$.items[*].logo')) AS logos
      FROM block_translations t JOIN blocks b ON b.id = t.block_id JOIN pages p ON p.id = b.page_id
      WHERE p.slug = 'home' AND b.type = 'partner-row' AND t.locale = 'zh'`);
    expect(JSON.parse(JSON.stringify(partners.names))).toEqual(['SRBG', 'SEL', 'UDC', 'RHD']);
    expect(partners.logos).toBe(3);
    expect((await one('SELECT COUNT(*) AS c FROM toll_od_rates')).c).toBe(270);
    expect((await one('SELECT COUNT(*) AS c FROM service_requests')).c).toBe(0);
  });

  it('has every essential content page published, and every block a translation', async () => {
    for (const slug of ['home', 'contact', 'gallery', 'news', 'travel/status', 'travel/toll', 'travel/route',
      'travel/map', 'travel/facilities', 'travel/rules', 'privacy', 'terms', 'accessibility', 'grievances']) {
      const r = await one('SELECT status FROM pages WHERE slug = ?', [slug]);
      expect(r?.status, slug).toBe('published');
    }
    const orphan = await one(`SELECT COUNT(*) AS c FROM blocks b
      WHERE NOT EXISTS (SELECT 1 FROM block_translations t WHERE t.block_id = b.id AND t.locale = 'en')`);
    expect(orphan.c).toBe(0);
    const dangling = await one(`SELECT COUNT(*) AS c FROM blocks b WHERE NOT EXISTS (SELECT 1 FROM pages p WHERE p.id = b.page_id)`);
    expect(dangling.c).toBe(0);
  });
});
