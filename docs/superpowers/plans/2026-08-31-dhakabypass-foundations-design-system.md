# Dhaka Bypass Reinnovation — P0+P1: Foundations & Design System — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the trilingual, block-rendered, themed foundation of the new dhakabypass.com — locale routing, a block content model with English fallback, a role-aware admin that can create pages and edit blocks, a media pipeline, and the corridor/wayfinding design system — without touching the currently-live site.

**Architecture:** New routes live under `app/[locale]/` (`/en`, `/bn`, `/zh`). The existing `app/(site)/` tree stays untouched and keeps serving the live site, because no current slug collides with a locale code. Middleware is *not* changed to force locale redirects in this plan — that switch is flipped at cutover (P10). Content is stored as `pages` → `blocks` → `block_translations`, resolved through a pure fallback function, rendered by a registry-driven `BlockRenderer`. Public pages are statically generated and revalidated by tag when the admin saves.

**Tech Stack:** Next.js 15.2.3 (App Router), React 19, Tailwind CSS v4, `mysql2` (no ORM), Auth.js v5 (JWT sessions), Vitest (unit + DB integration), Playwright (e2e), self-hosted woff2 fonts.

## Global Constraints

- Node `>=18.18.0` locally; **Node 22** on the cPanel/Passenger server.
- `output: 'standalone'` in `next.config.mjs` — **must not be removed**. Build happens locally; artifacts are committed; server does `git pull` only. Never run `next build` or `npm install` on the shared host.
- Database access is `mysql2` via `lib/db.js` only. **No ORM, no Prisma** — the engine binary is fragile on CageFS.
- Locales are exactly `en`, `bn`, `zh`. `en` is the default and the fallback.
- **No machine translation** anywhere in the pipeline.
- **No external font/script/style CDNs.** All fonts self-hosted from `/public/fonts`.
- WCAG 2.2 AA: visible focus states, `prefers-reduced-motion` respected, status never communicated by colour alone, correct `lang` attributes per locale.
- Digits that align in columns use `font-variant-numeric: tabular-nums`.
- **Fully responsive, every device and viewport.** Layouts are fluid from **320px**
  to **2560px** with no fixed pixel widths on containers. The page body must never
  scroll horizontally at any width — wide content (tables, diagrams, code) scrolls
  inside its own `overflow-x: auto` container. Interactive targets are at least
  **44×44 CSS px**. Nothing is hidden purely because a viewport is "awkward".
- **Browser support matrix.** Must work on the last two versions of Chrome, Edge,
  Firefox and Safari, plus **iOS Safari 15.4+**, **Android Chrome**, and
  **Samsung Internet 19+** (a large share of Bangladeshi mobile traffic). CSS
  features newer than that baseline may be used only as **progressive enhancement**
  — never for anything load-bearing. Specifically **do not use `color-mix()`,
  `@container`, or `:has()` for layout or for colour that carries meaning**; an
  unsupported value is dropped silently and the declaration simply vanishes.
  `text-wrap: balance` and `scroll-behavior` are acceptable because they degrade
  to no-ops.
- **Authorization is two gates, always both.** `ADMIN_EMAILS` decides *whether* an
  identity gets in (re-derived from the environment on every request, so removing an
  email revokes access immediately). `can(role, action)` decides *what* they may do
  (resolved from the database at sign-in and carried on the JWT, so a role change
  takes effect at next sign-in). **Every admin entry point must check
  `session.user.isAdmin` AND `can(session.user.role, action)`** — never `can()` alone,
  or a revoked user keeps their stale role until the token expires. Binds Tasks 12,
  14, 15 and 16.
- Do not modify `app/(site)/`, `content/`, or `lib/content.js` — those serve the live site until cutover.
- Every task ends with a commit. Never use `--no-verify`.

### Recorded deviation from the spec

The spec lists **Noto Sans SC self-hosted**. A full Simplified Chinese face is 10MB+, which breaks the throttled-3G performance budget the same spec mandates. **Chinese therefore uses a system font stack** (`"PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Noto Sans SC", sans-serif`). Latin and Bengali are self-hosted. This is standard practice for CJK on the web. If a self-hosted Chinese face is later required, it must be delivered as unicode-range-chunked subsets, which is its own task.

---

## File Structure

**Created**

| Path | Responsibility |
|---|---|
| `vitest.config.mjs` | Unit + DB integration test config |
| `playwright.config.mjs` | E2E config |
| `tests/unit/*.test.js` | Pure-function tests |
| `tests/db/*.test.js` | Tests that hit `dhakabypass_test` |
| `tests/e2e/*.spec.js` | Browser tests |
| `lib/i18n/locales.js` | Locale constants and path helpers (pure) |
| `lib/i18n/ui.js` | Chrome strings not held in the CMS |
| `lib/content/resolve.js` | Block/page translation fallback (pure) |
| `lib/content/pages.js` | Page + block queries and mutations (DB, no next/cache) |
| `lib/content/cache.js` | Tag-cached wrappers around the page queries |
| `lib/content/slug.js` | Slug normalisation and validation (pure) |
| `lib/blocks/form.js` | Block form parsing (pure) |
| `scripts/seed-home.mjs` | Seeds a minimal home page (raw SQL, like the other scripts) |
| `lib/blocks/registry.js` | Block type registry + field validator |
| `lib/blocks/types/rich-text.js` | RichText block definition |
| `lib/blocks/types/stat-row.js` | StatRow block definition |
| `lib/blocks/index.js` | Registers all block types once |
| `lib/auth/roles.js` | Role constants + permission checks (pure) |
| `lib/media.js` | Upload handling and variant generation |
| `lib/revalidate.js` | Cache tag names + revalidation helpers |
| `lib/theme.js` | Theme constants shared by script and toggle |
| `components/blocks/BlockRenderer.jsx` | Maps block rows to components |
| `components/blocks/RichTextBlock.jsx` | RichText renderer |
| `components/blocks/StatRowBlock.jsx` | StatRow renderer |
| `components/chrome/SiteHeaderV2.jsx` | New header: nav, locale switch, theme switch |
| `components/chrome/SiteFooterV2.jsx` | New footer |
| `components/chrome/LocaleSwitch.jsx` | Locale switcher (client) |
| `components/chrome/ThemeToggle.jsx` | Light/Dark/System toggle (client) |
| `components/chrome/ThemeScript.jsx` | Pre-paint theme stamp, no flash |
| `app/[locale]/layout.jsx` | Locale layout: `lang`, chrome, fonts |
| `app/[locale]/page.jsx` | Locale home, rendered from blocks |
| `app/[locale]/[...slug]/page.jsx` | Any CMS page, rendered from blocks |
| `app/design-tokens.css` | The corridor/wayfinding token layer |
| `public/fonts/*.woff2` | Self-hosted Latin + Bengali faces |
| `scripts/db-setup-v2.mjs` | Creates the new structural tables |
| `scripts/migrate-users.mjs` | `admin_users` → `users` with roles |
| `app/admin/(dash)/pages-v2/**` | Page tree + block editor + translation dashboard |

**Modified**

| Path | Change |
|---|---|
| `package.json` | Test scripts + devDependencies |
| `auth.js` | Read role from `users`; expose it on the session |
| `app/globals.css` | Import `design-tokens.css` |
| `.gitignore` | Test artifacts, uploads dir |

**Untouched (serving the live site):** `app/(site)/`, `content/`, `lib/content.js`, `lib/admin-sections.js`, `components/SiteHeader.jsx`, `components/SiteFooter.jsx`, `middleware.js`.

---

## Task 1: Test infrastructure

**Files:**
- Create: `vitest.config.mjs`, `playwright.config.mjs`, `tests/unit/smoke.test.js`
- Modify: `package.json`, `.gitignore`

**Interfaces:**
- Consumes: nothing.
- Produces: `npm test` (Vitest, unit + db), `npm run test:e2e` (Playwright). Test DB name is `dhakabypass_test`, read from `DB_NAME_TEST`.

- [ ] **Step 1: Install dev dependencies**

```bash
npm install -D vitest@^3 @vitest/coverage-v8@^3 @playwright/test@^1.50 dotenv@^16
npx playwright install chromium
```

- [ ] **Step 2: Write `vitest.config.mjs`**

```js
import { defineConfig } from 'vitest/config';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
// DB-touching tests run against a throwaway database, never the dev one.
process.env.DB_NAME_TEST = process.env.DB_NAME_TEST || 'dhakabypass_test';

export default defineConfig({
  test: {
    include: ['tests/unit/**/*.test.js', 'tests/db/**/*.test.js'],
    environment: 'node',
    globals: false,
    testTimeout: 15000,
  },
});
```

- [ ] **Step 3: Write `playwright.config.mjs`**

```js
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 30000,
  fullyParallel: true,
  use: { baseURL: 'http://localhost:3000', trace: 'on-first-retry' },
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: true,
    timeout: 120000,
  },
});
```

- [ ] **Step 4: Write the failing smoke test**

```js
// tests/unit/smoke.test.js
import { describe, it, expect } from 'vitest';

describe('test harness', () => {
  it('runs', () => {
    expect(1 + 1).toBe(2);
  });
});
```

- [ ] **Step 5: Add scripts to `package.json`**

Add to the `"scripts"` object:

```json
"test": "vitest run",
"test:watch": "vitest",
"test:e2e": "playwright test",
"db:setup:v2": "node scripts/db-setup-v2.mjs"
```

- [ ] **Step 6: Add test artifacts to `.gitignore`**

Append:

```
# test artifacts
test-results/
playwright-report/
coverage/
```

- [ ] **Step 7: Run the tests**

Run: `npm test`
Expected: PASS, 1 test.

- [ ] **Step 8: Commit**

```bash
git add vitest.config.mjs playwright.config.mjs tests/unit/smoke.test.js package.json package-lock.json .gitignore
git commit -m "test: add Vitest and Playwright harnesses"
```

---

## Task 2: Locale module

**Files:**
- Create: `lib/i18n/locales.js`, `tests/unit/locales.test.js`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `LOCALES: readonly ['en','bn','zh']`
  - `DEFAULT_LOCALE: 'en'`
  - `LOCALE_LABELS: Record<string,string>` — native names for the switcher
  - `LOCALE_HTML_LANG: Record<string,string>` — `en`, `bn`, `zh-Hans`
  - `isLocale(value): boolean`
  - `localeFromPath(pathname): string | null`
  - `stripLocale(pathname): string` — always returns a path starting `/`
  - `withLocale(pathname, locale): string`

- [ ] **Step 1: Write the failing test**

```js
// tests/unit/locales.test.js
import { describe, it, expect } from 'vitest';
import {
  LOCALES, DEFAULT_LOCALE, LOCALE_HTML_LANG,
  isLocale, localeFromPath, stripLocale, withLocale,
} from '../../lib/i18n/locales.js';

describe('locales', () => {
  it('exposes exactly the three project locales', () => {
    expect(LOCALES).toEqual(['en', 'bn', 'zh']);
    expect(DEFAULT_LOCALE).toBe('en');
  });

  it('maps zh to a script-qualified html lang', () => {
    expect(LOCALE_HTML_LANG.zh).toBe('zh-Hans');
    expect(LOCALE_HTML_LANG.bn).toBe('bn');
  });

  it('recognises only known locales', () => {
    expect(isLocale('bn')).toBe(true);
    expect(isLocale('fr')).toBe(false);
    expect(isLocale('')).toBe(false);
    expect(isLocale(undefined)).toBe(false);
  });

  it('reads the locale off a path', () => {
    expect(localeFromPath('/bn/travel/toll')).toBe('bn');
    expect(localeFromPath('/en')).toBe('en');
    expect(localeFromPath('/project')).toBe(null);
    expect(localeFromPath('/')).toBe(null);
  });

  it('strips the locale segment', () => {
    expect(stripLocale('/bn/travel/toll')).toBe('/travel/toll');
    expect(stripLocale('/en')).toBe('/');
    expect(stripLocale('/project')).toBe('/project');
  });

  it('rewrites a path onto another locale', () => {
    expect(withLocale('/bn/travel/toll', 'zh')).toBe('/zh/travel/toll');
    expect(withLocale('/travel/toll', 'en')).toBe('/en/travel/toll');
    expect(withLocale('/', 'bn')).toBe('/bn');
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run tests/unit/locales.test.js`
Expected: FAIL — cannot resolve `lib/i18n/locales.js`.

- [ ] **Step 3: Write the implementation**

```js
// lib/i18n/locales.js
/** The project's three locales. `en` is both default and fallback. */
export const LOCALES = ['en', 'bn', 'zh'];
export const DEFAULT_LOCALE = 'en';

/** Native names, for the switcher — never translate these. */
export const LOCALE_LABELS = { en: 'English', bn: 'বাংলা', zh: '中文' };

/** Values for the html lang attribute. zh is script-qualified for screen readers. */
export const LOCALE_HTML_LANG = { en: 'en', bn: 'bn', zh: 'zh-Hans' };

export function isLocale(value) {
  return LOCALES.includes(value);
}

export function localeFromPath(pathname) {
  const first = String(pathname || '').split('/')[1];
  return isLocale(first) ? first : null;
}

export function stripLocale(pathname) {
  const locale = localeFromPath(pathname);
  if (!locale) return pathname || '/';
  const rest = pathname.slice(locale.length + 1);
  return rest === '' ? '/' : rest;
}

export function withLocale(pathname, locale) {
  const rest = stripLocale(pathname);
  return rest === '/' ? `/${locale}` : `/${locale}${rest}`;
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run tests/unit/locales.test.js`
Expected: PASS, 6 tests.

- [ ] **Step 5: Commit**

```bash
git add lib/i18n/locales.js tests/unit/locales.test.js
git commit -m "feat(i18n): add locale constants and path helpers"
```

---

## Task 3: Structural database schema

**Files:**
- Create: `scripts/db-setup-v2.mjs`, `tests/db/schema.test.js`

**Interfaces:**
- Consumes: `scripts/load-env.mjs` → `loadEnv()`.
- Produces: tables `pages`, `page_translations`, `blocks`, `block_translations`, `media`, `menus`, `menu_items`, `revisions`, `audit_log`, `redirects`, `users`. `node scripts/db-setup-v2.mjs` is idempotent and accepts `--database=<name>`.

- [ ] **Step 1: Write the failing test**

```js
// tests/db/schema.test.js
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import mysql from 'mysql2/promise';
import { execFileSync } from 'node:child_process';

const DB = process.env.DB_NAME_TEST;
let conn;

beforeAll(async () => {
  execFileSync('node', ['scripts/db-setup-v2.mjs', `--database=${DB}`], { stdio: 'inherit' });
  conn = await mysql.createConnection({
    host: process.env.DB_HOST, port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER, password: process.env.DB_PASSWORD || '', database: DB,
  });
});
afterAll(async () => { if (conn) await conn.end(); });

async function columns(table) {
  const [rows] = await conn.query(
    'SELECT COLUMN_NAME AS c FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=? AND TABLE_NAME=?',
    [DB, table]
  );
  return rows.map((r) => r.c);
}

describe('structural schema', () => {
  it('creates every structural table', async () => {
    const [rows] = await conn.query(
      'SELECT TABLE_NAME AS t FROM information_schema.TABLES WHERE TABLE_SCHEMA=?', [DB]
    );
    const tables = rows.map((r) => r.t);
    for (const t of ['pages','page_translations','blocks','block_translations',
                     'media','menus','menu_items','revisions','audit_log','redirects','users']) {
      expect(tables, `missing ${t}`).toContain(t);
    }
  });

  it('scopes block content by locale with a publication status', async () => {
    const cols = await columns('block_translations');
    expect(cols).toEqual(expect.arrayContaining(['block_id','locale','data','status','updated_by','updated_at']));
  });

  it('gives users a role', async () => {
    expect(await columns('users')).toEqual(expect.arrayContaining(['email','role','password_hash']));
  });

  it('is safe to run twice', () => {
    execFileSync('node', ['scripts/db-setup-v2.mjs', `--database=${DB}`], { stdio: 'inherit' });
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run tests/db/schema.test.js`
Expected: FAIL — `scripts/db-setup-v2.mjs` does not exist.

- [ ] **Step 3: Write the implementation**

```js
// scripts/db-setup-v2.mjs
/**
 * Creates the structural tables for the reinnovation. Idempotent.
 *   node scripts/db-setup-v2.mjs [--database=name]
 * Leaves the legacy tables (content, news_updates, …) untouched — the live
 * site still reads them until cutover.
 */
import mysql from 'mysql2/promise';
import { loadEnv } from './load-env.mjs';

loadEnv();

const arg = process.argv.find((a) => a.startsWith('--database='));
const DB_NAME = arg ? arg.split('=')[1] : process.env.DB_NAME || 'dhakabypass';
const { DB_HOST = '127.0.0.1', DB_PORT = '3306', DB_USER = 'root', DB_PASSWORD = '' } = process.env;

const base = { host: DB_HOST, port: Number(DB_PORT), user: DB_USER, password: DB_PASSWORD, multipleStatements: true };

const server = await mysql.createConnection(base);
await server.query(
  `CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
);
await server.end();

const db = await mysql.createConnection({ ...base, database: DB_NAME });

await db.query(`
  CREATE TABLE IF NOT EXISTS users (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    email         VARCHAR(191) NOT NULL UNIQUE,
    name          VARCHAR(191) NOT NULL DEFAULT '',
    password_hash VARCHAR(255) NULL,
    role          ENUM('admin','editor','translator') NOT NULL DEFAULT 'editor',
    created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

  CREATE TABLE IF NOT EXISTS pages (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    slug         VARCHAR(191) NOT NULL UNIQUE,
    parent_id    INT NULL,
    template     VARCHAR(64) NOT NULL DEFAULT 'default',
    nav_order    INT NOT NULL DEFAULT 0,
    status       ENUM('draft','published') NOT NULL DEFAULT 'draft',
    published_at TIMESTAMP NULL,
    created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_parent (parent_id),
    INDEX idx_status (status)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

  CREATE TABLE IF NOT EXISTS page_translations (
    page_id         INT NOT NULL,
    locale          ENUM('en','bn','zh') NOT NULL,
    title           VARCHAR(255) NOT NULL DEFAULT '',
    seo_title       VARCHAR(255) NOT NULL DEFAULT '',
    seo_description VARCHAR(500) NOT NULL DEFAULT '',
    og_image        VARCHAR(255) NOT NULL DEFAULT '',
    status          ENUM('missing','draft','published') NOT NULL DEFAULT 'missing',
    updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (page_id, locale),
    CONSTRAINT fk_pt_page FOREIGN KEY (page_id) REFERENCES pages(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

  CREATE TABLE IF NOT EXISTS blocks (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    page_id    INT NOT NULL,
    type       VARCHAR(64) NOT NULL,
    sort_order INT NOT NULL DEFAULT 0,
    settings   JSON NULL,
    status     ENUM('draft','published') NOT NULL DEFAULT 'published',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_page_sort (page_id, sort_order),
    CONSTRAINT fk_blocks_page FOREIGN KEY (page_id) REFERENCES pages(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

  CREATE TABLE IF NOT EXISTS block_translations (
    block_id   INT NOT NULL,
    locale     ENUM('en','bn','zh') NOT NULL,
    data       JSON NOT NULL,
    status     ENUM('missing','draft','published') NOT NULL DEFAULT 'missing',
    updated_by INT NULL,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (block_id, locale),
    CONSTRAINT fk_bt_block FOREIGN KEY (block_id) REFERENCES blocks(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

  CREATE TABLE IF NOT EXISTS media (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    path        VARCHAR(255) NOT NULL UNIQUE,
    width       INT NOT NULL DEFAULT 0,
    height      INT NOT NULL DEFAULT 0,
    bytes       INT NOT NULL DEFAULT 0,
    mime        VARCHAR(100) NOT NULL DEFAULT '',
    focal_x     DECIMAL(4,3) NOT NULL DEFAULT 0.500,
    focal_y     DECIMAL(4,3) NOT NULL DEFAULT 0.500,
    alt         JSON NULL,
    created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

  CREATE TABLE IF NOT EXISTS menus (
    id   INT AUTO_INCREMENT PRIMARY KEY,
    slug VARCHAR(64) NOT NULL UNIQUE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

  CREATE TABLE IF NOT EXISTS menu_items (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    menu_id    INT NOT NULL,
    parent_id  INT NULL,
    href       VARCHAR(255) NOT NULL DEFAULT '',
    labels     JSON NOT NULL,
    sort_order INT NOT NULL DEFAULT 0,
    INDEX idx_menu_sort (menu_id, sort_order),
    CONSTRAINT fk_mi_menu FOREIGN KEY (menu_id) REFERENCES menus(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

  CREATE TABLE IF NOT EXISTS revisions (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    entity_type VARCHAR(32) NOT NULL,
    entity_id   INT NOT NULL,
    snapshot    JSON NOT NULL,
    created_by  INT NULL,
    created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_entity (entity_type, entity_id, created_at)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

  CREATE TABLE IF NOT EXISTS audit_log (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    actor      VARCHAR(191) NOT NULL DEFAULT '',
    action     VARCHAR(64) NOT NULL,
    target     VARCHAR(191) NOT NULL DEFAULT '',
    detail     JSON NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_created (created_at)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

  CREATE TABLE IF NOT EXISTS redirects (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    source      VARCHAR(255) NOT NULL UNIQUE,
    destination VARCHAR(255) NOT NULL,
    status_code SMALLINT NOT NULL DEFAULT 301,
    created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
`);

console.log(`Structural schema ready on ${DB_NAME}`);
await db.end();
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run tests/db/schema.test.js`
Expected: PASS, 4 tests.

- [ ] **Step 5: Commit**

```bash
git add scripts/db-setup-v2.mjs tests/db/schema.test.js
git commit -m "feat(db): add structural schema for pages, blocks and translations"
```

---

## Task 4: Roles and the users table

**Files:**
- Create: `lib/auth/roles.js`, `lib/auth/resolve-role.js`, `scripts/migrate-users.mjs`, `tests/unit/roles.test.js`, `tests/unit/auth-role.test.js`
- Modify: `auth.js`, `package.json`

**Interfaces:**
- Consumes: `lib/db.js` → `query`, `dbEnabled`; `lib/auth/roles.js`.
- Produces:
  - `ROLES = { ADMIN:'admin', EDITOR:'editor', TRANSLATOR:'translator' }`
  - `PERMISSIONS` and `can(role, action): boolean` where action ∈ `'manage_users' | 'manage_pages' | 'edit_blocks' | 'translate' | 'publish' | 'manage_media'`
  - `lib/auth/resolve-role.js` → `resolveUserRole(email): Promise<string|null>`
  - `auth.js` session gains `session.user.role` (may be `undefined` — that is correct and denies).

**Security design — read before implementing.** An earlier draft of this task
inferred the role from `isAdmin`, which meant every Google sign-in resolved to
`admin` regardless of the user's stored role, because `signIn` has already rejected
everyone not on the allowlist. That is a privilege escalation. The role must be read
**from the database, for every provider**, and must **fail closed** when no row
exists — never fall back to a default role.

- [ ] **Step 1: Write the failing test**

```js
// tests/unit/roles.test.js
import { describe, it, expect } from 'vitest';
import { ROLES, can } from '../../lib/auth/roles.js';

describe('roles', () => {
  it('lets an admin do everything', () => {
    for (const a of ['manage_users','manage_pages','edit_blocks','translate','publish','manage_media']) {
      expect(can(ROLES.ADMIN, a), a).toBe(true);
    }
  });

  it('stops an editor managing users', () => {
    expect(can(ROLES.EDITOR, 'manage_users')).toBe(false);
    expect(can(ROLES.EDITOR, 'manage_pages')).toBe(true);
    expect(can(ROLES.EDITOR, 'publish')).toBe(true);
  });

  it('limits a translator to translating', () => {
    expect(can(ROLES.TRANSLATOR, 'translate')).toBe(true);
    expect(can(ROLES.TRANSLATOR, 'manage_pages')).toBe(false);
    expect(can(ROLES.TRANSLATOR, 'edit_blocks')).toBe(false);
    expect(can(ROLES.TRANSLATOR, 'publish')).toBe(false);
  });

  it('grants an editor everything except user management', () => {
    expect(can(ROLES.EDITOR, 'translate')).toBe(true);
    expect(can(ROLES.EDITOR, 'manage_media')).toBe(true);
  });

  it('denies a translator media and user management', () => {
    expect(can(ROLES.TRANSLATOR, 'manage_media')).toBe(false);
    expect(can(ROLES.TRANSLATOR, 'manage_users')).toBe(false);
  });

  it('fails closed on unknown roles and actions', () => {
    expect(can('superuser', 'publish')).toBe(false);
    expect(can(ROLES.ADMIN, 'launch_missiles')).toBe(false);
    expect(can(undefined, 'translate')).toBe(false);
    expect(can(null, 'translate')).toBe(false);
    expect(can(ROLES.ADMIN, undefined)).toBe(false);
  });

  it('denies prototype keys instead of throwing', () => {
    expect(can('constructor', 'publish')).toBe(false);
    expect(can('toString', 'publish')).toBe(false);
    expect(can('__proto__', 'publish')).toBe(false);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run tests/unit/roles.test.js`
Expected: FAIL — cannot resolve `lib/auth/roles.js`.

- [ ] **Step 3: Write the roles module**

```js
// lib/auth/roles.js
export const ROLES = { ADMIN: 'admin', EDITOR: 'editor', TRANSLATOR: 'translator' };

/** Explicit grants only. Anything not listed is denied — this fails closed. */
export const PERMISSIONS = {
  [ROLES.ADMIN]: ['manage_users', 'manage_pages', 'edit_blocks', 'translate', 'publish', 'manage_media'],
  [ROLES.EDITOR]: ['manage_pages', 'edit_blocks', 'translate', 'publish', 'manage_media'],
  [ROLES.TRANSLATOR]: ['translate'],
};

export function can(role, action) {
  // Object.hasOwn, not a plain lookup: `can('constructor', …)` would otherwise
  // resolve up the prototype chain and throw instead of denying.
  if (!Object.hasOwn(PERMISSIONS, role)) return false;
  return PERMISSIONS[role].includes(action);
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run tests/unit/roles.test.js`
Expected: PASS, 7 tests.

- [ ] **Step 5: Write the user migration script**

```js
// scripts/migrate-users.mjs
/**
 * Copies admin_users into users, giving every existing account the admin role.
 *
 * Re-running INSERTS NOTHING AND UPDATES NOTHING for accounts that already exist.
 * This matters: admin_users is a frozen legacy table, so once a password is changed
 * through the new system the two diverge — an upsert that copied password_hash back
 * would silently revert that credential.
 *   node scripts/migrate-users.mjs [--database=name]
 */
import mysql from 'mysql2/promise';
import { loadEnv } from './load-env.mjs';

loadEnv();
const arg = process.argv.find((a) => a.startsWith('--database='));
const DB_NAME = arg ? arg.split('=')[1] : process.env.DB_NAME || 'dhakabypass';

const db = await mysql.createConnection({
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: DB_NAME,
});

const [legacy] = await db.query(
  "SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA=? AND TABLE_NAME='admin_users'",
  [DB_NAME]
);

try {
  if (legacy.length === 0) {
    console.log('No admin_users table — nothing to migrate.');
  } else {
    const [before] = await db.query('SELECT COUNT(*) AS n FROM users');
    await db.query(`
      INSERT INTO users (email, name, password_hash, role)
      SELECT email, name, password_hash, 'admin' FROM admin_users
      ON DUPLICATE KEY UPDATE email = email
    `);
    const [after] = await db.query('SELECT COUNT(*) AS n FROM users');
    const added = after[0].n - before[0].n;
    // affectedRows counts MATCHED rows under mysql2's default FOUND_ROWS flag,
    // so it would claim work on a run that inserted nothing. Count rows instead.
    console.log(`Inserted ${added} new user(s); ${after[0].n} total. Existing rows untouched.`);
  }
} catch (err) {
  console.error('Migration failed:', err.message);
  process.exitCode = 1;
} finally {
  await db.end();
}
```

- [ ] **Step 6: Write the role resolver**

This lives in its own module for two reasons: `auth.js` cannot be imported cleanly
under Vitest, and the role lookup is the piece that most needs a test.

```js
// lib/auth/resolve-role.js
import { query, dbEnabled } from '../db';

/**
 * The role for a signed-in email, or null when there is no row.
 * Null is the correct answer for an unknown user — `can(null, …)` denies.
 * Never invent a default role here: doing so is how an OAuth sign-in silently
 * became an admin in an earlier draft.
 */
export async function resolveUserRole(email) {
  if (!email || !dbEnabled()) return null;
  const rows = await query('SELECT role FROM users WHERE email = ? LIMIT 1', [
    String(email).toLowerCase(),
  ]);
  return rows?.[0]?.role ?? null;
}
```

- [ ] **Step 7: Point `auth.js` at `users` and expose the role**

In `auth.js`, replace the `authorize` query and add role handling.

Replace this line:

```js
      const rows = await query(
        'SELECT id, email, name, password_hash FROM admin_users WHERE email = ? LIMIT 1',
        [email]
      );
```

with:

```js
      const rows = await query(
        'SELECT id, email, name, password_hash, role FROM users WHERE email = ? LIMIT 1',
        [email]
      );
```

Replace this line:

```js
      return { id: String(user.id), email: user.email, name: user.name || user.email };
```

with:

```js
      return {
        id: String(user.id),
        email: user.email,
        name: user.name || user.email,
        role: user.role || ROLES.EDITOR,
      };
```

Replace the `jwt` and `session` callbacks with:

```js
    async jwt({ token, user }) {
      // Re-derived every request, so removing an email from ADMIN_EMAILS revokes
      // access immediately. This is the fast revocation path.
      token.isAdmin = isAllowedAdmin(token.email);

      // `user` is present only at sign-in. Resolve the role from the database for
      // EVERY provider — Google's user object carries no role, and inferring one
      // from isAdmin would hand admin to anyone who can sign in at all.
      if (user) {
        token.role = user.role ?? (await resolveUserRole(user.email)) ?? undefined;
      }
      // No fallback role. An identity with no users row gets no role, and
      // can(undefined, …) denies. The role is not re-queried per request (that
      // would be a DB hit on every page view); a role change takes effect at the
      // user's next sign-in, while isAdmin above handles immediate revocation.
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.isAdmin = Boolean(token.isAdmin);
        session.user.role = token.role;
      }
      return session;
    },
```

Add to the imports at the top of `auth.js`:

```js
import { ROLES } from './lib/auth/roles';
import { resolveUserRole } from './lib/auth/resolve-role';
```

- [ ] **Step 8: Add the migration npm script**

In `package.json`, beside the existing `db:setup:v2`, add:

```json
"db:migrate:users": "node scripts/migrate-users.mjs"
```

**Deploy ordering (carry this into P10):** the credentials provider now reads
`users`. Both `npm run db:setup:v2` and `npm run db:migrate:users` must run against
the production database **before** this code is served, or password login fails
closed and the admin is locked out.

- [ ] **Step 9: Test the role resolver**

```js
// tests/unit/auth-role.test.js
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../lib/db', () => ({
  dbEnabled: () => true,
  query: vi.fn(),
}));

const { query } = await import('../../lib/db');
const { resolveUserRole } = await import('../../lib/auth/resolve-role.js');

beforeEach(() => query.mockReset());

describe('resolveUserRole', () => {
  it('returns the stored role', async () => {
    query.mockResolvedValue([{ role: 'translator' }]);
    expect(await resolveUserRole('t@example.com')).toBe('translator');
  });

  it('returns null when the user has no row — it must not invent a role', async () => {
    query.mockResolvedValue([]);
    expect(await resolveUserRole('ghost@example.com')).toBe(null);
  });

  it('returns null for a missing email without querying', async () => {
    expect(await resolveUserRole('')).toBe(null);
    expect(query).not.toHaveBeenCalled();
  });

  it('looks the email up case-insensitively', async () => {
    query.mockResolvedValue([{ role: 'admin' }]);
    await resolveUserRole('Mixed@Example.COM');
    expect(query.mock.calls[0][1]).toEqual(['mixed@example.com']);
  });
});
```

- [ ] **Step 10: Run the migration twice and the full suite**

Run:
```bash
npm run db:setup:v2
npm run db:migrate:users
npm run db:migrate:users
npm test
npm run build
```
Expected: the first migration reports the inserted count; **the second reports
`Inserted 0 new user(s)`** and leaves every existing row byte-identical. All tests
PASS. The build must succeed — that is what proves `auth.js` still resolves.

- [ ] **Step 11: Commit**

```bash
git add lib/auth scripts/migrate-users.mjs package.json tests/unit/roles.test.js tests/unit/auth-role.test.js auth.js
git commit -m "feat(auth): add roles and migrate admin_users into users"
```

---

## Task 5: Translation fallback resolution

**Files:**
- Create: `lib/content/resolve.js`, `tests/unit/resolve.test.js`

**Interfaces:**
- Consumes: `lib/i18n/locales.js` → `DEFAULT_LOCALE`.
- Produces:
  - `resolveTranslation(rows, locale): { data, locale, fallback } | null` — `rows` is `[{ locale, data, status }]`. Returns the requested locale's row if `status === 'published'`; otherwise the `en` row if published; otherwise `null`. `fallback` is `true` when the returned locale differs from the requested one.
  - `translationStatus(rows, locale): 'missing' | 'draft' | 'published'`
  - `countMissing(rowsByBlock, locale): number`

This is the single most important pure function in the system: it is what stops a half-translated page from being a broken page.

- [ ] **Step 1: Write the failing test**

```js
// tests/unit/resolve.test.js
import { describe, it, expect } from 'vitest';
import { resolveTranslation, translationStatus, countMissing } from '../../lib/content/resolve.js';

const en = { locale: 'en', data: { text: 'English' }, status: 'published' };
const bnDraft = { locale: 'bn', data: { text: 'খসড়া' }, status: 'draft' };
const bnLive = { locale: 'bn', data: { text: 'বাংলা' }, status: 'published' };

describe('resolveTranslation', () => {
  it('returns the requested locale when it is published', () => {
    const r = resolveTranslation([en, bnLive], 'bn');
    expect(r.data.text).toBe('বাংলা');
    expect(r.locale).toBe('bn');
    expect(r.fallback).toBe(false);
  });

  it('falls back to English when the locale is only a draft', () => {
    const r = resolveTranslation([en, bnDraft], 'bn');
    expect(r.data.text).toBe('English');
    expect(r.locale).toBe('en');
    expect(r.fallback).toBe(true);
  });

  it('falls back to English when the locale is absent', () => {
    const r = resolveTranslation([en], 'zh');
    expect(r.fallback).toBe(true);
    expect(r.data.text).toBe('English');
  });

  it('never marks English as a fallback of itself', () => {
    expect(resolveTranslation([en], 'en').fallback).toBe(false);
  });

  it('returns null when even English is unpublished', () => {
    expect(resolveTranslation([{ ...en, status: 'draft' }], 'bn')).toBe(null);
    expect(resolveTranslation([], 'en')).toBe(null);
  });
});

describe('translationStatus', () => {
  it('reports the status of one locale', () => {
    expect(translationStatus([en, bnDraft], 'bn')).toBe('draft');
    expect(translationStatus([en, bnLive], 'bn')).toBe('published');
    expect(translationStatus([en], 'zh')).toBe('missing');
  });
});

describe('countMissing', () => {
  it('counts blocks not yet published in a locale', () => {
    expect(countMissing([[en, bnLive], [en], [en, bnDraft]], 'bn')).toBe(2);
    expect(countMissing([[en, bnLive], [en]], 'en')).toBe(0);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run tests/unit/resolve.test.js`
Expected: FAIL — cannot resolve `lib/content/resolve.js`.

- [ ] **Step 3: Write the implementation**

```js
// lib/content/resolve.js
import { DEFAULT_LOCALE } from '../i18n/locales.js';

function published(rows, locale) {
  return (rows || []).find((r) => r.locale === locale && r.status === 'published') || null;
}

/**
 * Pick the content to render for `locale`, falling back to English.
 * Returns null when nothing is publishable — the caller must skip the block
 * rather than render an empty one.
 */
export function resolveTranslation(rows, locale) {
  const exact = published(rows, locale);
  if (exact) return { data: exact.data, locale, fallback: false };

  const base = published(rows, DEFAULT_LOCALE);
  if (base) return { data: base.data, locale: DEFAULT_LOCALE, fallback: locale !== DEFAULT_LOCALE };

  return null;
}

export function translationStatus(rows, locale) {
  const row = (rows || []).find((r) => r.locale === locale);
  return row ? row.status : 'missing';
}

/** How many blocks still need work in `locale`. Drives the admin dashboard. */
export function countMissing(rowsByBlock, locale) {
  return (rowsByBlock || []).reduce(
    (n, rows) => (translationStatus(rows, locale) === 'published' ? n : n + 1),
    0
  );
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run tests/unit/resolve.test.js`
Expected: PASS, 7 tests.

- [ ] **Step 5: Commit**

```bash
git add lib/content/resolve.js tests/unit/resolve.test.js
git commit -m "feat(content): resolve block translations with English fallback"
```

---

## Task 6: Block registry and validator

**Files:**
- Create: `lib/blocks/registry.js`, `tests/unit/registry.test.js`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - Block definition shape: `{ type, label, fields, Component }` where each field is `{ name, type, label, required?, default? }` and `type` ∈ `'text' | 'richtext' | 'image' | 'number' | 'list'`.
  - `registerBlock(def): void` — throws on a duplicate type or a malformed definition
  - `getBlock(type): def | null`
  - `allBlocks(): def[]`
  - `validateBlockData(type, data): { ok: boolean, errors: string[] }`
  - `defaultBlockData(type): object`
  - `resetRegistry(): void` — tests only

- [ ] **Step 1: Write the failing test**

```js
// tests/unit/registry.test.js
import { describe, it, expect, beforeEach } from 'vitest';
import {
  registerBlock, getBlock, allBlocks, validateBlockData, defaultBlockData, resetRegistry,
} from '../../lib/blocks/registry.js';

const Demo = {
  type: 'demo',
  label: 'Demo',
  fields: [
    { name: 'heading', type: 'text', label: 'Heading', required: true },
    { name: 'count', type: 'number', label: 'Count', default: 0 },
    { name: 'items', type: 'list', label: 'Items', default: [] },
  ],
  Component: () => null,
};

beforeEach(() => resetRegistry());

describe('registry', () => {
  it('registers and retrieves a block type', () => {
    registerBlock(Demo);
    expect(getBlock('demo').label).toBe('Demo');
    expect(allBlocks()).toHaveLength(1);
  });

  it('returns null for an unknown type', () => {
    expect(getBlock('nope')).toBe(null);
  });

  it('rejects a duplicate type', () => {
    registerBlock(Demo);
    expect(() => registerBlock(Demo)).toThrow(/already registered/i);
  });

  it('rejects a definition with no fields array', () => {
    expect(() => registerBlock({ type: 'x', label: 'X', Component: () => null })).toThrow(/fields/i);
  });
});

describe('validateBlockData', () => {
  beforeEach(() => registerBlock(Demo));

  it('accepts valid data', () => {
    expect(validateBlockData('demo', { heading: 'Hi', count: 2, items: [] }))
      .toEqual({ ok: true, errors: [] });
  });

  it('reports a missing required field', () => {
    const r = validateBlockData('demo', { count: 1 });
    expect(r.ok).toBe(false);
    expect(r.errors[0]).toMatch(/heading/);
  });

  it('reports a wrong type', () => {
    const r = validateBlockData('demo', { heading: 'Hi', count: 'two' });
    expect(r.ok).toBe(false);
    expect(r.errors[0]).toMatch(/count/);
  });

  it('rejects data for an unregistered block', () => {
    expect(validateBlockData('ghost', {}).ok).toBe(false);
  });
});

describe('defaultBlockData', () => {
  it('builds an empty record from the field defaults', () => {
    registerBlock(Demo);
    expect(defaultBlockData('demo')).toEqual({ heading: '', count: 0, items: [] });
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run tests/unit/registry.test.js`
Expected: FAIL — cannot resolve `lib/blocks/registry.js`.

- [ ] **Step 3: Write the implementation**

```js
// lib/blocks/registry.js
/**
 * The block registry. A block type is one module declaring its fields and its
 * renderer; the admin form and the validator are both derived from `fields`,
 * so adding a block type never means editing the admin or the renderer.
 */
const registry = new Map();

const FIELD_TYPES = ['text', 'richtext', 'image', 'number', 'list'];

export function registerBlock(def) {
  if (!def || typeof def.type !== 'string' || !def.type) {
    throw new Error('Block definition needs a type');
  }
  if (registry.has(def.type)) {
    throw new Error(`Block type "${def.type}" is already registered`);
  }
  if (!Array.isArray(def.fields)) {
    throw new Error(`Block type "${def.type}" needs a fields array`);
  }
  for (const f of def.fields) {
    if (!FIELD_TYPES.includes(f.type)) {
      throw new Error(`Block type "${def.type}" has field "${f.name}" of unknown type "${f.type}"`);
    }
  }
  if (typeof def.Component !== 'function') {
    throw new Error(`Block type "${def.type}" needs a Component`);
  }
  registry.set(def.type, def);
}

export function getBlock(type) {
  return registry.get(type) || null;
}

export function allBlocks() {
  return [...registry.values()];
}

export function resetRegistry() {
  registry.clear();
}

function typeOk(field, value) {
  switch (field.type) {
    case 'number': return typeof value === 'number' && Number.isFinite(value);
    case 'list': return Array.isArray(value);
    default: return typeof value === 'string';
  }
}

export function validateBlockData(type, data) {
  const def = getBlock(type);
  if (!def) return { ok: false, errors: [`Unknown block type "${type}"`] };

  const errors = [];
  const record = data || {};
  for (const field of def.fields) {
    const value = record[field.name];
    const absent = value === undefined || value === null || value === '';
    if (field.required && absent) {
      errors.push(`"${field.label}" (${field.name}) is required`);
      continue;
    }
    if (!absent && !typeOk(field, value)) {
      errors.push(`"${field.label}" (${field.name}) must be a ${field.type}`);
    }
  }
  return { ok: errors.length === 0, errors };
}

export function defaultBlockData(type) {
  const def = getBlock(type);
  if (!def) return {};
  const out = {};
  for (const f of def.fields) {
    out[f.name] = f.default !== undefined ? f.default : f.type === 'number' ? 0 : f.type === 'list' ? [] : '';
  }
  return out;
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run tests/unit/registry.test.js`
Expected: PASS, 9 tests.

- [ ] **Step 5: Commit**

```bash
git add lib/blocks/registry.js tests/unit/registry.test.js
git commit -m "feat(blocks): add block registry with field-derived validation"
```

---

## Task 7: First two block types and the renderer

**Files:**
- Create: `lib/blocks/types/rich-text.js`, `lib/blocks/types/stat-row.js`, `lib/blocks/index.js`, `components/blocks/RichTextBlock.jsx`, `components/blocks/StatRowBlock.jsx`, `components/blocks/BlockRenderer.jsx`, `tests/unit/blocks.test.js`

**Interfaces:**
- Consumes: `registerBlock`, `getBlock`, `validateBlockData` from Task 6; `resolveTranslation` from Task 5.
- Produces:
  - `lib/blocks/index.js` exports `registerAllBlocks()` (idempotent) and is imported for its side effect by both the renderer and the admin.
  - `<BlockRenderer blocks={rows} locale={locale} />` where each row is `{ id, type, translations }`.
  - RichText fields: `heading` (text), `body` (richtext, required).
  - StatRow fields: `stats` (list, required) — each entry `{ value, unit, label }`.

- [ ] **Step 1: Write the failing test**

```js
// tests/unit/blocks.test.js
import { describe, it, expect, beforeEach } from 'vitest';
import { resetRegistry, getBlock, validateBlockData, defaultBlockData } from '../../lib/blocks/registry.js';
import { registerAllBlocks } from '../../lib/blocks/index.js';

beforeEach(() => { resetRegistry(); registerAllBlocks(); });

describe('block types', () => {
  it('registers rich-text and stat-row', () => {
    expect(getBlock('rich-text')).toBeTruthy();
    expect(getBlock('stat-row')).toBeTruthy();
  });

  it('requires a body on rich-text', () => {
    expect(validateBlockData('rich-text', { heading: 'Hi' }).ok).toBe(false);
    expect(validateBlockData('rich-text', { heading: 'Hi', body: '<p>x</p>' }).ok).toBe(true);
  });

  it('requires a stats list on stat-row', () => {
    expect(validateBlockData('stat-row', {}).ok).toBe(false);
    expect(validateBlockData('stat-row', { stats: [{ value: '48', unit: 'KM', label: 'Corridor' }] }).ok).toBe(true);
  });

  it('gives every block type usable defaults', () => {
    expect(defaultBlockData('rich-text')).toEqual({ heading: '', body: '' });
    expect(defaultBlockData('stat-row')).toEqual({ stats: [] });
  });

  it('is safe to register twice', () => {
    expect(() => registerAllBlocks()).not.toThrow();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run tests/unit/blocks.test.js`
Expected: FAIL — cannot resolve `lib/blocks/index.js`.

- [ ] **Step 3: Write the block components**

```jsx
// components/blocks/RichTextBlock.jsx
export default function RichTextBlock({ data }) {
  return (
    <section className="db-block db-richtext">
      {data.heading ? <h2 className="db-h2">{data.heading}</h2> : null}
      {/* Body HTML comes from the admin, which is behind auth and role checks. */}
      <div className="db-prose" dangerouslySetInnerHTML={{ __html: data.body }} />
    </section>
  );
}
```

```jsx
// components/blocks/StatRowBlock.jsx
export default function StatRowBlock({ data }) {
  const stats = Array.isArray(data.stats) ? data.stats : [];
  return (
    <section className="db-block db-statrow">
      <dl className="db-statrow-grid">
        {stats.map((s, i) => (
          <div key={i} className="db-stat">
            <dd className="db-stat-value">
              {s.value}
              {s.unit ? <span className="db-stat-unit">{s.unit}</span> : null}
            </dd>
            <dt className="db-stat-label">{s.label}</dt>
          </div>
        ))}
      </dl>
    </section>
  );
}
```

- [ ] **Step 4: Write the block definitions**

```js
// lib/blocks/types/rich-text.js
import RichTextBlock from '../../../components/blocks/RichTextBlock.jsx';

export default {
  type: 'rich-text',
  label: 'Rich text',
  fields: [
    { name: 'heading', type: 'text', label: 'Heading' },
    { name: 'body', type: 'richtext', label: 'Body', required: true },
  ],
  Component: RichTextBlock,
};
```

```js
// lib/blocks/types/stat-row.js
import StatRowBlock from '../../../components/blocks/StatRowBlock.jsx';

export default {
  type: 'stat-row',
  label: 'Statistics row',
  fields: [
    // Each entry: { value, unit, label }
    { name: 'stats', type: 'list', label: 'Statistics', required: true, default: [] },
  ],
  Component: StatRowBlock,
};
```

```js
// lib/blocks/index.js
import { registerBlock, getBlock } from './registry.js';
import richText from './types/rich-text.js';
import statRow from './types/stat-row.js';

const ALL = [richText, statRow];

/** Idempotent: safe to call from every entry point that needs the registry. */
export function registerAllBlocks() {
  for (const def of ALL) {
    if (!getBlock(def.type)) registerBlock(def);
  }
}

registerAllBlocks();
```

- [ ] **Step 5: Write the renderer**

```jsx
// components/blocks/BlockRenderer.jsx
import { getBlock } from '../../lib/blocks/registry.js';
import { resolveTranslation } from '../../lib/content/resolve.js';
import '../../lib/blocks/index.js';

/**
 * Renders an ordered list of blocks for one locale.
 * A block with no publishable content in any locale is skipped entirely,
 * so a partly-translated page is short rather than broken.
 */
export default function BlockRenderer({ blocks = [], locale }) {
  return (
    <>
      {blocks.map((block) => {
        const def = getBlock(block.type);
        if (!def) return null;
        const resolved = resolveTranslation(block.translations, locale);
        if (!resolved) return null;
        const Component = def.Component;
        return <Component key={block.id} data={resolved.data} locale={resolved.locale} />;
      })}
    </>
  );
}
```

- [ ] **Step 6: Run the test to verify it passes**

Run: `npx vitest run tests/unit/blocks.test.js`
Expected: PASS, 5 tests.

- [ ] **Step 7: Commit**

```bash
git add lib/blocks components/blocks tests/unit/blocks.test.js
git commit -m "feat(blocks): add rich-text and stat-row types with a renderer"
```

---

## Task 8: Page and block query layer

**Files:**
- Create: `lib/content/pages.js`, `tests/db/pages.test.js`

**Interfaces:**
- Consumes: `lib/db.js` → `query`; `lib/i18n/locales.js`.
- Produces:
  - `listPages(): Promise<Array<{id,slug,parent_id,nav_order,status,title}>>` — title is the English title
  - `getPageBySlug(slug): Promise<{id,slug,status,translations} | null>`
  - `getPageBlocks(pageId): Promise<Array<{id,type,sort_order,settings,translations}>>` — `translations` is `[{locale,data,status}]`, ordered by `sort_order`
  - `createPage({slug, title, parentId?}): Promise<number>` — returns the new page id
  - `deletePage(id): Promise<void>`
  - `addBlock({pageId, type, data}): Promise<number>` — writes an English `block_translations` row with status `published`
  - `reorderBlocks(pageId, orderedIds): Promise<void>`
  - `duplicateBlock(blockId): Promise<number>`
  - `saveBlockTranslation({blockId, locale, data, status, userId}): Promise<void>`
  - `deleteBlock(id): Promise<void>`

- [ ] **Step 1: Write the failing test**

```js
// tests/db/pages.test.js
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { execFileSync } from 'node:child_process';

const DB = process.env.DB_NAME_TEST;
process.env.DB_NAME = DB; // lib/db.js reads this

let P;
beforeAll(async () => {
  execFileSync('node', ['scripts/db-setup-v2.mjs', `--database=${DB}`], { stdio: 'inherit' });
  P = await import('../../lib/content/pages.js');
});

beforeEach(async () => {
  const { query } = await import('../../lib/db.js');
  await query('DELETE FROM pages');
});

afterAll(async () => {
  const { getPool } = await import('../../lib/db.js');
  const pool = getPool();
  if (pool) await pool.end();
});

describe('pages', () => {
  it('creates a page with an English title and finds it by slug', async () => {
    const id = await P.createPage({ slug: 'travel', title: 'Travel Info' });
    const page = await P.getPageBySlug('travel');
    expect(page.id).toBe(id);
    expect(page.translations.find((t) => t.locale === 'en').title).toBe('Travel Info');
  });

  it('returns null for an unknown slug', async () => {
    expect(await P.getPageBySlug('nope')).toBe(null);
  });

  it('adds blocks and returns them in sort order', async () => {
    const pageId = await P.createPage({ slug: 'p', title: 'P' });
    const a = await P.addBlock({ pageId, type: 'rich-text', data: { heading: 'A', body: '<p>a</p>' } });
    const b = await P.addBlock({ pageId, type: 'rich-text', data: { heading: 'B', body: '<p>b</p>' } });
    const blocks = await P.getPageBlocks(pageId);
    expect(blocks.map((x) => x.id)).toEqual([a, b]);
    expect(blocks[0].translations[0]).toMatchObject({ locale: 'en', status: 'published' });
  });

  it('reorders blocks', async () => {
    const pageId = await P.createPage({ slug: 'p', title: 'P' });
    const a = await P.addBlock({ pageId, type: 'rich-text', data: { body: '<p>a</p>' } });
    const b = await P.addBlock({ pageId, type: 'rich-text', data: { body: '<p>b</p>' } });
    await P.reorderBlocks(pageId, [b, a]);
    expect((await P.getPageBlocks(pageId)).map((x) => x.id)).toEqual([b, a]);
  });

  it('duplicates a block with all of its translations', async () => {
    const pageId = await P.createPage({ slug: 'p', title: 'P' });
    const a = await P.addBlock({ pageId, type: 'rich-text', data: { body: '<p>a</p>' } });
    await P.saveBlockTranslation({ blockId: a, locale: 'bn', data: { body: '<p>ক</p>' }, status: 'published' });
    const copy = await P.duplicateBlock(a);
    const blocks = await P.getPageBlocks(pageId);
    const dup = blocks.find((x) => x.id === copy);
    expect(dup.translations.map((t) => t.locale).sort()).toEqual(['bn', 'en']);
  });

  it('saves a translation and reports its status', async () => {
    const pageId = await P.createPage({ slug: 'p', title: 'P' });
    const a = await P.addBlock({ pageId, type: 'rich-text', data: { body: '<p>a</p>' } });
    await P.saveBlockTranslation({ blockId: a, locale: 'zh', data: { body: '<p>中</p>' }, status: 'draft' });
    const [block] = await P.getPageBlocks(pageId);
    expect(block.translations.find((t) => t.locale === 'zh').status).toBe('draft');
  });

  it('removes blocks when the page is deleted', async () => {
    const pageId = await P.createPage({ slug: 'p', title: 'P' });
    await P.addBlock({ pageId, type: 'rich-text', data: { body: '<p>a</p>' } });
    await P.deletePage(pageId);
    expect(await P.getPageBySlug('p')).toBe(null);
    expect(await P.getPageBlocks(pageId)).toEqual([]);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run tests/db/pages.test.js`
Expected: FAIL — cannot resolve `lib/content/pages.js`.

- [ ] **Step 3: Write the implementation**

```js
// lib/content/pages.js
import { query } from '../db.js';
import { DEFAULT_LOCALE } from '../i18n/locales.js';

const asJson = (v) => (typeof v === 'string' ? JSON.parse(v) : v);

export async function listPages() {
  return (
    (await query(`
      SELECT p.id, p.slug, p.parent_id, p.nav_order, p.status,
             COALESCE(t.title, '') AS title
      FROM pages p
      LEFT JOIN page_translations t ON t.page_id = p.id AND t.locale = ?
      ORDER BY p.nav_order, p.id
    `, [DEFAULT_LOCALE])) || []
  );
}

export async function getPageBySlug(slug) {
  const rows = await query('SELECT id, slug, parent_id, status FROM pages WHERE slug = ? LIMIT 1', [slug]);
  const page = rows?.[0];
  if (!page) return null;
  const translations = (await query(
    'SELECT locale, title, seo_title, seo_description, og_image, status FROM page_translations WHERE page_id = ?',
    [page.id]
  )) || [];
  return { ...page, translations };
}

export async function getPageBlocks(pageId) {
  const blocks = (await query(
    'SELECT id, type, sort_order, settings FROM blocks WHERE page_id = ? ORDER BY sort_order, id',
    [pageId]
  )) || [];
  if (blocks.length === 0) return [];

  const ids = blocks.map((b) => b.id);
  const placeholders = ids.map(() => '?').join(',');
  const trans = (await query(
    `SELECT block_id, locale, data, status FROM block_translations WHERE block_id IN (${placeholders})`,
    ids
  )) || [];

  return blocks.map((b) => ({
    ...b,
    settings: b.settings ? asJson(b.settings) : {},
    translations: trans
      .filter((t) => t.block_id === b.id)
      .map((t) => ({ locale: t.locale, data: asJson(t.data), status: t.status })),
  }));
}

export async function createPage({ slug, title, parentId = null }) {
  const res = await query(
    'INSERT INTO pages (slug, parent_id, status) VALUES (?, ?, ?)',
    [slug, parentId, 'published']
  );
  const id = res.insertId;
  await query(
    `INSERT INTO page_translations (page_id, locale, title, status)
     VALUES (?, ?, ?, 'published')`,
    [id, DEFAULT_LOCALE, title || slug]
  );
  return id;
}

export async function deletePage(id) {
  await query('DELETE FROM pages WHERE id = ?', [id]);
}

export async function addBlock({ pageId, type, data }) {
  const rows = await query('SELECT COALESCE(MAX(sort_order), -1) + 1 AS next FROM blocks WHERE page_id = ?', [pageId]);
  const sort = rows?.[0]?.next ?? 0;
  const res = await query('INSERT INTO blocks (page_id, type, sort_order) VALUES (?, ?, ?)', [pageId, type, sort]);
  const id = res.insertId;
  await query(
    `INSERT INTO block_translations (block_id, locale, data, status)
     VALUES (?, ?, ?, 'published')`,
    [id, DEFAULT_LOCALE, JSON.stringify(data || {})]
  );
  return id;
}

export async function deleteBlock(id) {
  await query('DELETE FROM blocks WHERE id = ?', [id]);
}

export async function reorderBlocks(pageId, orderedIds) {
  for (let i = 0; i < orderedIds.length; i += 1) {
    await query('UPDATE blocks SET sort_order = ? WHERE id = ? AND page_id = ?', [i, orderedIds[i], pageId]);
  }
}

export async function duplicateBlock(blockId) {
  const rows = await query('SELECT page_id, type, settings FROM blocks WHERE id = ? LIMIT 1', [blockId]);
  const src = rows?.[0];
  if (!src) throw new Error(`Block ${blockId} not found`);

  const next = await query('SELECT COALESCE(MAX(sort_order), -1) + 1 AS n FROM blocks WHERE page_id = ?', [src.page_id]);
  const res = await query(
    'INSERT INTO blocks (page_id, type, sort_order, settings) VALUES (?, ?, ?, ?)',
    [src.page_id, src.type, next?.[0]?.n ?? 0, src.settings ? JSON.stringify(asJson(src.settings)) : null]
  );
  const newId = res.insertId;

  const trans = (await query('SELECT locale, data, status FROM block_translations WHERE block_id = ?', [blockId])) || [];
  for (const t of trans) {
    await query(
      'INSERT INTO block_translations (block_id, locale, data, status) VALUES (?, ?, ?, ?)',
      [newId, t.locale, JSON.stringify(asJson(t.data)), t.status]
    );
  }
  return newId;
}

export async function saveBlockTranslation({ blockId, locale, data, status = 'draft', userId = null }) {
  await query(
    `INSERT INTO block_translations (block_id, locale, data, status, updated_by)
     VALUES (?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE data = VALUES(data), status = VALUES(status), updated_by = VALUES(updated_by)`,
    [blockId, locale, JSON.stringify(data || {}), status, userId]
  );
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run tests/db/pages.test.js`
Expected: PASS, 7 tests.

- [ ] **Step 5: Commit**

```bash
git add lib/content/pages.js tests/db/pages.test.js
git commit -m "feat(content): add page and block query layer"
```

---

## Task 9: Design tokens and self-hosted fonts

**Files:**
- Create: `app/design-tokens.css`, `public/fonts/*.woff2`, `scripts/fetch-fonts.mjs`
- Modify: `app/globals.css`

**Interfaces:**
- Consumes: nothing.
- Produces: CSS custom properties on `:root` — `--db-ground`, `--db-surface`, `--db-ink`, `--db-ink-2`, `--db-rule`, `--db-accent`, `--db-open`, `--db-build`, `--db-alert`, `--db-plate-bg`, `--db-plate-fg`, plus `--db-font-display`, `--db-font-body`. Consumed by every component from Task 10 onward.

- [ ] **Step 1: Write the font fetch script**

```js
// scripts/fetch-fonts.mjs
/**
 * Downloads the self-hosted Latin and Bengali faces into public/fonts.
 * Run ONCE by a developer; the .woff2 files are committed. The site never
 * touches a font CDN at runtime.
 *   node scripts/fetch-fonts.mjs
 */
import fs from 'node:fs';
import path from 'node:path';

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
const OUT = path.resolve('public/fonts');
fs.mkdirSync(OUT, { recursive: true });

const FAMILIES = [
  'Barlow+Semi+Condensed:wght@600;700',
  'Archivo:wght@400..700',
  'Noto+Sans+Bengali:wght@400;600;700',
];

const css = await (await fetch(
  `https://fonts.googleapis.com/css2?${FAMILIES.map((f) => `family=${f}`).join('&')}&display=swap`,
  { headers: { 'User-Agent': UA } }
)).text();

// Keep only the latin and bengali subsets; the rest are dead weight here.
const wanted = /\/\*\s*(latin|bengali)\s*\*\/\s*@font-face\s*\{(.*?)\}/gs;
const faces = [];
let m, n = 0;
while ((m = wanted.exec(css))) {
  const block = m[2];
  const family = /font-family: '([^']+)'/.exec(block)[1].replace(/\s+/g, '');
  const weight = /font-weight: ([\d ]+)/.exec(block)[1].trim().replace(/\s+/g, '-');
  const url = /url\((https[^)]+)\)/.exec(block)[1];
  const file = path.join(OUT, `${family}-${m[1]}-${weight}.woff2`);
  const buf = Buffer.from(await (await fetch(url, { headers: { 'User-Agent': UA } })).arrayBuffer());
  fs.writeFileSync(file, buf);
  console.log(`${path.basename(file)}  ${(buf.length / 1024).toFixed(1)} KB`);
  faces.push(
    `@font-face{font-family:'${family}';font-style:normal;font-weight:${/font-weight: ([\d ]+)/.exec(block)[1].trim()};` +
    `font-display:swap;src:url('/fonts/${path.basename(file)}') format('woff2');}`
  );
  n += 1;
}
console.log(`
${n} font files written to public/fonts`);
console.log('
--- paste these @font-face blocks into app/design-tokens.css verbatim ---
');
console.log(faces.join('
'));
```

- [ ] **Step 2: Run it and confirm the files exist**

Run:
```bash
node scripts/fetch-fonts.mjs
ls -la public/fonts
```
Expected: several `.woff2` files, each well under 100 KB. **Copy the `@font-face`
blocks the script prints** — use them verbatim in the next step. Do not hand-write
the filenames: the weight segment comes from the CSS (a variable face prints as
`400 700`, giving `Archivo-latin-400-700.woff2`), and a mismatched `src` fails
silently into a system font with no error anywhere.

- [ ] **Step 3: Write `app/design-tokens.css`**

Note the three-state theme pattern: bare `:root` is light, the media query is
guarded so an explicit light choice beats a dark OS, and the `[data-theme]`
stamps win in both directions.

```css
/* Corridor / wayfinding design tokens. Light is the bare :root. */

@font-face{font-family:'BarlowSemiCondensed';font-style:normal;font-weight:600;font-display:swap;
  src:url('/fonts/BarlowSemiCondensed-latin-600.woff2') format('woff2');}
@font-face{font-family:'BarlowSemiCondensed';font-style:normal;font-weight:700;font-display:swap;
  src:url('/fonts/BarlowSemiCondensed-latin-700.woff2') format('woff2');}
/* Replace this whole @font-face group with the blocks printed by
   scripts/fetch-fonts.mjs — the filenames must match what it wrote. */
@font-face{font-family:'Archivo';font-style:normal;font-weight:400 700;font-display:swap;
  src:url('/fonts/Archivo-latin-400-700.woff2') format('woff2');}
@font-face{font-family:'NotoSansBengali';font-style:normal;font-weight:400;font-display:swap;
  src:url('/fonts/NotoSansBengali-bengali-400.woff2') format('woff2');}
@font-face{font-family:'NotoSansBengali';font-style:normal;font-weight:700;font-display:swap;
  src:url('/fonts/NotoSansBengali-bengali-700.woff2') format('woff2');}

:root{
  --db-ground:#E7EBEE;
  --db-surface:#FFFFFF;
  --db-surface-2:#DCE3E8;
  --db-ink:#0B1620;
  --db-ink-2:#3D525F;
  --db-ink-3:#687E8C;
  --db-rule:#C2CCD3;
  --db-rule-2:#9FADB7;
  --db-accent:#8A5A00;
  --db-accent-bright:#FFB000;
  --db-open:#0F6B42;
  --db-build:#9E3E05;
  --db-alert:#93231A;

  /* Signage plates keep their values in both themes: a road sign does not
     change with the viewer's operating system. */
  --db-plate-bg:#0B1620;
  --db-plate-fg:#EDF2F5;
  --db-plate-accent:#FFB000;

  /* Status washes are explicit values, NOT color-mix(): color-mix is unsupported
     before Chrome 111 / Safari 16.2, and an unsupported value drops the whole
     declaration — status tags would lose their background entirely. */
  --db-open-wash:#D3EBDF;
  --db-build-wash:#F8DFCF;
  --db-alert-wash:#F7DAD5;

  /* Breakpoints, documented here so every component uses the same set. */
  --db-bp-sm:480px;
  --db-bp-md:768px;
  --db-bp-lg:1024px;
  --db-bp-xl:1280px;
  --db-measure:68ch;
  --db-shell:1180px;
  --db-tap:44px;

  --db-font-display:'BarlowSemiCondensed','NotoSansBengali',system-ui,sans-serif;
  --db-font-body:'Archivo','NotoSansBengali',system-ui,sans-serif;
  --db-font-zh:'PingFang SC','Hiragino Sans GB','Microsoft YaHei','Noto Sans SC',system-ui,sans-serif;
}

@media (prefers-color-scheme:dark){
  :root:not([data-theme="light"]){
    --db-ground:#0A141D;
    --db-surface:#101E29;
    --db-surface-2:#162835;
    --db-ink:#E6EDF1;
    --db-ink-2:#A6B8C4;
    --db-ink-3:#758997;
    --db-rule:#1E3140;
    --db-rule-2:#2F4759;
    --db-accent:#FFB000;
    --db-open:#3ECC85;
    --db-build:#FF8A45;
    --db-alert:#FF6A55;
    --db-open-wash:#0E2C20;
    --db-build-wash:#331A0C;
    --db-alert-wash:#331411;
    --db-plate-bg:#162835;
  }
}

:root[data-theme="dark"]{
  --db-ground:#0A141D;
  --db-surface:#101E29;
  --db-surface-2:#162835;
  --db-ink:#E6EDF1;
  --db-ink-2:#A6B8C4;
  --db-ink-3:#758997;
  --db-rule:#1E3140;
  --db-rule-2:#2F4759;
  --db-accent:#FFB000;
  --db-open:#3ECC85;
  --db-build:#FF8A45;
  --db-alert:#FF6A55;
  --db-open-wash:#0E2C20;
  --db-build-wash:#331A0C;
  --db-alert-wash:#331411;
  --db-plate-bg:#162835;
}

/* Scoped to the new tree only — the live site must not change. */
.db-root{
  background:var(--db-ground);
  color:var(--db-ink);
  font-family:var(--db-font-body);
  font-variant-numeric:tabular-nums;
  /* The body must never scroll sideways at any viewport width. */
  overflow-x:hidden;
}
/* Media and embeds never force the page wider than the viewport. */
.db-root img,.db-root video,.db-root svg,.db-root iframe{max-width:100%;height:auto;}
/* Wide content scrolls inside itself instead. */
.db-scroll-x{overflow-x:auto;-webkit-overflow-scrolling:touch;max-width:100%;}
/* Long unbroken strings (URLs, chainages) must not blow out narrow screens. */
.db-root p,.db-root li,.db-root td,.db-root h1,.db-root h2,.db-root h3{overflow-wrap:break-word;}
/* Every interactive target meets the 44px minimum on touch devices. */
@media (pointer:coarse){
  .db-root a,.db-root button,.db-root [role="button"],.db-root summary{
    min-height:var(--db-tap);
  }
}
.db-root:lang(zh){font-family:var(--db-font-zh);}
.db-root h1,.db-root h2,.db-root h3,.db-root .db-display{
  font-family:var(--db-font-display);font-weight:700;line-height:1.06;text-wrap:balance;
}
.db-root :focus-visible{outline:3px solid var(--db-accent-bright);outline-offset:2px;}

.db-tag{display:inline-flex;align-items:center;gap:6px;font-family:var(--db-font-display);
  font-weight:700;font-size:.72rem;letter-spacing:.12em;text-transform:uppercase;padding:3px 9px;border-radius:2px;}
/* Status carries a shape and a label as well as a colour — never colour alone. */
.db-tag-open{background:var(--db-open-wash);color:var(--db-open);}
.db-tag-build{background:var(--db-build-wash);color:var(--db-build);
  background-image:repeating-linear-gradient(115deg,transparent 0 6px,rgba(128,64,0,.14) 6px 12px);}
.db-tag-alert{background:var(--db-alert-wash);color:var(--db-alert);}

.db-stat-value{font-family:var(--db-font-display);font-weight:700;font-size:clamp(1.9rem,1.2rem + 2.2vw,2.9rem);line-height:1;}
.db-stat-unit{font-size:.48em;color:var(--db-accent);margin-left:2px;}
.db-stat-label{font-family:var(--db-font-display);font-size:.7rem;letter-spacing:.15em;
  text-transform:uppercase;color:var(--db-ink-3);margin-top:6px;}
/* auto-fit + minmax reflows from 1 column at 320px to 4 across on a desktop
   with no breakpoints of its own. */
.db-statrow-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(122px,1fr));gap:0;margin:0;}

@media (prefers-reduced-motion:reduce){
  .db-root *,.db-root *::before,.db-root *::after{
    animation-duration:.01ms !important;animation-iteration-count:1 !important;transition-duration:.01ms !important;
  }
}
```

- [ ] **Step 4: Import the tokens from `app/globals.css`**

Add as the **second** line of `app/globals.css`, immediately after `@import 'tailwindcss';`:

```css
@import './design-tokens.css';
```

- [ ] **Step 5: Verify every font src resolves to a real file**

Run:
```bash
grep -o "/fonts/[^']*\.woff2" app/design-tokens.css | sed 's|/fonts/||' | sort -u > /tmp/db-css-fonts.txt
ls public/fonts | sort -u > /tmp/db-disk-fonts.txt
comm -23 /tmp/db-css-fonts.txt /tmp/db-disk-fonts.txt
```
Expected: **no output.** Any filename printed is referenced by the CSS but absent
from disk, which means that face silently falls back to a system font. Fix the CSS
to match disk before continuing.

- [ ] **Step 6: Verify no CSS feature outside the support baseline**

Run:
```bash
grep -nE 'color-mix\(|@container|:has\(' app/design-tokens.css
```
Expected: **no output.** Each of these is unsupported on the browser baseline
(Chrome <111 / Safari <16.2 for `color-mix`), and an unsupported value causes the
whole declaration to be dropped — silently, with no error anywhere. Status colour
carries meaning here, so it may not depend on any of them.

- [ ] **Step 7: Verify the build still succeeds**

Run: `npm run build`
Expected: build completes with no CSS errors, and the existing site pages still compile.

- [ ] **Step 8: Commit**

```bash
git add app/design-tokens.css app/globals.css public/fonts scripts/fetch-fonts.mjs
git commit -m "feat(design): add corridor/wayfinding tokens and self-hosted fonts"
```

---

## Task 10: Theme switcher

**Files:**
- Create: `lib/theme.js`, `components/chrome/ThemeScript.jsx`, `components/chrome/ThemeToggle.jsx`, `tests/unit/theme.test.js`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `THEME_KEY = 'dbedc-theme'`, `THEMES = ['light','dark','system']`, `DEFAULT_THEME = 'system'`
  - `normalizeTheme(value): 'light'|'dark'|'system'`
  - `themeScriptSource(): string` — the inline pre-paint script body
  - `<ThemeScript />` — renders that script; must be placed in the layout before any content
  - `<ThemeToggle />` — a client three-state control

- [ ] **Step 1: Write the failing test**

```js
// tests/unit/theme.test.js
import { describe, it, expect } from 'vitest';
import { THEME_KEY, THEMES, DEFAULT_THEME, normalizeTheme, themeScriptSource } from '../../lib/theme.js';

describe('theme', () => {
  it('offers three states and defaults to system', () => {
    expect(THEMES).toEqual(['light', 'dark', 'system']);
    expect(DEFAULT_THEME).toBe('system');
  });

  it('normalises anything unexpected to system', () => {
    expect(normalizeTheme('dark')).toBe('dark');
    expect(normalizeTheme('LIGHT')).toBe('light');
    expect(normalizeTheme('purple')).toBe('system');
    expect(normalizeTheme(null)).toBe('system');
  });

  it('produces a script that stamps only explicit choices', () => {
    const src = themeScriptSource();
    expect(src).toContain(THEME_KEY);
    expect(src).toContain('data-theme');
    // "system" must leave the attribute off so prefers-color-scheme decides.
    expect(src).toContain('removeAttribute');
    expect(src).not.toContain('\n\n\n');
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run tests/unit/theme.test.js`
Expected: FAIL — cannot resolve `lib/theme.js`.

- [ ] **Step 3: Write `lib/theme.js`**

```js
// lib/theme.js
export const THEME_KEY = 'dbedc-theme';
export const THEMES = ['light', 'dark', 'system'];
export const DEFAULT_THEME = 'system';

export function normalizeTheme(value) {
  const v = String(value || '').toLowerCase();
  return THEMES.includes(v) ? v : DEFAULT_THEME;
}

/**
 * Runs before first paint so the page never flashes the wrong theme.
 * "system" deliberately removes the attribute, leaving prefers-color-scheme
 * in charge — that is the un-stamped state the CSS is written for.
 */
export function themeScriptSource() {
  return `(function(){try{var t=localStorage.getItem(${JSON.stringify(THEME_KEY)});` +
    `var r=document.documentElement;` +
    `if(t==="light"||t==="dark"){r.setAttribute("data-theme",t);}` +
    `else{r.removeAttribute("data-theme");}}catch(e){}})();`;
}
```

- [ ] **Step 4: Write the components**

```jsx
// components/chrome/ThemeScript.jsx
import { themeScriptSource } from '../../lib/theme.js';

/** Must render before any visible content. */
export default function ThemeScript() {
  return <script dangerouslySetInnerHTML={{ __html: themeScriptSource() }} />;
}
```

```jsx
// components/chrome/ThemeToggle.jsx
'use client';

import { useEffect, useState } from 'react';
import { THEME_KEY, THEMES, DEFAULT_THEME, normalizeTheme } from '../../lib/theme.js';

const LABELS = { light: 'Light', dark: 'Dark', system: 'System' };

export default function ThemeToggle({ label = 'Theme' }) {
  const [theme, setTheme] = useState(DEFAULT_THEME);

  useEffect(() => {
    setTheme(normalizeTheme(localStorage.getItem(THEME_KEY)));
  }, []);

  function choose(next) {
    const value = normalizeTheme(next);
    setTheme(value);
    localStorage.setItem(THEME_KEY, value);
    const root = document.documentElement;
    if (value === 'system') root.removeAttribute('data-theme');
    else root.setAttribute('data-theme', value);
  }

  return (
    <div className="db-theme-toggle" role="group" aria-label={label}>
      {THEMES.map((t) => (
        <button
          key={t}
          type="button"
          onClick={() => choose(t)}
          aria-pressed={theme === t}
          className="db-theme-btn"
        >
          {LABELS[t]}
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 5: Add the toggle styles to `app/design-tokens.css`**

Append:

```css
.db-theme-toggle{display:inline-flex;border:1px solid var(--db-rule);border-radius:3px;overflow:hidden;}
.db-theme-btn{font-family:var(--db-font-display);font-size:.74rem;letter-spacing:.1em;
  text-transform:uppercase;padding:6px 10px;background:transparent;color:var(--db-ink-3);
  border:0;border-right:1px solid var(--db-rule);cursor:pointer;}
.db-theme-btn:last-child{border-right:0;}
.db-theme-btn[aria-pressed="true"]{background:var(--db-accent-bright);color:#0B1620;}
```

- [ ] **Step 6: Run the test to verify it passes**

Run: `npx vitest run tests/unit/theme.test.js`
Expected: PASS, 3 tests.

- [ ] **Step 7: Commit**

```bash
git add lib/theme.js components/chrome/ThemeScript.jsx components/chrome/ThemeToggle.jsx app/design-tokens.css tests/unit/theme.test.js
git commit -m "feat(design): add three-state theme switcher with no-flash script"
```

---

## Task 11: Locale routing and site chrome

**Files:**
- Create: `lib/i18n/ui.js`, `components/chrome/LocaleSwitch.jsx`, `components/chrome/SiteHeaderV2.jsx`, `components/chrome/SiteFooterV2.jsx`, `app/[locale]/layout.jsx`, `app/[locale]/page.jsx`, `app/[locale]/[...slug]/page.jsx`, `scripts/seed-home.mjs`, `tests/unit/ui-strings.test.js`

**Interfaces:**
- Consumes: `LOCALES`, `DEFAULT_LOCALE`, `LOCALE_LABELS`, `LOCALE_HTML_LANG`, `isLocale`, `withLocale`; `getPageBySlug`, `getPageBlocks`; `BlockRenderer`; `ThemeScript`, `ThemeToggle`.
- Produces:
  - `lib/i18n/ui.js` → `t(locale, key)` and `UI` — chrome strings only (nav labels, switcher labels, footer legal). Page content never lives here.
  - Routes `/en`, `/bn`, `/zh` and `/[locale]/[...slug]`.
  - `generateStaticParams` returns all three locales; unknown locales `notFound()`.

**Note:** `middleware.js` is deliberately **not** modified in this task. The live site keeps serving `/`, `/project`, etc. Locale redirects are switched on at cutover.

- [ ] **Step 1: Write the failing test**

```js
// tests/unit/ui-strings.test.js
import { describe, it, expect } from 'vitest';
import { LOCALES } from '../../lib/i18n/locales.js';
import { UI, t } from '../../lib/i18n/ui.js';

describe('ui strings', () => {
  it('defines every key in every locale', () => {
    const keys = Object.keys(UI.en);
    expect(keys.length).toBeGreaterThan(0);
    for (const locale of LOCALES) {
      for (const key of keys) {
        expect(UI[locale][key], `${locale}.${key}`).toBeTruthy();
      }
    }
  });

  it('falls back to English for an unknown locale or key', () => {
    expect(t('fr', 'navTravel')).toBe(UI.en.navTravel);
    expect(t('bn', 'nope')).toBe('nope');
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run tests/unit/ui-strings.test.js`
Expected: FAIL — cannot resolve `lib/i18n/ui.js`.

- [ ] **Step 3: Write `lib/i18n/ui.js`**

```js
// lib/i18n/ui.js
import { DEFAULT_LOCALE } from './locales.js';

/**
 * Chrome strings only — navigation, switchers, footer legal. Page content
 * lives in the CMS, never here. Bengali and Chinese are human-written.
 */
export const UI = {
  en: {
    navTravel: 'Travel Info', navProject: 'Project', navImpact: 'Impact',
    navAbout: 'About', navNews: 'News', navContact: 'Contact',
    skipToContent: 'Skip to content', language: 'Language', theme: 'Theme',
    emergency: 'Emergency', allRights: 'All rights reserved.',
  },
  bn: {
    navTravel: 'ভ্রমণ তথ্য', navProject: 'প্রকল্প', navImpact: 'প্রভাব',
    navAbout: 'পরিচিতি', navNews: 'সংবাদ', navContact: 'যোগাযোগ',
    skipToContent: 'মূল বিষয়বস্তুতে যান', language: 'ভাষা', theme: 'থিম',
    emergency: 'জরুরি', allRights: 'সর্বস্বত্ব সংরক্ষিত।',
  },
  zh: {
    navTravel: '出行信息', navProject: '项目', navImpact: '影响',
    navAbout: '关于我们', navNews: '新闻', navContact: '联系我们',
    skipToContent: '跳到主要内容', language: '语言', theme: '主题',
    emergency: '紧急救援', allRights: '版权所有。',
  },
};

export function t(locale, key) {
  const table = UI[locale] || UI[DEFAULT_LOCALE];
  return table[key] || UI[DEFAULT_LOCALE][key] || key;
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run tests/unit/ui-strings.test.js`
Expected: PASS, 2 tests.

- [ ] **Step 5: Write the locale switcher**

```jsx
// components/chrome/LocaleSwitch.jsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LOCALES, LOCALE_LABELS, withLocale } from '../../lib/i18n/locales.js';

export default function LocaleSwitch({ current, label = 'Language' }) {
  const pathname = usePathname();
  return (
    <nav className="db-locale-switch" aria-label={label}>
      {LOCALES.map((l) => (
        <Link
          key={l}
          href={withLocale(pathname, l)}
          hrefLang={l}
          aria-current={l === current ? 'true' : undefined}
          className="db-locale-btn"
        >
          {LOCALE_LABELS[l]}
        </Link>
      ))}
    </nav>
  );
}
```

- [ ] **Step 6: Write the header and footer**

```jsx
// components/chrome/SiteHeaderV2.jsx
import Link from 'next/link';
import LocaleSwitch from './LocaleSwitch.jsx';
import ThemeToggle from './ThemeToggle.jsx';
import { t } from '../../lib/i18n/ui.js';

const NAV = [
  { key: 'navTravel', href: '/travel' },
  { key: 'navProject', href: '/project' },
  { key: 'navImpact', href: '/impact' },
  { key: 'navAbout', href: '/about' },
  { key: 'navNews', href: '/news' },
];

export default function SiteHeaderV2({ locale }) {
  return (
    <header className="db-header">
      <a href="#main" className="db-skip">{t(locale, 'skipToContent')}</a>
      <div className="db-header-inner">
        <Link href={`/${locale}`} className="db-brand">
          <span className="db-brand-mark" aria-hidden="true">DB</span>
          <span>
            <b className="db-brand-name">DBEDC</b>
            <small className="db-brand-tag">Dhaka Bypass Expressway</small>
          </span>
        </Link>

        {/* Visible from md, not xl — the old header vanished between 1024 and 1279px. */}
        <nav className="db-nav" aria-label="Primary">
          {NAV.map((item) => (
            <Link key={item.href} href={`/${locale}${item.href}`} className="db-nav-link">
              {t(locale, item.key)}
            </Link>
          ))}
          <Link href={`/${locale}/contact`} className="db-nav-cta">{t(locale, 'navContact')}</Link>
        </nav>

        <div className="db-header-utils">
          <LocaleSwitch current={locale} label={t(locale, 'language')} />
          <ThemeToggle label={t(locale, 'theme')} />
        </div>

        {/* Below 768px the same links live here, in a horizontally scrollable
            row, so no destination is ever unreachable on a narrow screen. */}
        <nav className="db-nav-mobile" aria-label="Primary, compact">
          {NAV.map((item) => (
            <Link key={item.href} href={`/${locale}${item.href}`} className="db-nav-link">
              {t(locale, item.key)}
            </Link>
          ))}
          <Link href={`/${locale}/contact`} className="db-nav-cta">{t(locale, 'navContact')}</Link>
        </nav>
      </div>
    </header>
  );
}
```

```jsx
// components/chrome/SiteFooterV2.jsx
import { t } from '../../lib/i18n/ui.js';

export default function SiteFooterV2({ locale }) {
  const year = new Date().getFullYear();
  return (
    <footer className="db-footer">
      <div className="db-footer-inner">
        <p className="db-footer-brand">Dhaka Bypass Expressway Development Company</p>
        <p className="db-footer-legal">© {year} DBEDC. {t(locale, 'allRights')}</p>
      </div>
    </footer>
  );
}
```

- [ ] **Step 7: Write the locale layout and pages**

```jsx
// app/[locale]/layout.jsx
import { notFound } from 'next/navigation';
import { LOCALES, LOCALE_HTML_LANG, isLocale } from '../../lib/i18n/locales.js';
import ThemeScript from '../../components/chrome/ThemeScript.jsx';
import SiteHeaderV2 from '../../components/chrome/SiteHeaderV2.jsx';
import SiteFooterV2 from '../../components/chrome/SiteFooterV2.jsx';

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

/** Zooming must never be disabled — WCAG 2.2 AA and basic courtesy on a phone. */
export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export default async function LocaleLayout({ children, params }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  return (
    <div className="db-root" lang={LOCALE_HTML_LANG[locale]}>
      <ThemeScript />
      <SiteHeaderV2 locale={locale} />
      <main id="main">{children}</main>
      <SiteFooterV2 locale={locale} />
    </div>
  );
}
```

```jsx
// app/[locale]/page.jsx
import { notFound } from 'next/navigation';
import { isLocale } from '../../lib/i18n/locales.js';
import { getPageBySlug, getPageBlocks } from '../../lib/content/pages.js';
import BlockRenderer from '../../components/blocks/BlockRenderer.jsx';

export default async function LocaleHome({ params }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const page = await getPageBySlug('home');
  if (!page) return <p className="db-empty">No home page has been created yet.</p>;

  const blocks = await getPageBlocks(page.id);
  return <BlockRenderer blocks={blocks} locale={locale} />;
}
```

```jsx
// app/[locale]/[...slug]/page.jsx
import { notFound } from 'next/navigation';
import { isLocale } from '../../../lib/i18n/locales.js';
import { getPageBySlug, getPageBlocks } from '../../../lib/content/pages.js';
import { resolveTranslation } from '../../../lib/content/resolve.js';
import BlockRenderer from '../../../components/blocks/BlockRenderer.jsx';

async function load(params) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) return null;
  const page = await getPageBySlug(slug.join('/'));
  return page ? { locale, page } : null;
}

export async function generateMetadata({ params }) {
  const loaded = await load(params);
  if (!loaded) return {};
  const rows = loaded.page.translations.map((tr) => ({
    locale: tr.locale, status: tr.status,
    data: { title: tr.seo_title || tr.title, description: tr.seo_description },
  }));
  const resolved = resolveTranslation(rows, loaded.locale);
  return resolved ? { title: resolved.data.title, description: resolved.data.description } : {};
}

export default async function CmsPage({ params }) {
  const loaded = await load(params);
  if (!loaded || loaded.page.status !== 'published') notFound();
  const blocks = await getPageBlocks(loaded.page.id);
  return <BlockRenderer blocks={blocks} locale={loaded.locale} />;
}
```

- [ ] **Step 8: Add the chrome styles to `app/design-tokens.css`**

Append:

```css
.db-header{background:var(--db-plate-bg);color:var(--db-plate-fg);}
.db-header-inner{max-width:var(--db-shell);margin:0 auto;padding:14px clamp(12px,3vw,20px);
  display:flex;flex-wrap:wrap;align-items:center;gap:14px 20px;}
.db-skip{position:absolute;left:-9999px;}
.db-skip:focus{position:static;display:inline-block;padding:8px 12px;background:var(--db-accent-bright);color:#0B1620;}
.db-brand{display:flex;align-items:center;gap:10px;text-decoration:none;color:inherit;}
.db-brand-mark{width:34px;height:34px;border-radius:2px;background:var(--db-plate-accent);color:#0B1620;
  font-family:var(--db-font-display);font-weight:700;display:flex;align-items:center;justify-content:center;}
.db-brand-name{font-family:var(--db-font-display);font-size:1.02rem;letter-spacing:.06em;display:block;line-height:1.1;}
.db-brand-tag{font-size:.68rem;opacity:.6;}
/* Visible from md so the nav never disappears on a landscape tablet.
   Below md the links move into the always-present overflow row rather than
   vanishing — nothing is unreachable at any width. */
.db-nav{display:none;gap:4px;margin-left:auto;align-items:center;flex-wrap:wrap;}
@media (min-width:768px){.db-nav{display:flex;}}
.db-nav-mobile{display:flex;gap:4px;overflow-x:auto;-webkit-overflow-scrolling:touch;
  width:100%;padding-bottom:4px;scrollbar-width:none;}
.db-nav-mobile::-webkit-scrollbar{display:none;}
@media (min-width:768px){.db-nav-mobile{display:none;}}
.db-nav-link,.db-nav-cta{font-family:var(--db-font-display);font-weight:600;font-size:.86rem;
  letter-spacing:.09em;text-transform:uppercase;padding:7px 11px;border-radius:2px;text-decoration:none;color:inherit;opacity:.78;}
.db-nav-link:hover{opacity:1;}
.db-nav-cta{border:1px solid var(--db-plate-accent);color:var(--db-plate-accent);opacity:1;}
.db-header-utils{display:flex;gap:10px;align-items:center;margin-left:auto;}
.db-locale-switch{display:inline-flex;gap:2px;}
.db-locale-btn{font-family:var(--db-font-display);font-size:.76rem;letter-spacing:.06em;
  padding:4px 9px;border-radius:2px;text-decoration:none;color:inherit;opacity:.6;}
.db-locale-btn[aria-current="true"]{background:var(--db-plate-accent);color:#0B1620;opacity:1;}
.db-footer{border-top:1px solid var(--db-rule);margin-top:64px;}
.db-footer-inner{max-width:var(--db-shell);margin:0 auto;padding:24px clamp(12px,3vw,20px);
  display:flex;flex-wrap:wrap;gap:8px 24px;justify-content:space-between;
  color:var(--db-ink-3);font-size:.86rem;}
.db-block{max-width:var(--db-shell);margin:0 auto;padding:clamp(28px,5vw,40px) clamp(12px,3vw,20px);}
.db-prose{max-width:var(--db-measure);color:var(--db-ink-2);}
.db-prose table{display:block;overflow-x:auto;max-width:100%;}
.db-empty{max-width:var(--db-shell);margin:0 auto;padding:60px clamp(12px,3vw,20px);color:var(--db-ink-3);}
```

- [ ] **Step 9: Write the home-page seed script**

`package.json` has no `"type": "module"`, so bare Node treats every `.js` file
as CommonJS and cannot import `lib/db.js`. Seed scripts therefore talk to MySQL
directly — the same pattern `scripts/db-seed.mjs` and `scripts/db-setup-v2.mjs`
already follow.

```js
// scripts/seed-home.mjs
/**
 * Seeds a minimal home page so the new locale routes have something to render.
 * Re-runnable: drops and recreates the `home` page (blocks cascade).
 *   node scripts/seed-home.mjs [--database=name]
 */
import mysql from 'mysql2/promise';
import { loadEnv } from './load-env.mjs';

loadEnv();
const arg = process.argv.find((a) => a.startsWith('--database='));
const DB_NAME = arg ? arg.split('=')[1] : process.env.DB_NAME || 'dhakabypass';

const db = await mysql.createConnection({
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: DB_NAME,
});

await db.execute('DELETE FROM pages WHERE slug = ?', ['home']);

const [page] = await db.execute(
  "INSERT INTO pages (slug, status) VALUES ('home', 'published')"
);
await db.execute(
  "INSERT INTO page_translations (page_id, locale, title, status) VALUES (?, 'en', 'Home', 'published')",
  [page.insertId]
);

const BLOCKS = [
  {
    type: 'stat-row',
    data: {
      stats: [
        { value: '48', unit: 'KM', label: 'Corridor' },
        { value: '18', unit: 'KM', label: 'Open to traffic' },
        { value: '73.5', unit: '%', label: 'Works complete' },
        { value: '4', unit: '', label: 'National highways' },
      ],
    },
  },
  {
    type: 'rich-text',
    data: {
      heading: 'Bangladesh\u2019s first access-controlled expressway',
      body: '<p>Forty-eight kilometres linking four national highways east of the capital.</p>',
    },
  },
];

for (let i = 0; i < BLOCKS.length; i += 1) {
  const [block] = await db.execute(
    'INSERT INTO blocks (page_id, type, sort_order) VALUES (?, ?, ?)',
    [page.insertId, BLOCKS[i].type, i]
  );
  await db.execute(
    "INSERT INTO block_translations (block_id, locale, data, status) VALUES (?, 'en', ?, 'published')",
    [block.insertId, JSON.stringify(BLOCKS[i].data)]
  );
}

console.log(`Seeded home page #${page.insertId} with ${BLOCKS.length} blocks on ${DB_NAME}`);
await db.end();
```

- [ ] **Step 10: Seed and check it renders**

Run:
```bash
node scripts/seed-home.mjs
npm run dev
```
Then open `http://localhost:3000/en`, `/bn`, `/zh`.
Expected: all three render the stat row and the rich text (Bangla and Chinese fall back to English), the header nav shows translated labels, the theme toggle switches and survives a reload, and `/` still serves the old live site unchanged.

- [ ] **Step 11: Commit**

```bash
git add lib/i18n/ui.js components/chrome app/[locale] app/design-tokens.css scripts/seed-home.mjs tests/unit/ui-strings.test.js
git commit -m "feat(site): add locale routing, chrome and CMS page rendering"
```

---

## Task 12: Media upload and library

**Files:**
- Create: `lib/media.js`, `app/admin/api/media/route.js`, `tests/unit/media.test.js`
- Modify: `.gitignore`, `.env.local`

**Interfaces:**
- Consumes: `lib/db.js` → `query`.
- Produces:
  - `safeFilename(name): string` — lowercased, ASCII, extension preserved, no traversal
  - `uploadRoot(): string` — `process.env.MEDIA_ROOT` or `public/uploads`
  - `saveUpload({ buffer, filename, mime }): Promise<{ id, path }>`
  - `listMedia(): Promise<Array<{id,path,alt,width,height}>>`
  - `setMediaAlt(id, locale, text): Promise<void>`

Uploads live outside the repository on the server (`MEDIA_ROOT`), so a `git pull` deploy never destroys them.

- [ ] **Step 1: Write the failing test**

```js
// tests/unit/media.test.js
import { describe, it, expect } from 'vitest';
import { safeFilename } from '../../lib/media.js';

describe('safeFilename', () => {
  it('lowercases and slugifies', () => {
    expect(safeFilename('My Photo 01.WEBP')).toMatch(/^my-photo-01\.webp$/);
  });

  it('strips path traversal', () => {
    expect(safeFilename('../../etc/passwd.png')).toBe('etc-passwd.png');
    expect(safeFilename('..\\\\windows\\\\a.png')).toBe('windows-a.png');
  });

  it('drops characters that are not safe in a URL', () => {
    expect(safeFilename('a b&c#d?.jpg')).toBe('a-b-c-d.jpg');
  });

  it('keeps a sane name when there is no extension', () => {
    expect(safeFilename('noext')).toBe('noext');
  });

  it('treats a leading-dot name as the stem, not an extension', () => {
    // path.extname('.png') is '' — dotfiles have no extension, so ".png"
    // is the stem. The result is still safe, which is what matters here.
    expect(safeFilename('///.png')).toBe('png');
  });

  it('never returns an empty name', () => {
    expect(safeFilename('///')).toBe('file');
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run tests/unit/media.test.js`
Expected: FAIL — cannot resolve `lib/media.js`.

- [ ] **Step 3: Write the implementation**

```js
// lib/media.js
import fs from 'node:fs/promises';
import path from 'node:path';
import { query } from './db.js';

/**
 * Uploads live outside the repository on the server so that a `git pull`
 * deploy can never delete them. Locally they fall back to public/uploads.
 */
export function uploadRoot() {
  return process.env.MEDIA_ROOT || path.join(process.cwd(), 'public', 'uploads');
}

export function safeFilename(name) {
  const raw = String(name || '');
  const base = raw.split(/[\\/]+/).filter((s) => s && s !== '..' && s !== '.').join('-');
  const ext = path.extname(base).toLowerCase().replace(/[^a-z0-9.]/g, '');
  const stem = base.slice(0, base.length - path.extname(base).length);
  const clean = stem
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return (clean || 'file') + ext;
}

export async function saveUpload({ buffer, filename, mime }) {
  const dir = uploadRoot();
  await fs.mkdir(dir, { recursive: true });

  let name = safeFilename(filename);
  // Never silently overwrite an existing asset.
  const ext = path.extname(name);
  const stem = name.slice(0, name.length - ext.length);
  let n = 1;
  while (true) {
    try {
      await fs.access(path.join(dir, name));
      name = `${stem}-${n}${ext}`;
      n += 1;
    } catch {
      break;
    }
  }

  await fs.writeFile(path.join(dir, name), buffer);
  const publicPath = `/uploads/${name}`;
  const res = await query(
    'INSERT INTO media (path, bytes, mime, alt) VALUES (?, ?, ?, ?)',
    [publicPath, buffer.length, mime || '', JSON.stringify({})]
  );
  return { id: res.insertId, path: publicPath };
}

export async function listMedia() {
  const rows = (await query('SELECT id, path, width, height, alt FROM media ORDER BY id DESC')) || [];
  return rows.map((r) => ({ ...r, alt: typeof r.alt === 'string' ? JSON.parse(r.alt) : r.alt || {} }));
}

export async function setMediaAlt(id, locale, text) {
  const rows = await query('SELECT alt FROM media WHERE id = ? LIMIT 1', [id]);
  const current = rows?.[0]?.alt;
  const alt = { ...(typeof current === 'string' ? JSON.parse(current) : current || {}), [locale]: text };
  await query('UPDATE media SET alt = ? WHERE id = ?', [JSON.stringify(alt), id]);
}
```

- [ ] **Step 4: Write the upload route**

```js
// app/admin/api/media/route.js
import { NextResponse } from 'next/server';
import { auth } from '../../../../auth';
import { can } from '../../../../lib/auth/roles';
import { saveUpload, listMedia } from '../../../../lib/media';

const MAX_BYTES = 8 * 1024 * 1024;
const ALLOWED = ['image/webp', 'image/jpeg', 'image/png', 'image/svg+xml'];

export async function GET() {
  const session = await auth();
  if (!session?.user?.isAdmin) return NextResponse.json({ error: 'Not signed in' }, { status: 401 });
  return NextResponse.json({ media: await listMedia() });
}

export async function POST(request) {
  const session = await auth();
  if (!session?.user?.isAdmin) return NextResponse.json({ error: 'Not signed in' }, { status: 401 });
  if (!can(session.user.role, 'manage_media')) {
    return NextResponse.json({ error: 'Your role cannot upload media' }, { status: 403 });
  }

  const form = await request.formData();
  const file = form.get('file');
  if (!file || typeof file === 'string') {
    return NextResponse.json({ error: 'Choose a file to upload' }, { status: 400 });
  }
  if (!ALLOWED.includes(file.type)) {
    return NextResponse.json({ error: `${file.type} is not an accepted image type` }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  if (buffer.length > MAX_BYTES) {
    return NextResponse.json({ error: 'That image is larger than 8 MB' }, { status: 400 });
  }

  const saved = await saveUpload({ buffer, filename: file.name, mime: file.type });
  return NextResponse.json(saved, { status: 201 });
}
```

- [ ] **Step 5: Document the uploads path**

Append to `.env.local`:

```
# Uploads live outside the repo so a git-pull deploy never deletes them.
# Server value: /home/aeos365/dhakabypass-uploads
MEDIA_ROOT=
```

- [ ] **Step 6: Run the test to verify it passes**

Run: `npx vitest run tests/unit/media.test.js`
Expected: PASS, 6 tests.

- [ ] **Step 7: Commit**

```bash
git add lib/media.js app/admin/api/media/route.js tests/unit/media.test.js .env.local
git commit -m "feat(media): add upload handling and media library"
```

---

## Task 13: Revalidation on save

**Files:**
- Create: `lib/revalidate.js`, `lib/content/cache.js`, `tests/unit/revalidate.test.js`
- Modify: `app/[locale]/page.jsx`, `app/[locale]/[...slug]/page.jsx`

**Interfaces:**
- Consumes: `next/cache` → `unstable_cache`, `revalidateTag`.
- Produces:
  - `pageTag(slug): string` → `page:<slug>`
  - `LIST_TAG = 'pages:list'`
  - `revalidatePage(slug): void`
  - `getPageBySlugCached(slug)` and `getPageBlocksCached(pageId, slug)` in `lib/content/cache.js`

**Why a separate module:** `lib/content/pages.js` must stay free of `next/cache`
so the seed and migration scripts — and the Vitest DB tests — can keep using it
outside a Next runtime. The cached wrappers live alongside it instead.

This is the fix for defect 9: pages stop being `force-dynamic` and stop reading the whole table per request.

- [ ] **Step 1: Write the failing test**

```js
// tests/unit/revalidate.test.js
import { describe, it, expect } from 'vitest';
import { pageTag, LIST_TAG } from '../../lib/revalidate.js';

describe('cache tags', () => {
  it('namespaces page tags by slug', () => {
    expect(pageTag('travel/toll')).toBe('page:travel/toll');
    expect(pageTag('home')).toBe('page:home');
  });

  it('has a stable list tag', () => {
    expect(LIST_TAG).toBe('pages:list');
  });

  it('never produces a tag for an empty slug', () => {
    expect(() => pageTag('')).toThrow(/slug/i);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run tests/unit/revalidate.test.js`
Expected: FAIL — cannot resolve `lib/revalidate.js`.

- [ ] **Step 3: Write `lib/revalidate.js`**

```js
// lib/revalidate.js
import { revalidateTag } from 'next/cache';

export const LIST_TAG = 'pages:list';

export function pageTag(slug) {
  if (!slug) throw new Error('pageTag needs a slug');
  return `page:${slug}`;
}

/** Called by admin actions after a save, so the public page updates at once. */
export function revalidatePage(slug) {
  revalidateTag(pageTag(slug));
  revalidateTag(LIST_TAG);
}
```

- [ ] **Step 4: Write `lib/content/cache.js`**

```js
// lib/content/cache.js
import { unstable_cache } from 'next/cache';
import { getPageBySlug, getPageBlocks } from './pages.js';
import { pageTag, LIST_TAG } from '../revalidate.js';

/** Cached readers used by the public routes. The admin uses the uncached ones. */
export const getPageBySlugCached = (slug) =>
  unstable_cache(() => getPageBySlug(slug), ['page-by-slug', slug], {
    tags: [pageTag(slug), LIST_TAG],
  })();

export const getPageBlocksCached = (pageId, slug) =>
  unstable_cache(() => getPageBlocks(pageId), ['page-blocks', String(pageId)], {
    tags: [pageTag(slug)],
  })();
```

- [ ] **Step 5: Switch the public routes onto the cached readers**

In `app/[locale]/page.jsx`, change the import and the two calls:

```jsx
import { getPageBySlugCached, getPageBlocksCached } from '../../lib/content/cache.js';
```

```jsx
  const page = await getPageBySlugCached('home');
  if (!page) return <p className="db-empty">No home page has been created yet.</p>;
  const blocks = await getPageBlocksCached(page.id, 'home');
```

In `app/[locale]/[...slug]/page.jsx`, change the import and the two calls:

```jsx
import { getPageBySlugCached, getPageBlocksCached } from '../../../lib/content/cache.js';
```

In `load()`:

```js
  const page = await getPageBySlugCached(slug.join('/'));
```

In `CmsPage()`:

```js
  const blocks = await getPageBlocksCached(loaded.page.id, loaded.page.slug);
```

- [ ] **Step 6: Run the test and the build**

Run:
```bash
npx vitest run tests/unit/revalidate.test.js
npm run build
```
Expected: tests PASS (3); build succeeds; the `[locale]` routes are **not** listed as `ƒ (Dynamic)` in the build output.

- [ ] **Step 7: Commit**

```bash
git add lib/revalidate.js lib/content/cache.js app/[locale] tests/unit/revalidate.test.js
git commit -m "perf(content): cache public pages by tag instead of forcing dynamic"
```

---

## Task 14: Admin page tree

**Files:**
- Create: `lib/content/slug.js`, `app/admin/(dash)/pages-v2/page.jsx`, `app/admin/(dash)/pages-v2/actions.js`, `tests/unit/slug.test.js`

**Interfaces:**
- Consumes: `listPages`, `createPage`, `deletePage` from Task 8; `can`, `ROLES` from Task 4; `revalidatePage` from Task 13; `auth` from `auth.js`.
- Produces server actions:
  - `createPageAction(formData)` — requires `manage_pages`; slug must match `^[a-z0-9]+(?:[-/][a-z0-9]+)*$`
  - `deletePageAction(formData)` — requires `manage_pages`
  - `assertCan(action)` — shared guard, throws `Error('Your role cannot …')`
  - `lib/content/slug.js` → `normalizeSlug(value): string`, `isValidSlug(value): boolean`

**Why the helpers live in `lib/`:** Next 15 rejects any non-async export from a
`'use server'` module — *"Only async functions are allowed to be exported in a
'use server' file."* Pure helpers therefore cannot live in `actions.js`, and a
Vitest run could not import them from there either.

- [ ] **Step 1: Write the failing test**

```js
// tests/unit/slug.test.js
import { describe, it, expect } from 'vitest';
import { normalizeSlug, isValidSlug } from '../../lib/content/slug.js';

describe('normalizeSlug', () => {
  it('lowercases and hyphenates', () => {
    expect(normalizeSlug('Travel Info')).toBe('travel-info');
  });

  it('keeps nesting separators', () => {
    expect(normalizeSlug('Travel/Toll Rates')).toBe('travel/toll-rates');
  });

  it('strips leading and trailing separators', () => {
    expect(normalizeSlug('/travel/')).toBe('travel');
  });

  it('rejects an empty or unsafe slug', () => {
    expect(isValidSlug('')).toBe(false);
    expect(isValidSlug('../etc')).toBe(false);
    expect(isValidSlug('travel/toll')).toBe(true);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run tests/unit/slug.test.js`
Expected: FAIL — cannot resolve `lib/content/slug.js`.

- [ ] **Step 3: Write the slug helpers**

```js
// lib/content/slug.js
/** Pure helpers, kept out of the 'use server' module: Next 15 allows only
 *  async exports there, and tests need to import these directly. */
export function normalizeSlug(value) {
  return String(value || '')
    .toLowerCase()
    .split('/')
    .map((part) => part.replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''))
    .filter(Boolean)
    .join('/');
}

export function isValidSlug(value) {
  return /^[a-z0-9]+(?:[-/][a-z0-9]+)*$/.test(String(value || ''));
}
```

- [ ] **Step 4: Write the actions**

```js
// app/admin/(dash)/pages-v2/actions.js
'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '../../../../auth';
import { can } from '../../../../lib/auth/roles';
import { listPages, createPage, deletePage, getPageBySlug } from '../../../../lib/content/pages';
import { normalizeSlug, isValidSlug } from '../../../../lib/content/slug';
import { revalidatePage } from '../../../../lib/revalidate';

const ADMIN_PATH = '/admin/pages-v2';

export async function assertCan(action) {
  const session = await auth();
  if (!session?.user?.isAdmin) throw new Error('Sign in to continue');
  if (!can(session.user.role, action)) {
    throw new Error(`Your role cannot ${action.replace(/_/g, ' ')}`);
  }
  return session;
}

export async function listPagesAction() {
  await assertCan('manage_pages');
  return listPages();
}

export async function createPageAction(formData) {
  await assertCan('manage_pages');
  const title = String(formData.get('title') || '').trim();
  const slug = normalizeSlug(formData.get('slug') || title);

  if (!title) throw new Error('Give the page a title');
  if (!isValidSlug(slug)) throw new Error(`"${slug}" is not a usable address`);
  if (await getPageBySlug(slug)) throw new Error(`A page already lives at "${slug}"`);

  await createPage({ slug, title });
  revalidatePage(slug);
  revalidatePath(ADMIN_PATH);
}

export async function deletePageAction(formData) {
  await assertCan('manage_pages');
  const id = Number(formData.get('id'));
  const slug = String(formData.get('slug') || '');
  if (!id) throw new Error('No page selected');
  await deletePage(id);
  if (slug) revalidatePage(slug);
  revalidatePath(ADMIN_PATH);
}
```

- [ ] **Step 5: Write the page tree screen**

```jsx
// app/admin/(dash)/pages-v2/page.jsx
import Link from 'next/link';
import { listPagesAction, createPageAction, deletePageAction } from './actions';

export const dynamic = 'force-dynamic';

export default async function PageTree() {
  const pages = await listPagesAction();

  return (
    <div className="p-6 space-y-8">
      <header>
        <h1 className="text-2xl font-bold">Pages</h1>
        <p className="text-sm text-gray-500">Every page on the new site and its address.</p>
      </header>

      <form action={createPageAction} className="flex flex-wrap gap-3 items-end">
        <label className="flex flex-col text-sm">
          Title
          <input name="title" required className="border rounded px-3 py-2" />
        </label>
        <label className="flex flex-col text-sm">
          Address (optional)
          <input name="slug" placeholder="travel/toll" className="border rounded px-3 py-2" />
        </label>
        <button type="submit" className="px-4 py-2 rounded bg-black text-white">Create page</button>
      </form>

      <table className="w-full text-sm">
        <thead>
          <tr className="text-left border-b">
            <th className="py-2">Title</th><th>Address</th><th>Status</th><th></th>
          </tr>
        </thead>
        <tbody>
          {pages.map((p) => (
            <tr key={p.id} className="border-b">
              <td className="py-2">
                <Link href={`/admin/pages-v2/${p.id}`} className="underline">{p.title || '(untitled)'}</Link>
              </td>
              <td><code>/{p.slug}</code></td>
              <td>{p.status}</td>
              <td className="text-right">
                <form action={deletePageAction}>
                  <input type="hidden" name="id" value={p.id} />
                  <input type="hidden" name="slug" value={p.slug} />
                  <button type="submit" className="text-red-600">Delete</button>
                </form>
              </td>
            </tr>
          ))}
          {pages.length === 0 && (
            <tr><td colSpan={4} className="py-6 text-gray-500">No pages yet. Create the first one above.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
```

- [ ] **Step 6: Run the test and the build**

Run:
```bash
npx vitest run tests/unit/slug.test.js
npm run build
```
Expected: PASS, 4 tests. The build must succeed — it is what proves `actions.js`
exports only async functions.

- [ ] **Step 7: Commit**

```bash
git add lib/content/slug.js "app/admin/(dash)/pages-v2" tests/unit/slug.test.js
git commit -m "feat(admin): add page tree with create and delete"
```

---

## Task 15: Admin block editor

**Files:**
- Create: `lib/blocks/form.js`, `app/admin/(dash)/pages-v2/[id]/page.jsx`, `app/admin/(dash)/pages-v2/[id]/block-actions.js`, `components/admin/BlockFields.jsx`, `tests/unit/block-form.test.js`

**Interfaces:**
- Consumes: `getPageBlocks`, `addBlock`, `deleteBlock`, `reorderBlocks`, `duplicateBlock`, `saveBlockTranslation` (Task 8); `allBlocks`, `getBlock`, `validateBlockData`, `defaultBlockData` (Tasks 6–7); `assertCan` (Task 14); `revalidatePage` (Task 13).
- Produces server actions `addBlockAction`, `deleteBlockAction`, `moveBlockAction`, `duplicateBlockAction`, `saveTranslationAction` in `block-actions.js`, plus `parseBlockForm(type, formData): object` in `lib/blocks/form.js`.

**Same constraint as Task 14:** `parseBlockForm` is synchronous, so it cannot be
exported from a `'use server'` module. It lives in `lib/blocks/form.js`.

- [ ] **Step 1: Write the failing test**

```js
// tests/unit/block-form.test.js
import { describe, it, expect, beforeEach } from 'vitest';
import { resetRegistry } from '../../lib/blocks/registry.js';
import { registerAllBlocks } from '../../lib/blocks/index.js';
import { parseBlockForm } from '../../lib/blocks/form.js';

beforeEach(() => { resetRegistry(); registerAllBlocks(); });

function form(entries) {
  const fd = new FormData();
  for (const [k, v] of Object.entries(entries)) fd.set(k, v);
  return fd;
}

describe('parseBlockForm', () => {
  it('reads text and richtext fields', () => {
    const data = parseBlockForm('rich-text', form({ 'f.heading': 'Hi', 'f.body': '<p>x</p>' }));
    expect(data).toEqual({ heading: 'Hi', body: '<p>x</p>' });
  });

  it('parses a list field from JSON', () => {
    const stats = JSON.stringify([{ value: '48', unit: 'KM', label: 'Corridor' }]);
    expect(parseBlockForm('stat-row', form({ 'f.stats': stats })).stats).toHaveLength(1);
  });

  it('falls back to an empty list when the JSON is broken', () => {
    expect(parseBlockForm('stat-row', form({ 'f.stats': 'not json' })).stats).toEqual([]);
  });

  it('ignores fields the block type does not declare', () => {
    const data = parseBlockForm('rich-text', form({ 'f.body': '<p>x</p>', 'f.evil': 'nope' }));
    expect(data.evil).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run tests/unit/block-form.test.js`
Expected: FAIL — cannot resolve `lib/blocks/form.js`.

- [ ] **Step 3: Write the form parser**

```js
// lib/blocks/form.js
import { getBlock } from './registry.js';

/**
 * Reads only the fields the block type declares — anything else posted is
 * ignored. Form keys are prefixed `f.`.
 * Pure and synchronous, so it cannot live in the 'use server' module.
 */
export function parseBlockForm(type, formData) {
  const def = getBlock(type);
  if (!def) return {};
  const out = {};
  for (const field of def.fields) {
    const raw = formData.get(`f.${field.name}`);
    if (field.type === 'number') {
      out[field.name] = Number(raw ?? 0) || 0;
    } else if (field.type === 'list') {
      try {
        const parsed = JSON.parse(String(raw ?? '[]'));
        out[field.name] = Array.isArray(parsed) ? parsed : [];
      } catch {
        out[field.name] = [];
      }
    } else {
      out[field.name] = String(raw ?? '');
    }
  }
  return out;
}
```

- [ ] **Step 4: Write the block actions**

```js
// app/admin/(dash)/pages-v2/[id]/block-actions.js
'use server';

import { revalidatePath } from 'next/cache';
import { assertCan } from '../actions';
import { getBlock, validateBlockData, defaultBlockData } from '../../../../../lib/blocks/registry';
import { parseBlockForm } from '../../../../../lib/blocks/form';
import '../../../../../lib/blocks/index';
import {
  getPageBlocks, addBlock, deleteBlock, reorderBlocks, duplicateBlock, saveBlockTranslation,
} from '../../../../../lib/content/pages';
import { revalidatePage } from '../../../../../lib/revalidate';

const adminPath = (pageId) => `/admin/pages-v2/${pageId}`;

export async function addBlockAction(formData) {
  await assertCan('edit_blocks');
  const pageId = Number(formData.get('pageId'));
  const slug = String(formData.get('slug') || '');
  const type = String(formData.get('type') || '');
  if (!getBlock(type)) throw new Error(`"${type}" is not a block type`);

  await addBlock({ pageId, type, data: defaultBlockData(type) });
  revalidatePage(slug);
  revalidatePath(adminPath(pageId));
}

export async function deleteBlockAction(formData) {
  await assertCan('edit_blocks');
  const pageId = Number(formData.get('pageId'));
  await deleteBlock(Number(formData.get('blockId')));
  revalidatePage(String(formData.get('slug') || ''));
  revalidatePath(adminPath(pageId));
}

export async function duplicateBlockAction(formData) {
  await assertCan('edit_blocks');
  const pageId = Number(formData.get('pageId'));
  await duplicateBlock(Number(formData.get('blockId')));
  revalidatePage(String(formData.get('slug') || ''));
  revalidatePath(adminPath(pageId));
}

export async function moveBlockAction(formData) {
  await assertCan('edit_blocks');
  const pageId = Number(formData.get('pageId'));
  const blockId = Number(formData.get('blockId'));
  const direction = String(formData.get('direction'));

  const blocks = await getPageBlocks(pageId);
  const ids = blocks.map((b) => b.id);
  const i = ids.indexOf(blockId);
  const j = direction === 'up' ? i - 1 : i + 1;
  if (i === -1 || j < 0 || j >= ids.length) return;

  [ids[i], ids[j]] = [ids[j], ids[i]];
  await reorderBlocks(pageId, ids);
  revalidatePage(String(formData.get('slug') || ''));
  revalidatePath(adminPath(pageId));
}

export async function saveTranslationAction(formData) {
  const session = await assertCan('translate');
  const pageId = Number(formData.get('pageId'));
  const blockId = Number(formData.get('blockId'));
  const locale = String(formData.get('locale'));
  const type = String(formData.get('type'));
  const status = String(formData.get('status') || 'draft');

  const data = parseBlockForm(type, formData);
  const check = validateBlockData(type, data);
  // A draft may be incomplete; publishing may not.
  if (status === 'published' && !check.ok) throw new Error(check.errors.join('. '));

  await saveBlockTranslation({ blockId, locale, data, status, userId: Number(session.user.id) || null });
  revalidatePage(String(formData.get('slug') || ''));
  revalidatePath(adminPath(pageId));
}
```

- [ ] **Step 5: Write the field renderer**

```jsx
// components/admin/BlockFields.jsx
export default function BlockFields({ fields, data }) {
  return (
    <div className="flex flex-col gap-3">
      {fields.map((field) => {
        const value = data?.[field.name];
        const name = `f.${field.name}`;
        if (field.type === 'list') {
          return (
            <label key={field.name} className="flex flex-col text-sm">
              {field.label} <span className="text-gray-400">(JSON list)</span>
              <textarea name={name} rows={5} defaultValue={JSON.stringify(value ?? [], null, 2)}
                className="border rounded px-3 py-2 font-mono text-xs" />
            </label>
          );
        }
        if (field.type === 'richtext') {
          return (
            <label key={field.name} className="flex flex-col text-sm">
              {field.label}
              <textarea name={name} rows={6} defaultValue={value ?? ''} className="border rounded px-3 py-2" />
            </label>
          );
        }
        return (
          <label key={field.name} className="flex flex-col text-sm">
            {field.label}
            <input
              name={name}
              type={field.type === 'number' ? 'number' : 'text'}
              defaultValue={value ?? (field.type === 'number' ? 0 : '')}
              className="border rounded px-3 py-2"
            />
          </label>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 6: Write the editor screen**

```jsx
// app/admin/(dash)/pages-v2/[id]/page.jsx
import { notFound } from 'next/navigation';
import { LOCALES, LOCALE_LABELS } from '../../../../../lib/i18n/locales';
import { allBlocks, getBlock, defaultBlockData } from '../../../../../lib/blocks/registry';
import '../../../../../lib/blocks/index';
import { listPages, getPageBlocks } from '../../../../../lib/content/pages';
import { translationStatus } from '../../../../../lib/content/resolve';
import BlockFields from '../../../../../components/admin/BlockFields';
import { assertCan } from '../actions';
import {
  addBlockAction, deleteBlockAction, duplicateBlockAction, moveBlockAction, saveTranslationAction,
} from './block-actions';

export const dynamic = 'force-dynamic';

export default async function BlockEditor({ params, searchParams }) {
  await assertCan('translate');
  const { id } = await params;
  const { locale = 'en' } = await searchParams;
  const pageId = Number(id);

  const page = (await listPages()).find((p) => p.id === pageId);
  if (!page) notFound();
  const blocks = await getPageBlocks(pageId);

  return (
    <div className="p-6 space-y-8">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold">{page.title || page.slug}</h1>
        <p className="text-sm text-gray-500"><code>/{page.slug}</code></p>
        <nav className="flex gap-2 pt-2">
          {LOCALES.map((l) => (
            <a key={l} href={`?locale=${l}`}
               className={`px-3 py-1 rounded text-sm ${l === locale ? 'bg-black text-white' : 'bg-gray-100'}`}>
              {LOCALE_LABELS[l]}
            </a>
          ))}
        </nav>
      </header>

      <form action={addBlockAction} className="flex gap-2 items-end">
        <input type="hidden" name="pageId" value={pageId} />
        <input type="hidden" name="slug" value={page.slug} />
        <label className="flex flex-col text-sm">
          Add a block
          <select name="type" className="border rounded px-3 py-2">
            {allBlocks().map((b) => <option key={b.type} value={b.type}>{b.label}</option>)}
          </select>
        </label>
        <button type="submit" className="px-4 py-2 rounded bg-black text-white">Add</button>
      </form>

      <div className="flex flex-col gap-6">
        {blocks.map((block, i) => {
          const def = getBlock(block.type);
          if (!def) return null;
          const row = block.translations.find((t) => t.locale === locale);
          const english = block.translations.find((t) => t.locale === 'en');
          const status = translationStatus(block.translations, locale);
          const data = row?.data ?? (locale === 'en' ? defaultBlockData(block.type) : english?.data ?? {});

          return (
            <section key={block.id} className="border rounded p-4 space-y-4">
              <div className="flex flex-wrap gap-3 items-center justify-between">
                <h2 className="font-semibold">
                  {def.label}
                  <span className="ml-3 text-xs uppercase tracking-wider text-gray-500">{status}</span>
                </h2>
                <div className="flex gap-2">
                  {['up', 'down'].map((direction) => (
                    <form key={direction} action={moveBlockAction}>
                      <input type="hidden" name="pageId" value={pageId} />
                      <input type="hidden" name="slug" value={page.slug} />
                      <input type="hidden" name="blockId" value={block.id} />
                      <input type="hidden" name="direction" value={direction} />
                      <button type="submit" disabled={direction === 'up' ? i === 0 : i === blocks.length - 1}
                              className="px-2 py-1 border rounded disabled:opacity-30">
                        {direction === 'up' ? '↑' : '↓'}
                      </button>
                    </form>
                  ))}
                  <form action={duplicateBlockAction}>
                    <input type="hidden" name="pageId" value={pageId} />
                    <input type="hidden" name="slug" value={page.slug} />
                    <input type="hidden" name="blockId" value={block.id} />
                    <button type="submit" className="px-2 py-1 border rounded">Duplicate</button>
                  </form>
                  <form action={deleteBlockAction}>
                    <input type="hidden" name="pageId" value={pageId} />
                    <input type="hidden" name="slug" value={page.slug} />
                    <input type="hidden" name="blockId" value={block.id} />
                    <button type="submit" className="px-2 py-1 border rounded text-red-600">Delete</button>
                  </form>
                </div>
              </div>

              {locale !== 'en' && english ? (
                <details className="text-sm bg-gray-50 rounded p-3">
                  <summary className="cursor-pointer">English source</summary>
                  <pre className="mt-2 whitespace-pre-wrap text-xs">{JSON.stringify(english.data, null, 2)}</pre>
                </details>
              ) : null}

              <form action={saveTranslationAction} className="space-y-3">
                <input type="hidden" name="pageId" value={pageId} />
                <input type="hidden" name="slug" value={page.slug} />
                <input type="hidden" name="blockId" value={block.id} />
                <input type="hidden" name="locale" value={locale} />
                <input type="hidden" name="type" value={block.type} />
                <BlockFields fields={def.fields} data={data} />
                <div className="flex gap-2">
                  <button type="submit" name="status" value="draft" className="px-4 py-2 border rounded">
                    Save draft
                  </button>
                  <button type="submit" name="status" value="published" className="px-4 py-2 rounded bg-black text-white">
                    Publish
                  </button>
                </div>
              </form>
            </section>
          );
        })}
        {blocks.length === 0 && <p className="text-gray-500">No blocks yet. Add one above.</p>}
      </div>
    </div>
  );
}
```

- [ ] **Step 7: Run the test and the build**

Run:
```bash
npx vitest run tests/unit/block-form.test.js
npm run build
```
Expected: PASS, 4 tests, and a successful build (proving `block-actions.js`
exports only async functions).

- [ ] **Step 8: Commit**

```bash
git add lib/blocks/form.js "app/admin/(dash)/pages-v2/[id]" components/admin/BlockFields.jsx tests/unit/block-form.test.js
git commit -m "feat(admin): add block editor with per-locale drafts and publishing"
```

---

## Task 16: Translation status dashboard

**Files:**
- Create: `app/admin/(dash)/translations/page.jsx`, `tests/unit/translation-summary.test.js`, `lib/content/summary.js`

**Interfaces:**
- Consumes: `listPages`, `getPageBlocks`; `countMissing` from Task 5.
- Produces: `summarizeTranslations(pagesWithBlocks): Array<{ pageId, slug, title, total, missing: { bn, zh } }>` in `lib/content/summary.js`.

- [ ] **Step 1: Write the failing test**

```js
// tests/unit/translation-summary.test.js
import { describe, it, expect } from 'vitest';
import { summarizeTranslations } from '../../lib/content/summary.js';

const en = (s = 'published') => ({ locale: 'en', data: {}, status: s });
const bn = (s) => ({ locale: 'bn', data: {}, status: s });

describe('summarizeTranslations', () => {
  it('counts blocks still needing each locale', () => {
    const [row] = summarizeTranslations([{
      id: 1, slug: 'travel', title: 'Travel Info',
      blocks: [
        { id: 1, translations: [en(), bn('published')] },
        { id: 2, translations: [en()] },
        { id: 3, translations: [en(), bn('draft')] },
      ],
    }]);
    expect(row).toMatchObject({ pageId: 1, slug: 'travel', total: 3 });
    expect(row.missing.bn).toBe(2);
    expect(row.missing.zh).toBe(3);
  });

  it('handles a page with no blocks', () => {
    const [row] = summarizeTranslations([{ id: 9, slug: 'empty', title: 'Empty', blocks: [] }]);
    expect(row.total).toBe(0);
    expect(row.missing.bn).toBe(0);
  });

  it('returns an empty array for no pages', () => {
    expect(summarizeTranslations([])).toEqual([]);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run tests/unit/translation-summary.test.js`
Expected: FAIL — cannot resolve `lib/content/summary.js`.

- [ ] **Step 3: Write the implementation**

```js
// lib/content/summary.js
import { countMissing } from './resolve.js';
import { LOCALES, DEFAULT_LOCALE } from '../i18n/locales.js';

/** Per-page translation coverage, for the admin dashboard. */
export function summarizeTranslations(pagesWithBlocks) {
  return (pagesWithBlocks || []).map((page) => {
    const rows = (page.blocks || []).map((b) => b.translations || []);
    const missing = {};
    for (const locale of LOCALES) {
      if (locale === DEFAULT_LOCALE) continue;
      missing[locale] = countMissing(rows, locale);
    }
    return { pageId: page.id, slug: page.slug, title: page.title, total: rows.length, missing };
  });
}
```

- [ ] **Step 4: Write the dashboard screen**

```jsx
// app/admin/(dash)/translations/page.jsx
import Link from 'next/link';
import { LOCALE_LABELS } from '../../../../lib/i18n/locales';
import { listPages, getPageBlocks } from '../../../../lib/content/pages';
import { summarizeTranslations } from '../../../../lib/content/summary';
import { assertCan } from '../pages-v2/actions';

export const dynamic = 'force-dynamic';

export default async function TranslationDashboard() {
  await assertCan('translate');

  const pages = await listPages();
  const withBlocks = await Promise.all(
    pages.map(async (p) => ({ ...p, blocks: await getPageBlocks(p.id) }))
  );
  const rows = summarizeTranslations(withBlocks);

  return (
    <div className="p-6 space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Translation status</h1>
        <p className="text-sm text-gray-500">
          Blocks not yet published in a language fall back to English on the live site.
        </p>
      </header>

      <table className="w-full text-sm">
        <thead>
          <tr className="text-left border-b">
            <th className="py-2">Page</th><th>Blocks</th>
            <th>{LOCALE_LABELS.bn}</th><th>{LOCALE_LABELS.zh}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.pageId} className="border-b">
              <td className="py-2">
                <Link href={`/admin/pages-v2/${r.pageId}`} className="underline">{r.title || r.slug}</Link>
              </td>
              <td>{r.total}</td>
              <td>{r.missing.bn === 0 ? 'Complete' : `${r.missing.bn} missing`}</td>
              <td>{r.missing.zh === 0 ? 'Complete' : `${r.missing.zh} missing`}</td>
            </tr>
          ))}
          {rows.length === 0 && <tr><td colSpan={4} className="py-6 text-gray-500">No pages yet.</td></tr>}
        </tbody>
      </table>
    </div>
  );
}
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `npx vitest run tests/unit/translation-summary.test.js`
Expected: PASS, 3 tests.

- [ ] **Step 6: Commit**

```bash
git add lib/content/summary.js "app/admin/(dash)/translations" tests/unit/translation-summary.test.js
git commit -m "feat(admin): add translation status dashboard"
```

---

## Task 17: End-to-end smoke suite

**Files:**
- Create: `tests/e2e/locales.spec.js`, `tests/e2e/theme.spec.js`, `tests/e2e/legacy.spec.js`

**Interfaces:**
- Consumes: the running dev server and a seeded `home` page (Task 11, Step 9).
- Produces: the regression net for every later phase.

- [ ] **Step 1: Write the locale spec**

```js
// tests/e2e/locales.spec.js
import { test, expect } from '@playwright/test';

const LOCALES = [
  { code: 'en', lang: 'en', nav: 'Travel Info' },
  { code: 'bn', lang: 'bn', nav: 'ভ্রমণ তথ্য' },
  { code: 'zh', lang: 'zh-Hans', nav: '出行信息' },
];

for (const l of LOCALES) {
  test(`/${l.code} renders with no console errors`, async ({ page }) => {
    const errors = [];
    page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));

    const response = await page.goto(`/${l.code}`);
    expect(response.status()).toBe(200);

    await expect(page.locator('.db-root')).toHaveAttribute('lang', l.lang);
    await expect(page.getByRole('navigation', { name: 'Primary' })).toContainText(l.nav);
    expect(errors).toEqual([]);
  });
}

test('an unknown locale is a 404', async ({ page }) => {
  const response = await page.goto('/fr');
  expect(response.status()).toBe(404);
});

test('the locale switch keeps you on the same page', async ({ page }) => {
  await page.goto('/en');
  await page.getByRole('navigation', { name: /Language|ভাষা|语言/ }).getByText('বাংলা').click();
  await expect(page).toHaveURL(/\/bn$/);
});
```

- [ ] **Step 2: Write the theme spec**

```js
// tests/e2e/theme.spec.js
import { test, expect } from '@playwright/test';

test('theme choice applies and survives a reload', async ({ page }) => {
  await page.goto('/en');
  const root = page.locator('html');

  // System is the default and must leave the attribute off.
  await expect(root).not.toHaveAttribute('data-theme', /.*/);

  await page.getByRole('button', { name: 'Dark' }).click();
  await expect(root).toHaveAttribute('data-theme', 'dark');

  await page.reload();
  await expect(root).toHaveAttribute('data-theme', 'dark');

  await page.getByRole('button', { name: 'System' }).click();
  await expect(root).not.toHaveAttribute('data-theme', /.*/);
});

test('the page never flashes the wrong theme', async ({ page }) => {
  await page.goto('/en');
  await page.getByRole('button', { name: 'Dark' }).click();
  await page.reload({ waitUntil: 'commit' });
  // Stamped before first paint by ThemeScript.
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
});
```

- [ ] **Step 3: Write the legacy-site guard**

```js
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
  });
}
```

- [ ] **Step 4: Write the responsive spec**

```js
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

    // Either the full nav or the compact row must be visible — never neither.
    const full = page.getByRole('navigation', { name: 'Primary' });
    const compact = page.getByRole('navigation', { name: 'Primary, compact' });
    const visible = (await full.isVisible()) || (await compact.isVisible());
    expect(visible, 'no navigation visible at this width').toBe(true);
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

  const links = page.locator('.db-nav-mobile a');
  const count = await links.count();
  expect(count).toBeGreaterThan(0);
  for (let i = 0; i < count; i += 1) {
    const box = await links.nth(i).boundingBox();
    expect(box.height, `nav link ${i} is only ${box.height}px tall`).toBeGreaterThanOrEqual(44);
  }
  await context.close();
});
```

- [ ] **Step 5: Run the suite**

Run: `npm run test:e2e`
Expected: all specs PASS. If a legacy spec fails, the change that broke it must be reverted — the live site is not allowed to regress during this plan.

- [ ] **Step 6: Run everything and build**

Run:
```bash
npm test
npm run test:e2e
npm run build
```
Expected: all green; build succeeds with `output: 'standalone'` intact.

- [ ] **Step 7: Commit**

```bash
git add tests/e2e
git commit -m "test(e2e): add locale, theme, responsive and legacy-site suites"
```

---

## Self-Review

**Spec coverage (P0 + P1 sections of the design spec):**

| Spec requirement | Task |
|---|---|
| Locale routing `/[locale]/`, en/bn/zh | 2, 11 |
| English fallback, never a broken page | 5, 7, 11 |
| Block renderer | 6, 7 |
| Structural schema (pages, blocks, translations, media, menus, revisions, audit, redirects) | 3 |
| Admin shell | 14, 15, 16 |
| Auth with roles (admin/editor/translator) | 4 |
| Role resolved from the DB for every provider, failing closed | 4 (`resolveUserRole`, no fallback role) |
| Two-gate authorization (`isAdmin` AND `can()`) at every admin entry point | Global Constraints; enforced in 12, 14, 15, 16 |
| Media pipeline, uploads outside the repo | 12 |
| Design tokens, functional status colour | 9 |
| Type scale, self-hosted fonts, tabular numerals | 9 |
| Theme switcher, Light/Dark/System, defaults to system | 10 |
| Corridor components, signage plates | 9 (tokens + plate styles); the corridor strip itself is P2, Plan 2 |
| Nav works at every width (defect 6) | 11 (`min-width: 768px`, not `xl`, plus a compact scrollable row below it) |
| Fully responsive 320px–2560px, no horizontal body scroll | 9 (base rules), 11 (fluid chrome), 17 (six-viewport spec) |
| Browser baseline; no `color-mix`/`@container`/`:has()` for meaning | 9 (explicit wash tokens + a grep step that fails the task if reintroduced) |
| Touch targets ≥ 44×44, zoom not disabled | 9 (`pointer:coarse` rule), 11 (`viewport` export), 17 (assertions) |
| Static generation + targeted revalidation (defect 9) | 13 |
| `prefers-reduced-motion` | 9 |
| Per-locale `lang` attributes | 11 |
| No CDN fonts | 9 |
| Live site must not regress | 17 |

**Deferred to Plan 2 (P2+P3), by design:** `segments`, `interchanges`, `toll_rates`, `advisories` and their editors; the corridor strip and interactive map; the five Travel Info pages; the remaining seventeen block types; `next/image` adoption; sitemap, robots, structured data, Umami; the redirect map and cutover.

**Placeholder scan:** none. Every step carries the code it needs.

**Pre-flight corrections applied before execution** (four defects found by running
the code rather than reading it):

1. `safeFilename('///.png')` returns `'png'`, not `'file.png'` — `path.extname('.png')`
   is `''`, so a dotfile name becomes the stem. Assertion corrected and a genuine
   empty-name case (`'///'` → `'file'`) added.
2. Next 15 allows only async exports from a `'use server'` module. `normalizeSlug`,
   `isValidSlug` and `parseBlockForm` moved to `lib/content/slug.js` and
   `lib/blocks/form.js`; the action files import them.
3. `package.json` has no `"type": "module"`, so bare Node cannot import `lib/*.js`.
   The home seed became `scripts/seed-home.mjs` using raw SQL, and the cached readers
   moved to `lib/content/cache.js` so `pages.js` never imports `next/cache`.
4. The font filenames in `design-tokens.css` did not match what `fetch-fonts.mjs`
   writes — a silent fallback with no error. The script now prints the exact
   `@font-face` blocks, and Task 9 gained a step that diffs CSS srcs against disk.

**Type consistency check performed:**
- `resolveTranslation` returns `{ data, locale, fallback }` — consumed with those exact names in `BlockRenderer` (Task 7) and `generateMetadata` (Task 11).
- `getPageBlocks` returns `translations: [{locale, data, status}]` — the shape `resolveTranslation`, `translationStatus` and `countMissing` all expect.
- `assertCan` is defined in `pages-v2/actions.js` (Task 14) and imported by both `block-actions.js` (Task 15) and the translations dashboard (Task 16) from the correct relative depths.
- Block form keys are `f.<fieldName>` in both `BlockFields.jsx` and `parseBlockForm`.
- `pageTag`/`LIST_TAG` names match between `lib/revalidate.js` and the cached readers.
- `ROLES` is imported into `auth.js` in Task 4 and used by `can()` throughout.
