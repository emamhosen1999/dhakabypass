# Dhaka Bypass Reinnovation — P2+P3: Domain Data & Travel Info — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the P0+P1 foundation into a site that answers the question a real visitor arrives with — *can I drive it, where do I get on, what does it cost, is it open right now* — by adding the operational data model, its admin editors, the corridor strip, and the five Travel Info pages.

**Architecture:** Four domain tables (`segments`, `interchanges`, `toll_rates`, `advisories`) hold data, not prose. A pure formatting layer converts between stored metres and the engineers' `K3+900` notation. Presentational components take data as props and are unit-testable without a database. The five Travel Info pages are ordinary CMS pages whose bodies are blocks, so an editor can reorder them — but the operational blocks read from the domain tables rather than from block content.

**Tech Stack:** Next.js 15 (App Router), React 19, Tailwind v4, `mysql2`, Auth.js v5, Vitest, Playwright. No new runtime dependencies.

**Spec:** `docs/superpowers/specs/2026-08-31-dhakabypass-reinnovation-design.md`
**Carried findings from P0+P1:** `docs/superpowers/specs/2026-09-01-p0-p1-carried-findings.md` — read it; several items below are preconditions it records.

## Global Constraints

- Node `>=18.18.0` locally; **Node 22** on the cPanel/Passenger server.
- `output: 'standalone'` in `next.config.mjs` — **must not be removed**. Build locally, commit artifacts, `git pull` on the server. Never `next build` or `npm install` on the shared host.
- Database access is `mysql2` via `lib/db.js` only. **No ORM, no Prisma.**
- **No new npm dependencies.**
- Locales are exactly `en`, `bn`, `zh`. `en` is default and fallback. **No machine translation.**
- **Authorization is two gates, always both.** Every admin entry point checks `session.user.isAdmin` AND `can(session.user.role, action)`, via `assertCan` from `lib/auth/assert-can.js`. Never `can()` alone.
- **`lib/content/pages.js` must not import `next/cache`.** Cached wrappers live in `lib/content/cache.js`. The same rule applies to every new domain query module in this plan.
- Multi-statement writes go through `withTransaction` from `lib/db.js`, and every statement inside the callback uses the bound `q` — never the module-level `query`.
- Prototype-safe lookups: any object indexed by a value that could be a user-supplied string uses `Object.hasOwn`.
- **Error messages are user-facing.** No stack traces, internal paths, or raw SQL text reaches the browser.
- **No new CSS feature outside the browser baseline** — last two versions of Chrome/Edge/Firefox/Safari, iOS Safari 15.4+, Android Chrome, Samsung Internet 19+. Specifically **no `color-mix()`, `@container` or `:has()`** for anything load-bearing.
- **Fully responsive 320px–2560px**, no horizontal body scroll, interactive targets ≥44×44 CSS px, and **every control must sit inside the viewport** — `.db-root` sets `overflow-x:hidden`, which clips rather than scrolls, so an off-screen control is invisible to a scrollWidth check.
- WCAG 2.2 AA: **status is never communicated by colour alone**, visible focus states, `prefers-reduced-motion` respected, correct `lang` per locale.
- Digits that align in columns use `font-variant-numeric: tabular-nums`.
- Do NOT modify `app/(site)/`, `content/`, `lib/content.js` (the FILE), `lib/admin-sections.js`, `lib/news.js`, `lib/gallery.js`, `components/SiteHeader.jsx`, `components/SiteFooter.jsx`, `middleware.js`, `scripts/db-setup.mjs`, or any legacy admin screen under `app/admin/(dash)/` outside `pages-v2/` and `translations/`. The live site must keep working; `tests/e2e/legacy.spec.js` is the tripwire.
- Every task ends with a commit. Never `--no-verify`. End commit messages with:
  `Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>`

### Two scope decisions recorded up front

**1. The interactive geographic map is NOT built in this plan.** The spec calls for a schematic strip plus one real map. Item 8 of the spec's data request — corridor GeoJSON or KML from the design consultant — has not arrived. Building a geographic map now would require inventing coordinates, which is precisely what the illustrative-data labelling exists to prevent. This plan builds the **schematic corridor strip**, which needs no coordinates, adds no dependency, and loads on 3G. The geographic map becomes a follow-up task gated on real geometry. `interchanges` still carries nullable `lat`/`lng` so the data is ready when it arrives.

**2. All operational data ships labelled as illustrative until DBEDC confirms it.** A single site setting drives a visible banner on every page that renders operational figures. Publishing an unverified toll rate as fact on the operator's own site is worse than publishing nothing. Task 4 builds the mechanism; the seed data sets the flag true.

---

## File Structure

**Created**

| Path | Responsibility |
|---|---|
| `scripts/db-setup-v3.mjs` | Creates the four domain tables. Idempotent. |
| `scripts/seed-corridor.mjs` | Seeds illustrative corridor data via raw SQL |
| `lib/corridor/chainage.js` | `K3+900` ↔ metres formatting and parsing (pure) |
| `lib/corridor/segments.js` | Segment queries + derived corridor totals (DB, no Next imports) |
| `lib/corridor/interchanges.js` | Interchange queries (DB) |
| `lib/corridor/tolls.js` | Toll rate queries + effective-date resolution (DB) |
| `lib/corridor/advisories.js` | Advisory queries + active-now resolution (DB) |
| `lib/corridor/cache.js` | Tag-cached wrappers for all four, mirroring `lib/content/cache.js` |
| `lib/settings.js` | Site settings incl. the illustrative-data flag |
| `components/corridor/CorridorStrip.jsx` | The schematic strip (presentational) |
| `components/corridor/InterchangeTable.jsx` | Accessible table equivalent of the strip |
| `components/corridor/TollTable.jsx` | Toll rates by vehicle class |
| `components/corridor/ProgressBar.jsx` | Works-complete bar with per-segment breakdown |
| `components/corridor/AdvisoryBar.jsx` | Site-wide advisory strip |
| `components/corridor/IllustrativeNotice.jsx` | The "pending official confirmation" banner |
| `app/[locale]/travel/layout.jsx` | Travel Info section shell |
| `app/[locale]/travel/status/page.jsx` | What's open now |
| `app/[locale]/travel/toll/page.jsx` | Toll rates |
| `app/[locale]/travel/route/page.jsx` | Interchanges and entry/exit |
| `app/[locale]/travel/facilities/page.jsx` | Service areas and emergency |
| `app/[locale]/travel/rules/page.jsx` | Speed limits and prohibited vehicles |
| `app/admin/(dash)/corridor/page.jsx` | Domain-data admin hub |
| `app/admin/(dash)/corridor/actions.js` | Server actions for all four tables |
| `app/admin/(dash)/corridor/segments/page.jsx` | Segment editor |
| `app/admin/(dash)/corridor/interchanges/page.jsx` | Interchange editor |
| `app/admin/(dash)/corridor/tolls/page.jsx` | Toll rate editor |
| `app/admin/(dash)/corridor/advisories/page.jsx` | Advisory editor |
| `tests/unit/chainage.test.js`, `tests/unit/corridor-*.test.js` | Pure-function tests |
| `tests/db/corridor-*.test.js` | Query-layer tests |
| `tests/e2e/travel.spec.js` | Travel Info end-to-end |

**Modified**

| Path | Change |
|---|---|
| `app/design-tokens.css` | Corridor strip, table and advisory styles |
| `app/[locale]/layout.jsx` | Render `AdvisoryBar` above the header |
| `lib/i18n/ui.js` | Travel Info chrome strings in all three locales |
| `package.json` | `db:setup:v3`, `db:seed:corridor` scripts |

---

## Task 1: Domain schema

**Files:**
- Create: `scripts/db-setup-v3.mjs`, `tests/db/corridor-schema.test.js`
- Modify: `package.json`

**Interfaces:**
- Consumes: `scripts/load-env.mjs` → `loadEnv()`.
- Produces: tables `segments`, `interchanges`, `toll_rates`, `advisories`, `site_settings`. `node scripts/db-setup-v3.mjs [--database=name]` is idempotent.

**Chainage is stored as INTEGER METRES**, never as a formatted string. `K3+900` is a display format, produced by Task 2. Storing metres makes ordering, range queries and arithmetic correct for free.

- [ ] **Step 1: Write the failing test**

```js
// tests/db/corridor-schema.test.js
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import mysql from 'mysql2/promise';
import { execFileSync } from 'node:child_process';

const DB = process.env.DB_NAME_TEST;
let conn;

beforeAll(async () => {
  execFileSync('node', ['scripts/db-setup-v2.mjs', `--database=${DB}`], { stdio: 'inherit' });
  execFileSync('node', ['scripts/db-setup-v3.mjs', `--database=${DB}`], { stdio: 'inherit' });
  conn = await mysql.createConnection({
    host: process.env.DB_HOST, port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER, password: process.env.DB_PASSWORD || '', database: DB,
  });
});
afterAll(async () => { if (conn) await conn.end(); });

async function cols(table) {
  const [rows] = await conn.query(
    'SELECT COLUMN_NAME AS c, COLUMN_TYPE AS t FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=? AND TABLE_NAME=?',
    [DB, table]
  );
  return Object.fromEntries(rows.map((r) => [r.c, r.t]));
}

describe('domain schema', () => {
  it('creates every domain table', async () => {
    const [rows] = await conn.query(
      'SELECT TABLE_NAME AS t FROM information_schema.TABLES WHERE TABLE_SCHEMA=?', [DB]
    );
    const tables = rows.map((r) => r.t);
    for (const t of ['segments', 'interchanges', 'toll_rates', 'advisories', 'site_settings']) {
      expect(tables, `missing ${t}`).toContain(t);
    }
  });

  it('stores chainage as integer metres, not text', async () => {
    const seg = await cols('segments');
    expect(seg.from_m).toMatch(/^int/);
    expect(seg.to_m).toMatch(/^int/);
    expect((await cols('interchanges')).chainage_m).toMatch(/^int/);
  });

  it('scopes segment and advisory status to a known set', async () => {
    expect((await cols('segments')).status).toBe("enum('open','construction','planned')");
    expect((await cols('advisories')).severity).toBe("enum('info','warning','closure')");
  });

  it('carries per-locale names as JSON and nullable coordinates', async () => {
    const ic = await cols('interchanges');
    expect(ic.names).toMatch(/^json/);
    expect(ic.lat).toMatch(/^decimal/);
    expect(ic.lng).toMatch(/^decimal/);
  });

  it('keys toll rates by class and effective date', async () => {
    const t = await cols('toll_rates');
    expect(t).toHaveProperty('vehicle_class');
    expect(t).toHaveProperty('amount_bdt');
    expect(t).toHaveProperty('effective_from');
  });

  it('is safe to run twice', () => {
    execFileSync('node', ['scripts/db-setup-v3.mjs', `--database=${DB}`], { stdio: 'inherit' });
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run tests/db/corridor-schema.test.js`
Expected: FAIL — `scripts/db-setup-v3.mjs` does not exist.

- [ ] **Step 3: Write the implementation**

```js
// scripts/db-setup-v3.mjs
/**
 * Creates the operational (corridor) tables. Idempotent.
 *   node scripts/db-setup-v3.mjs [--database=name]
 *
 * Chainage is stored as INTEGER METRES everywhere. "K3+900" is a display
 * format produced by lib/corridor/chainage.js — never a stored value, so
 * ordering and range queries stay correct without parsing strings.
 */
import mysql from 'mysql2/promise';
import { loadEnv } from './load-env.mjs';

loadEnv();

const arg = process.argv.find((a) => a.startsWith('--database='));
const DB_NAME = arg ? arg.split('=')[1] : process.env.DB_NAME || 'dhakabypass';
const { DB_HOST = '127.0.0.1', DB_PORT = '3306', DB_USER = 'root', DB_PASSWORD = '' } = process.env;

const db = await mysql.createConnection({
  host: DB_HOST, port: Number(DB_PORT), user: DB_USER, password: DB_PASSWORD,
  database: DB_NAME, multipleStatements: true,
});

try {
  await db.query(`
    CREATE TABLE IF NOT EXISTS segments (
      id         INT AUTO_INCREMENT PRIMARY KEY,
      from_m     INT NOT NULL,
      to_m       INT NOT NULL,
      status     ENUM('open','construction','planned') NOT NULL DEFAULT 'planned',
      opened_on  DATE NULL,
      labels     JSON NULL,
      sort_order INT NOT NULL DEFAULT 0,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_from (from_m),
      INDEX idx_status (status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

    CREATE TABLE IF NOT EXISTS interchanges (
      id          INT AUTO_INCREMENT PRIMARY KEY,
      chainage_m  INT NOT NULL,
      names       JSON NOT NULL,
      kind        ENUM('interchange','toll_plaza','service_area','u_loop','pedestrian_overpass') NOT NULL DEFAULT 'interchange',
      status      ENUM('open','construction','planned') NOT NULL DEFAULT 'planned',
      connects_to VARCHAR(191) NOT NULL DEFAULT '',
      facilities  JSON NULL,
      lat         DECIMAL(10,7) NULL,
      lng         DECIMAL(10,7) NULL,
      updated_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_chainage (chainage_m),
      INDEX idx_kind (kind)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

    CREATE TABLE IF NOT EXISTS toll_rates (
      id             INT AUTO_INCREMENT PRIMARY KEY,
      vehicle_class  VARCHAR(64) NOT NULL,
      class_labels   JSON NOT NULL,
      class_order    INT NOT NULL DEFAULT 0,
      section        VARCHAR(191) NOT NULL DEFAULT '',
      amount_bdt     DECIMAL(10,2) NOT NULL,
      effective_from DATE NOT NULL,
      updated_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_effective (effective_from),
      INDEX idx_class (vehicle_class, effective_from)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

    CREATE TABLE IF NOT EXISTS advisories (
      id         INT AUTO_INCREMENT PRIMARY KEY,
      severity   ENUM('info','warning','closure') NOT NULL DEFAULT 'info',
      messages   JSON NOT NULL,
      starts_at  DATETIME NULL,
      ends_at    DATETIME NULL,
      is_active  TINYINT(1) NOT NULL DEFAULT 1,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_active (is_active, starts_at, ends_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

    CREATE TABLE IF NOT EXISTS site_settings (
      setting_key VARCHAR(64) NOT NULL PRIMARY KEY,
      value       JSON NOT NULL,
      updated_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
  console.log(`Corridor schema ready on ${DB_NAME}`);
} catch (err) {
  console.error('Schema creation failed:', err.message);
  process.exitCode = 1;
} finally {
  await db.end();
}
```

- [ ] **Step 4: Add the npm script**

In `package.json`, beside `db:setup:v2`, add:

```json
"db:setup:v3": "node scripts/db-setup-v3.mjs"
```

- [ ] **Step 5: Run the test to verify it passes**

Run:
```bash
npx vitest run tests/db/corridor-schema.test.js
npm run db:setup:v3
```
Expected: PASS, 6 tests. The script run against the dev database reports success.

- [ ] **Step 6: Commit**

```bash
git add scripts/db-setup-v3.mjs tests/db/corridor-schema.test.js package.json
git commit -m "feat(corridor): add operational schema for segments, interchanges, tolls and advisories"
```

---

## Task 2: Chainage formatting

**Files:**
- Create: `lib/corridor/chainage.js`, `tests/unit/chainage.test.js`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `formatChainage(metres): string` — `3900` → `'K3+900'`
  - `parseChainage(text): number | null` — `'K3+900'` → `3900`; `null` when unparseable
  - `formatKm(metres, digits = 1): string` — `48000` → `'48.0'`
  - `metresToKm(metres): number`

Highway chainage is written `K<kilometres>+<metres>` with the metre part always three digits. This is the notation the engineers and the gazette use; the site must match it exactly.

- [ ] **Step 1: Write the failing test**

```js
// tests/unit/chainage.test.js
import { describe, it, expect } from 'vitest';
import { formatChainage, parseChainage, formatKm, metresToKm } from '../../lib/corridor/chainage.js';

describe('formatChainage', () => {
  it('writes the engineers\' notation with a three-digit metre part', () => {
    expect(formatChainage(3900)).toBe('K3+900');
    expect(formatChainage(0)).toBe('K0+000');
    expect(formatChainage(48000)).toBe('K48+000');
    expect(formatChainage(9400)).toBe('K9+400');
  });

  it('pads the metre part', () => {
    expect(formatChainage(1005)).toBe('K1+005');
    expect(formatChainage(1050)).toBe('K1+050');
  });

  it('returns an empty string for a non-number', () => {
    expect(formatChainage(null)).toBe('');
    expect(formatChainage(undefined)).toBe('');
    expect(formatChainage('3900')).toBe('');
    expect(formatChainage(NaN)).toBe('');
  });

  it('never emits a negative chainage', () => {
    expect(formatChainage(-100)).toBe('');
  });
});

describe('parseChainage', () => {
  it('reads the notation back', () => {
    expect(parseChainage('K3+900')).toBe(3900);
    expect(parseChainage('K0+000')).toBe(0);
    expect(parseChainage('K48+000')).toBe(48000);
  });

  it('tolerates lowercase and surrounding space', () => {
    expect(parseChainage('  k3+900 ')).toBe(3900);
  });

  it('accepts a plain metre count', () => {
    expect(parseChainage('3900')).toBe(3900);
  });

  it('returns null for anything it cannot read', () => {
    expect(parseChainage('')).toBe(null);
    expect(parseChainage('K3')).toBe(null);
    expect(parseChainage('three km')).toBe(null);
    expect(parseChainage(null)).toBe(null);
    expect(parseChainage('K3+9000')).toBe(null);
  });

  it('round-trips with formatChainage', () => {
    for (const m of [0, 5, 999, 1000, 3900, 48000]) {
      expect(parseChainage(formatChainage(m))).toBe(m);
    }
  });
});

describe('formatKm', () => {
  it('renders kilometres for display', () => {
    expect(formatKm(48000)).toBe('48.0');
    expect(formatKm(18000)).toBe('18.0');
    expect(formatKm(3900)).toBe('3.9');
    expect(formatKm(48000, 0)).toBe('48');
  });

  it('returns an empty string for a non-number', () => {
    expect(formatKm(null)).toBe('');
  });
});

describe('metresToKm', () => {
  it('converts without formatting', () => {
    expect(metresToKm(48000)).toBe(48);
    expect(metresToKm(3900)).toBe(3.9);
    expect(metresToKm(null)).toBe(0);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run tests/unit/chainage.test.js`
Expected: FAIL — cannot resolve `lib/corridor/chainage.js`.

- [ ] **Step 3: Write the implementation**

```js
// lib/corridor/chainage.js
/**
 * Highway chainage. Stored as integer metres; displayed as K<km>+<mmm>,
 * which is the notation the engineers and the gazette use.
 */

const isMetres = (v) => typeof v === 'number' && Number.isFinite(v) && v >= 0;

export function formatChainage(metres) {
  if (!isMetres(metres)) return '';
  const km = Math.floor(metres / 1000);
  const m = Math.round(metres % 1000);
  return `K${km}+${String(m).padStart(3, '0')}`;
}

/** Reads "K3+900", "k3+900" or a bare metre count. Null when unreadable. */
export function parseChainage(text) {
  if (typeof text !== 'string') return null;
  const s = text.trim().toLowerCase();
  if (!s) return null;

  const withK = /^k(\d+)\+(\d{3})$/.exec(s);
  if (withK) return Number(withK[1]) * 1000 + Number(withK[2]);

  const bare = /^\d+$/.exec(s);
  if (bare) return Number(s);

  return null;
}

export function metresToKm(metres) {
  return isMetres(metres) ? metres / 1000 : 0;
}

export function formatKm(metres, digits = 1) {
  if (!isMetres(metres)) return '';
  return metresToKm(metres).toFixed(digits);
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run tests/unit/chainage.test.js`
Expected: PASS, 13 tests.

- [ ] **Step 5: Commit**

```bash
git add lib/corridor/chainage.js tests/unit/chainage.test.js
git commit -m "feat(corridor): add chainage formatting and parsing"
```

---

## Task 3: Corridor geometry helpers

**Files:**
- Create: `lib/corridor/geometry.js`, `tests/unit/corridor-geometry.test.js`

**Interfaces:**
- Consumes: `lib/corridor/chainage.js` → `metresToKm`.
- Produces:
  - `corridorExtent(segments): { from_m, to_m, length_m }` — the full span
  - `openLength(segments): number` — metres with `status === 'open'`
  - `percentOpen(segments): number` — 0–100, one decimal
  - `positionPercent(metres, extent): number` — where a chainage sits along the strip, 0–100, clamped
  - `sortByChainage(items): array` — non-mutating, by `chainage_m`
  - `overlaps(a, b): boolean` — do two segments overlap

These are pure so the strip's maths is testable without a database or a browser. `percentOpen` is what the progress figure on the home page and the status page both read — it must be derived from segment data, never typed in by hand, or the two will drift.

- [ ] **Step 1: Write the failing test**

```js
// tests/unit/corridor-geometry.test.js
import { describe, it, expect } from 'vitest';
import {
  corridorExtent, openLength, percentOpen, positionPercent, sortByChainage, overlaps,
} from '../../lib/corridor/geometry.js';

const SEGMENTS = [
  { from_m: 0, to_m: 3900, status: 'construction' },
  { from_m: 3900, to_m: 21900, status: 'open' },
  { from_m: 21900, to_m: 48000, status: 'construction' },
];

describe('corridorExtent', () => {
  it('spans the lowest start to the highest end', () => {
    expect(corridorExtent(SEGMENTS)).toEqual({ from_m: 0, to_m: 48000, length_m: 48000 });
  });

  it('handles a single segment', () => {
    expect(corridorExtent([{ from_m: 1000, to_m: 5000, status: 'open' }]))
      .toEqual({ from_m: 1000, to_m: 5000, length_m: 4000 });
  });

  it('returns a zero extent for no segments', () => {
    expect(corridorExtent([])).toEqual({ from_m: 0, to_m: 0, length_m: 0 });
    expect(corridorExtent(null)).toEqual({ from_m: 0, to_m: 0, length_m: 0 });
  });
});

describe('openLength', () => {
  it('totals only open segments', () => {
    expect(openLength(SEGMENTS)).toBe(18000);
  });

  it('is zero when nothing is open', () => {
    expect(openLength([{ from_m: 0, to_m: 100, status: 'planned' }])).toBe(0);
    expect(openLength([])).toBe(0);
  });
});

describe('percentOpen', () => {
  it('derives the progress figure from the segments', () => {
    expect(percentOpen(SEGMENTS)).toBe(37.5);
  });

  it('is 100 when everything is open', () => {
    expect(percentOpen([{ from_m: 0, to_m: 48000, status: 'open' }])).toBe(100);
  });

  it('is 0, not NaN, for an empty corridor', () => {
    expect(percentOpen([])).toBe(0);
  });
});

describe('positionPercent', () => {
  const extent = { from_m: 0, to_m: 48000, length_m: 48000 };

  it('places a chainage along the strip', () => {
    expect(positionPercent(0, extent)).toBe(0);
    expect(positionPercent(48000, extent)).toBe(100);
    expect(positionPercent(24000, extent)).toBe(50);
  });

  it('clamps outside the extent instead of overflowing the strip', () => {
    expect(positionPercent(-5000, extent)).toBe(0);
    expect(positionPercent(99000, extent)).toBe(100);
  });

  it('returns 0 for a zero-length corridor rather than dividing by zero', () => {
    expect(positionPercent(100, { from_m: 0, to_m: 0, length_m: 0 })).toBe(0);
  });
});

describe('sortByChainage', () => {
  it('orders without mutating the input', () => {
    const input = [{ chainage_m: 900 }, { chainage_m: 100 }];
    const out = sortByChainage(input);
    expect(out.map((x) => x.chainage_m)).toEqual([100, 900]);
    expect(input.map((x) => x.chainage_m)).toEqual([900, 100]);
  });

  it('tolerates an empty or missing list', () => {
    expect(sortByChainage([])).toEqual([]);
    expect(sortByChainage(null)).toEqual([]);
  });
});

describe('overlaps', () => {
  it('detects a real overlap', () => {
    expect(overlaps({ from_m: 0, to_m: 100 }, { from_m: 50, to_m: 150 })).toBe(true);
  });

  it('treats touching endpoints as adjacent, not overlapping', () => {
    expect(overlaps({ from_m: 0, to_m: 100 }, { from_m: 100, to_m: 200 })).toBe(false);
  });

  it('detects containment', () => {
    expect(overlaps({ from_m: 0, to_m: 500 }, { from_m: 100, to_m: 200 })).toBe(true);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run tests/unit/corridor-geometry.test.js`
Expected: FAIL — cannot resolve `lib/corridor/geometry.js`.

- [ ] **Step 3: Write the implementation**

```js
// lib/corridor/geometry.js
/**
 * Pure corridor maths. Kept free of the database and the DOM so the strip's
 * geometry and the published progress figure are both testable directly.
 */

const list = (v) => (Array.isArray(v) ? v : []);

export function corridorExtent(segments) {
  const rows = list(segments);
  if (rows.length === 0) return { from_m: 0, to_m: 0, length_m: 0 };
  const from_m = Math.min(...rows.map((s) => s.from_m));
  const to_m = Math.max(...rows.map((s) => s.to_m));
  return { from_m, to_m, length_m: to_m - from_m };
}

export function openLength(segments) {
  return list(segments)
    .filter((s) => s.status === 'open')
    .reduce((total, s) => total + (s.to_m - s.from_m), 0);
}

/**
 * The published "works complete" figure. Derived from the segments so the
 * home page and the status page cannot drift apart — never hand-entered.
 */
export function percentOpen(segments) {
  const { length_m } = corridorExtent(segments);
  if (length_m <= 0) return 0;
  return Math.round((openLength(segments) / length_m) * 1000) / 10;
}

/** Where a chainage sits along the strip, 0–100. Clamped so a bad row cannot
 *  push a marker outside the rail. */
export function positionPercent(metres, extent) {
  if (!extent || extent.length_m <= 0) return 0;
  const raw = ((metres - extent.from_m) / extent.length_m) * 100;
  return Math.min(100, Math.max(0, Math.round(raw * 100) / 100));
}

export function sortByChainage(items) {
  return [...list(items)].sort((a, b) => a.chainage_m - b.chainage_m);
}

/** Touching endpoints are adjacent, not overlapping — segments meet at a point. */
export function overlaps(a, b) {
  return a.from_m < b.to_m && b.from_m < a.to_m;
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run tests/unit/corridor-geometry.test.js`
Expected: PASS, 15 tests.

- [ ] **Step 5: Commit**

```bash
git add lib/corridor/geometry.js tests/unit/corridor-geometry.test.js
git commit -m "feat(corridor): add pure corridor geometry helpers"
```

---

## Task 4: Site settings and the illustrative-data flag

**Files:**
- Create: `lib/settings.js`, `components/corridor/IllustrativeNotice.jsx`, `tests/db/settings.test.js`

**Interfaces:**
- Consumes: `lib/db.js` → `query`; `lib/i18n/locales.js` → `DEFAULT_LOCALE`.
- Produces:
  - `getSetting(key, fallback = null): Promise<any>`
  - `setSetting(key, value): Promise<void>`
  - `isDataIllustrative(): Promise<boolean>` — reads `corridor.illustrative`, **defaults to `true`**
  - `<IllustrativeNotice locale />` — the banner

**The default is `true` on purpose.** If the setting is missing, absent or unreadable, the site says the data is provisional. The failure mode of wrongly labelling real data as provisional is a small loss of authority; the failure mode of presenting invented toll rates as official fact on the operator's own site is materially worse.

- [ ] **Step 1: Write the failing test**

```js
// tests/db/settings.test.js
import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import { execFileSync } from 'node:child_process';

const DB = process.env.DB_NAME_TEST;
process.env.DB_NAME = DB;

let S;
beforeAll(async () => {
  execFileSync('node', ['scripts/db-setup-v2.mjs', `--database=${DB}`], { stdio: 'inherit' });
  execFileSync('node', ['scripts/db-setup-v3.mjs', `--database=${DB}`], { stdio: 'inherit' });
  S = await import('../../lib/settings.js');
});

beforeEach(async () => {
  const { query } = await import('../../lib/db.js');
  await query('DELETE FROM site_settings');
});

describe('settings', () => {
  it('round-trips a value', async () => {
    await S.setSetting('demo.key', { a: 1 });
    expect(await S.getSetting('demo.key')).toEqual({ a: 1 });
  });

  it('returns the fallback for a missing key', async () => {
    expect(await S.getSetting('nope', 'default')).toBe('default');
    expect(await S.getSetting('nope')).toBe(null);
  });

  it('overwrites rather than duplicating', async () => {
    await S.setSetting('demo.key', 1);
    await S.setSetting('demo.key', 2);
    expect(await S.getSetting('demo.key')).toBe(2);
  });

  it('defaults the illustrative flag to TRUE when unset', async () => {
    expect(await S.isDataIllustrative()).toBe(true);
  });

  it('honours the flag once set', async () => {
    await S.setSetting('corridor.illustrative', false);
    expect(await S.isDataIllustrative()).toBe(false);
    await S.setSetting('corridor.illustrative', true);
    expect(await S.isDataIllustrative()).toBe(true);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run tests/db/settings.test.js`
Expected: FAIL — cannot resolve `lib/settings.js`.

- [ ] **Step 3: Write the settings module**

```js
// lib/settings.js
import { query } from './db.js';

const asJson = (v) => (typeof v === 'string' ? JSON.parse(v) : v);

export async function getSetting(key, fallback = null) {
  const rows = await query('SELECT value FROM site_settings WHERE setting_key = ? LIMIT 1', [key]);
  if (!rows || rows.length === 0) return fallback;
  try {
    return asJson(rows[0].value);
  } catch {
    return fallback;
  }
}

export async function setSetting(key, value) {
  await query(
    `INSERT INTO site_settings (setting_key, value) VALUES (?, ?)
     ON DUPLICATE KEY UPDATE value = VALUES(value)`,
    [key, JSON.stringify(value)]
  );
}

/**
 * Whether operational figures are still awaiting official confirmation.
 *
 * DEFAULTS TO TRUE. If the setting is missing or unreadable the site says the
 * data is provisional. Wrongly labelling real data as provisional costs a
 * little authority; presenting unverified toll rates as official fact on the
 * operator's own site is far worse.
 */
export async function isDataIllustrative() {
  const value = await getSetting('corridor.illustrative', true);
  return value !== false;
}
```

- [ ] **Step 4: Write the notice component**

```jsx
// components/corridor/IllustrativeNotice.jsx
import { t } from '../../lib/i18n/ui';

/**
 * Shown wherever operational figures appear while they await official
 * confirmation from DBEDC/RHD. role="note" rather than "alert": it is
 * standing context, not an interruption.
 */
export default function IllustrativeNotice({ locale }) {
  return (
    <aside className="db-illustrative" role="note">
      <span className="db-illustrative-tag">{t(locale, 'provisional')}</span>
      <span>{t(locale, 'provisionalBody')}</span>
    </aside>
  );
}
```

- [ ] **Step 5: Add the strings to `lib/i18n/ui.js`**

Add these keys to EACH of the three locale objects in `UI`:

```js
// en
provisional: 'Provisional',
provisionalBody: 'These figures are awaiting official confirmation and may change.',
// bn
provisional: 'অস্থায়ী',
provisionalBody: 'এই তথ্য সরকারি নিশ্চিতকরণের অপেক্ষায় রয়েছে এবং পরিবর্তিত হতে পারে।',
// zh
provisional: '暂定',
provisionalBody: '以下数据尚待官方确认，可能会有变动。',
```

- [ ] **Step 6: Add the styles to `app/design-tokens.css`**

Append:

```css
/* Status is never colour alone: this carries a text tag as well. */
.db-illustrative{display:flex;flex-wrap:wrap;align-items:baseline;gap:8px 12px;
  max-width:var(--db-shell);margin:0 auto;padding:10px clamp(12px,3vw,20px);
  border-left:3px solid var(--db-build);background:var(--db-build-wash);
  color:var(--db-ink-2);font-size:.88rem;}
.db-illustrative-tag{font-family:var(--db-font-display);font-weight:700;font-size:.72rem;
  letter-spacing:.12em;text-transform:uppercase;color:var(--db-build);white-space:nowrap;}
```

- [ ] **Step 7: Run the tests to verify they pass**

Run:
```bash
npx vitest run tests/db/settings.test.js tests/unit/ui-strings.test.js
```
Expected: both PASS. `ui-strings.test.js` asserts every key exists in every locale, so it fails if you missed one — that is deliberate.

- [ ] **Step 8: Commit**

```bash
git add lib/settings.js components/corridor/IllustrativeNotice.jsx lib/i18n/ui.js app/design-tokens.css tests/db/settings.test.js
git commit -m "feat(corridor): add site settings and the provisional-data notice"
```

---

## Task 5: Segment and interchange queries

**Files:**
- Create: `lib/corridor/segments.js`, `lib/corridor/interchanges.js`, `tests/db/corridor-segments.test.js`

**Interfaces:**
- Consumes: `lib/db.js` → `query`, `withTransaction`; `lib/corridor/geometry.js`; `lib/content/resolve.js` → `resolveTranslation` is NOT used here (these rows carry a `names`/`labels` JSON map keyed by locale, not translation rows).
- Produces:
  - `listSegments(): Promise<Array<{id, from_m, to_m, status, opened_on, labels, sort_order}>>` — ordered by `from_m`
  - `saveSegment({id?, from_m, to_m, status, opened_on, labels}): Promise<number>` — rejects `to_m <= from_m` and any overlap with another segment
  - `deleteSegment(id): Promise<void>`
  - `corridorSummary(): Promise<{ extent, openLength, percentOpen, segments }>`
  - `listInterchanges(): Promise<Array<...>>` — ordered by `chainage_m`
  - `saveInterchange({id?, chainage_m, names, kind, status, connects_to, facilities, lat, lng}): Promise<number>`
  - `deleteInterchange(id): Promise<void>`
  - `localeName(row, locale): string` — reads the `names` map with English fallback

**Neither module may import anything from Next** — the cached wrappers live in Task 6, and these must stay usable from seed scripts and Vitest.

- [ ] **Step 1: Write the failing test**

```js
// tests/db/corridor-segments.test.js
import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest';
import { execFileSync } from 'node:child_process';

const DB = process.env.DB_NAME_TEST;
process.env.DB_NAME = DB;

let S, I;
beforeAll(async () => {
  execFileSync('node', ['scripts/db-setup-v2.mjs', `--database=${DB}`], { stdio: 'inherit' });
  execFileSync('node', ['scripts/db-setup-v3.mjs', `--database=${DB}`], { stdio: 'inherit' });
  S = await import('../../lib/corridor/segments.js');
  I = await import('../../lib/corridor/interchanges.js');
});

beforeEach(async () => {
  const { query } = await import('../../lib/db.js');
  await query('DELETE FROM segments');
  await query('DELETE FROM interchanges');
});

afterAll(async () => {
  const { getPool } = await import('../../lib/db.js');
  const pool = getPool();
  if (pool) await pool.end();
});

describe('segments', () => {
  it('stores and lists in chainage order', async () => {
    await S.saveSegment({ from_m: 21900, to_m: 48000, status: 'construction', labels: { en: 'South' } });
    await S.saveSegment({ from_m: 0, to_m: 21900, status: 'open', labels: { en: 'North' } });
    const rows = await S.listSegments();
    expect(rows.map((r) => r.from_m)).toEqual([0, 21900]);
    expect(rows[0].labels.en).toBe('North');
  });

  it('rejects a segment that ends before it starts', async () => {
    await expect(S.saveSegment({ from_m: 500, to_m: 100, status: 'open' }))
      .rejects.toThrow(/end.*after.*start/i);
  });

  it('rejects a segment overlapping an existing one', async () => {
    await S.saveSegment({ from_m: 0, to_m: 10000, status: 'open' });
    await expect(S.saveSegment({ from_m: 5000, to_m: 15000, status: 'open' }))
      .rejects.toThrow(/overlap/i);
  });

  it('allows a segment that starts exactly where another ends', async () => {
    await S.saveSegment({ from_m: 0, to_m: 10000, status: 'open' });
    await expect(S.saveSegment({ from_m: 10000, to_m: 20000, status: 'construction' }))
      .resolves.toBeTypeOf('number');
  });

  it('lets a segment be updated without colliding with itself', async () => {
    const id = await S.saveSegment({ from_m: 0, to_m: 10000, status: 'open' });
    await expect(S.saveSegment({ id, from_m: 0, to_m: 12000, status: 'open' }))
      .resolves.toBe(id);
    expect((await S.listSegments())[0].to_m).toBe(12000);
  });

  it('derives the corridor summary from stored segments', async () => {
    await S.saveSegment({ from_m: 0, to_m: 3900, status: 'construction' });
    await S.saveSegment({ from_m: 3900, to_m: 21900, status: 'open' });
    await S.saveSegment({ from_m: 21900, to_m: 48000, status: 'construction' });
    const summary = await S.corridorSummary();
    expect(summary.extent.length_m).toBe(48000);
    expect(summary.openLength).toBe(18000);
    expect(summary.percentOpen).toBe(37.5);
    expect(summary.segments).toHaveLength(3);
  });

  it('deletes', async () => {
    const id = await S.saveSegment({ from_m: 0, to_m: 100, status: 'open' });
    await S.deleteSegment(id);
    expect(await S.listSegments()).toEqual([]);
  });
});

describe('interchanges', () => {
  it('stores and lists in chainage order', async () => {
    await I.saveInterchange({ chainage_m: 21900, names: { en: 'Purbachal' }, kind: 'interchange' });
    await I.saveInterchange({ chainage_m: 0, names: { en: 'Kodda' }, kind: 'interchange' });
    const rows = await I.listInterchanges();
    expect(rows.map((r) => r.chainage_m)).toEqual([0, 21900]);
  });

  it('requires an English name', async () => {
    await expect(I.saveInterchange({ chainage_m: 0, names: {}, kind: 'interchange' }))
      .rejects.toThrow(/english name/i);
  });

  it('keeps coordinates nullable until the survey data arrives', async () => {
    const id = await I.saveInterchange({ chainage_m: 100, names: { en: 'X' }, kind: 'interchange' });
    const row = (await I.listInterchanges()).find((r) => r.id === id);
    expect(row.lat).toBe(null);
    expect(row.lng).toBe(null);
  });

  it('reads a localised name with English fallback', () => {
    const row = { names: { en: 'Bhulta', bn: 'ভুলতা' } };
    expect(I.localeName(row, 'bn')).toBe('ভুলতা');
    expect(I.localeName(row, 'zh')).toBe('Bhulta');
    expect(I.localeName({ names: {} }, 'en')).toBe('');
  });

  it('deletes', async () => {
    const id = await I.saveInterchange({ chainage_m: 0, names: { en: 'X' }, kind: 'interchange' });
    await I.deleteInterchange(id);
    expect(await I.listInterchanges()).toEqual([]);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run tests/db/corridor-segments.test.js`
Expected: FAIL — cannot resolve `lib/corridor/segments.js`.

- [ ] **Step 3: Write `lib/corridor/segments.js`**

```js
// lib/corridor/segments.js
import { query, withTransaction } from '../db.js';
import { corridorExtent, openLength, percentOpen, overlaps } from './geometry.js';

const asJson = (v) => (typeof v === 'string' ? JSON.parse(v) : v);

const shape = (row) => ({
  ...row,
  labels: row.labels ? asJson(row.labels) : {},
});

export async function listSegments() {
  const rows = (await query(
    'SELECT id, from_m, to_m, status, opened_on, labels, sort_order FROM segments ORDER BY from_m, id'
  )) || [];
  return rows.map(shape);
}

/**
 * Insert or update one segment. Validation happens INSIDE the transaction with
 * the existing rows locked, so two concurrent saves cannot both pass an overlap
 * check and then both write.
 */
export async function saveSegment({ id = null, from_m, to_m, status, opened_on = null, labels = {} }) {
  const from = Number(from_m);
  const to = Number(to_m);
  if (!Number.isFinite(from) || !Number.isFinite(to)) {
    throw new Error('Chainage must be a number of metres');
  }
  if (to <= from) {
    throw new Error('A segment must end after it starts');
  }

  return withTransaction(async (q) => {
    const existing = await q('SELECT id, from_m, to_m FROM segments FOR UPDATE');
    for (const row of existing) {
      if (id && row.id === id) continue;
      if (overlaps({ from_m: from, to_m: to }, row)) {
        throw new Error('That range overlaps an existing segment');
      }
    }

    if (id) {
      await q(
        'UPDATE segments SET from_m=?, to_m=?, status=?, opened_on=?, labels=? WHERE id=?',
        [from, to, status, opened_on || null, JSON.stringify(labels || {}), id]
      );
      return id;
    }
    const res = await q(
      'INSERT INTO segments (from_m, to_m, status, opened_on, labels) VALUES (?, ?, ?, ?, ?)',
      [from, to, status, opened_on || null, JSON.stringify(labels || {})]
    );
    return res.insertId;
  });
}

export async function deleteSegment(id) {
  await query('DELETE FROM segments WHERE id = ?', [id]);
}

/** The single source of the published progress figure. */
export async function corridorSummary() {
  const segments = await listSegments();
  return {
    extent: corridorExtent(segments),
    openLength: openLength(segments),
    percentOpen: percentOpen(segments),
    segments,
  };
}
```

- [ ] **Step 4: Write `lib/corridor/interchanges.js`**

```js
// lib/corridor/interchanges.js
import { query } from '../db.js';
import { DEFAULT_LOCALE } from '../i18n/locales.js';

const asJson = (v) => (typeof v === 'string' ? JSON.parse(v) : v);

const shape = (row) => ({
  ...row,
  names: row.names ? asJson(row.names) : {},
  facilities: row.facilities ? asJson(row.facilities) : [],
  lat: row.lat === null ? null : Number(row.lat),
  lng: row.lng === null ? null : Number(row.lng),
});

export async function listInterchanges() {
  const rows = (await query(
    `SELECT id, chainage_m, names, kind, status, connects_to, facilities, lat, lng
     FROM interchanges ORDER BY chainage_m, id`
  )) || [];
  return rows.map(shape);
}

/** Own-property read with English fallback — the names map is data, so a key
 *  like "constructor" must not resolve up the prototype chain. */
export function localeName(row, locale) {
  const names = row?.names || {};
  if (Object.hasOwn(names, locale) && names[locale]) return names[locale];
  if (Object.hasOwn(names, DEFAULT_LOCALE) && names[DEFAULT_LOCALE]) return names[DEFAULT_LOCALE];
  return '';
}

export async function saveInterchange({
  id = null, chainage_m, names = {}, kind = 'interchange',
  status = 'planned', connects_to = '', facilities = [], lat = null, lng = null,
}) {
  const ch = Number(chainage_m);
  if (!Number.isFinite(ch) || ch < 0) throw new Error('Chainage must be a number of metres');
  if (!names || !names.en) throw new Error('An English name is required');

  const params = [
    ch, JSON.stringify(names), kind, status, connects_to,
    JSON.stringify(facilities || []),
    lat === null || lat === '' ? null : Number(lat),
    lng === null || lng === '' ? null : Number(lng),
  ];

  if (id) {
    await query(
      `UPDATE interchanges SET chainage_m=?, names=?, kind=?, status=?, connects_to=?,
       facilities=?, lat=?, lng=? WHERE id=?`,
      [...params, id]
    );
    return id;
  }
  const res = await query(
    `INSERT INTO interchanges (chainage_m, names, kind, status, connects_to, facilities, lat, lng)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    params
  );
  return res.insertId;
}

export async function deleteInterchange(id) {
  await query('DELETE FROM interchanges WHERE id = ?', [id]);
}
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `npx vitest run tests/db/corridor-segments.test.js`
Expected: PASS, 12 tests.

- [ ] **Step 6: Confirm neither module imports Next**

Run:
```bash
grep -c "next/" lib/corridor/segments.js lib/corridor/interchanges.js
```
Expected: `0` for both. These must stay runnable from seed scripts and Vitest.

- [ ] **Step 7: Commit**

```bash
git add lib/corridor/segments.js lib/corridor/interchanges.js tests/db/corridor-segments.test.js
git commit -m "feat(corridor): add segment and interchange query layers"
```

---

## Task 6: Toll and advisory queries

**Files:**
- Create: `lib/corridor/tolls.js`, `lib/corridor/advisories.js`, `tests/db/corridor-tolls.test.js`

**Interfaces:**
- Consumes: `lib/db.js` → `query`; `lib/i18n/locales.js` → `DEFAULT_LOCALE`.
- Produces:
  - `listTollRates({ on = new Date() } = {}): Promise<Array<...>>` — the rate **in force on that date** for each vehicle class, ordered by `class_order`
  - `listAllTollRates(): Promise<Array<...>>` — every row including superseded and future, for the admin
  - `saveTollRate({id?, vehicle_class, class_labels, class_order, section, amount_bdt, effective_from}): Promise<number>`
  - `deleteTollRate(id): Promise<void>`
  - `formatTaka(amount): string` — `1150` → `'৳ 1,150'`
  - `activeAdvisories({ at = new Date() } = {}): Promise<Array<...>>` — active, within window, most severe first
  - `listAllAdvisories(): Promise<Array<...>>`
  - `saveAdvisory({id?, severity, messages, starts_at, ends_at, is_active}): Promise<number>`
  - `deleteAdvisory(id): Promise<void>`
  - `localeMessage(row, locale): string`

**A toll table must show one rate per class** — the one in force today — not every historical row. Getting this wrong publishes a superseded price beside the current one.

- [ ] **Step 1: Write the failing test**

```js
// tests/db/corridor-tolls.test.js
import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest';
import { execFileSync } from 'node:child_process';

const DB = process.env.DB_NAME_TEST;
process.env.DB_NAME = DB;

let T, A;
beforeAll(async () => {
  execFileSync('node', ['scripts/db-setup-v2.mjs', `--database=${DB}`], { stdio: 'inherit' });
  execFileSync('node', ['scripts/db-setup-v3.mjs', `--database=${DB}`], { stdio: 'inherit' });
  T = await import('../../lib/corridor/tolls.js');
  A = await import('../../lib/corridor/advisories.js');
});

beforeEach(async () => {
  const { query } = await import('../../lib/db.js');
  await query('DELETE FROM toll_rates');
  await query('DELETE FROM advisories');
});

afterAll(async () => {
  const { getPool } = await import('../../lib/db.js');
  const pool = getPool();
  if (pool) await pool.end();
});

describe('toll rates', () => {
  it('returns the rate in force, not every historical row', async () => {
    await T.saveTollRate({ vehicle_class: 'car', class_labels: { en: 'Car' }, class_order: 1,
      amount_bdt: 100, effective_from: '2025-01-01' });
    await T.saveTollRate({ vehicle_class: 'car', class_labels: { en: 'Car' }, class_order: 1,
      amount_bdt: 150, effective_from: '2026-01-01' });

    const rates = await T.listTollRates({ on: new Date('2026-06-01') });
    expect(rates).toHaveLength(1);
    expect(Number(rates[0].amount_bdt)).toBe(150);
  });

  it('ignores a rate that is not yet in force', async () => {
    await T.saveTollRate({ vehicle_class: 'car', class_labels: { en: 'Car' }, class_order: 1,
      amount_bdt: 100, effective_from: '2025-01-01' });
    await T.saveTollRate({ vehicle_class: 'car', class_labels: { en: 'Car' }, class_order: 1,
      amount_bdt: 999, effective_from: '2099-01-01' });

    const rates = await T.listTollRates({ on: new Date('2026-06-01') });
    expect(Number(rates[0].amount_bdt)).toBe(100);
  });

  it('orders by class_order, not alphabetically', async () => {
    await T.saveTollRate({ vehicle_class: 'truck', class_labels: { en: 'Truck' }, class_order: 3,
      amount_bdt: 400, effective_from: '2025-01-01' });
    await T.saveTollRate({ vehicle_class: 'car', class_labels: { en: 'Car' }, class_order: 1,
      amount_bdt: 100, effective_from: '2025-01-01' });

    const rates = await T.listTollRates({ on: new Date('2026-06-01') });
    expect(rates.map((r) => r.vehicle_class)).toEqual(['car', 'truck']);
  });

  it('returns nothing when no rate is in force yet', async () => {
    await T.saveTollRate({ vehicle_class: 'car', class_labels: { en: 'Car' }, class_order: 1,
      amount_bdt: 100, effective_from: '2099-01-01' });
    expect(await T.listTollRates({ on: new Date('2026-06-01') })).toEqual([]);
  });

  it('rejects a negative amount', async () => {
    await expect(T.saveTollRate({ vehicle_class: 'car', class_labels: { en: 'Car' },
      class_order: 1, amount_bdt: -5, effective_from: '2025-01-01' }))
      .rejects.toThrow(/negative|zero or more/i);
  });

  it('shows every row to the admin, superseded and future included', async () => {
    await T.saveTollRate({ vehicle_class: 'car', class_labels: { en: 'Car' }, class_order: 1,
      amount_bdt: 100, effective_from: '2025-01-01' });
    await T.saveTollRate({ vehicle_class: 'car', class_labels: { en: 'Car' }, class_order: 1,
      amount_bdt: 150, effective_from: '2099-01-01' });
    expect(await T.listAllTollRates()).toHaveLength(2);
  });
});

describe('formatTaka', () => {
  it('formats with the taka sign and thousands separators', () => {
    expect(T.formatTaka(1150)).toBe('৳ 1,150');
    expect(T.formatTaka(100)).toBe('৳ 100');
    expect(T.formatTaka('250.00')).toBe('৳ 250');
  });

  it('keeps paisa only when they are non-zero', () => {
    expect(T.formatTaka(99.5)).toBe('৳ 99.50');
  });

  it('returns an empty string for a non-number', () => {
    expect(T.formatTaka(null)).toBe('');
    expect(T.formatTaka('abc')).toBe('');
  });
});

describe('advisories', () => {
  it('returns only active advisories inside their window', async () => {
    await A.saveAdvisory({ severity: 'info', messages: { en: 'Live' },
      starts_at: '2026-01-01 00:00:00', ends_at: '2027-01-01 00:00:00', is_active: 1 });
    await A.saveAdvisory({ severity: 'info', messages: { en: 'Expired' },
      starts_at: '2025-01-01 00:00:00', ends_at: '2025-02-01 00:00:00', is_active: 1 });
    await A.saveAdvisory({ severity: 'info', messages: { en: 'Switched off' },
      starts_at: null, ends_at: null, is_active: 0 });

    const live = await A.activeAdvisories({ at: new Date('2026-06-01') });
    expect(live).toHaveLength(1);
    expect(live[0].messages.en).toBe('Live');
  });

  it('treats null start and end as always-on', async () => {
    await A.saveAdvisory({ severity: 'info', messages: { en: 'Always' },
      starts_at: null, ends_at: null, is_active: 1 });
    expect(await A.activeAdvisories({ at: new Date('2026-06-01') })).toHaveLength(1);
  });

  it('puts the most severe first', async () => {
    await A.saveAdvisory({ severity: 'info', messages: { en: 'I' }, is_active: 1 });
    await A.saveAdvisory({ severity: 'closure', messages: { en: 'C' }, is_active: 1 });
    await A.saveAdvisory({ severity: 'warning', messages: { en: 'W' }, is_active: 1 });
    const live = await A.activeAdvisories({ at: new Date('2026-06-01') });
    expect(live.map((a) => a.severity)).toEqual(['closure', 'warning', 'info']);
  });

  it('reads a localised message with English fallback', () => {
    expect(A.localeMessage({ messages: { en: 'Open', bn: 'খোলা' } }, 'bn')).toBe('খোলা');
    expect(A.localeMessage({ messages: { en: 'Open' } }, 'zh')).toBe('Open');
    expect(A.localeMessage({ messages: {} }, 'en')).toBe('');
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run tests/db/corridor-tolls.test.js`
Expected: FAIL — cannot resolve `lib/corridor/tolls.js`.

- [ ] **Step 3: Write `lib/corridor/tolls.js`**

```js
// lib/corridor/tolls.js
import { query } from '../db.js';
import { DEFAULT_LOCALE } from '../i18n/locales.js';

const asJson = (v) => (typeof v === 'string' ? JSON.parse(v) : v);
const shape = (row) => ({ ...row, class_labels: row.class_labels ? asJson(row.class_labels) : {} });
const isoDate = (d) => new Date(d).toISOString().slice(0, 10);

/**
 * The rate IN FORCE for each vehicle class on `on` — the most recent row whose
 * effective_from has arrived. Publishing every historical row would put a
 * superseded price beside the current one.
 */
export async function listTollRates({ on = new Date() } = {}) {
  const rows = (await query(
    `SELECT t.id, t.vehicle_class, t.class_labels, t.class_order, t.section,
            t.amount_bdt, t.effective_from
     FROM toll_rates t
     JOIN (
       SELECT vehicle_class, MAX(effective_from) AS eff
       FROM toll_rates WHERE effective_from <= ? GROUP BY vehicle_class
     ) cur ON cur.vehicle_class = t.vehicle_class AND cur.eff = t.effective_from
     WHERE t.effective_from <= ?
     ORDER BY t.class_order, t.vehicle_class`,
    [isoDate(on), isoDate(on)]
  )) || [];
  return rows.map(shape);
}

export async function listAllTollRates() {
  const rows = (await query(
    `SELECT id, vehicle_class, class_labels, class_order, section, amount_bdt, effective_from
     FROM toll_rates ORDER BY class_order, vehicle_class, effective_from DESC`
  )) || [];
  return rows.map(shape);
}

export async function saveTollRate({
  id = null, vehicle_class, class_labels = {}, class_order = 0,
  section = '', amount_bdt, effective_from,
}) {
  const amount = Number(amount_bdt);
  if (!Number.isFinite(amount) || amount < 0) {
    throw new Error('The toll amount must be zero or more');
  }
  if (!vehicle_class) throw new Error('A vehicle class is required');
  if (!effective_from) throw new Error('An effective date is required');

  const params = [
    vehicle_class, JSON.stringify(class_labels || {}), Number(class_order) || 0,
    section, amount, effective_from,
  ];
  if (id) {
    await query(
      `UPDATE toll_rates SET vehicle_class=?, class_labels=?, class_order=?, section=?,
       amount_bdt=?, effective_from=? WHERE id=?`,
      [...params, id]
    );
    return id;
  }
  const res = await query(
    `INSERT INTO toll_rates (vehicle_class, class_labels, class_order, section, amount_bdt, effective_from)
     VALUES (?, ?, ?, ?, ?, ?)`,
    params
  );
  return res.insertId;
}

export async function deleteTollRate(id) {
  await query('DELETE FROM toll_rates WHERE id = ?', [id]);
}

/** Taka with thousands separators. Paisa shown only when non-zero. */
export function formatTaka(amount) {
  const n = Number(amount);
  if (!Number.isFinite(n)) return '';
  const hasPaisa = Math.round(n * 100) % 100 !== 0;
  return `৳ ${n.toLocaleString('en-US', {
    minimumFractionDigits: hasPaisa ? 2 : 0,
    maximumFractionDigits: 2,
  })}`;
}
```

- [ ] **Step 4: Write `lib/corridor/advisories.js`**

```js
// lib/corridor/advisories.js
import { query } from '../db.js';
import { DEFAULT_LOCALE } from '../i18n/locales.js';

const asJson = (v) => (typeof v === 'string' ? JSON.parse(v) : v);
const shape = (row) => ({ ...row, messages: row.messages ? asJson(row.messages) : {} });

// Most severe first: a closure must never sit below an information notice.
const SEVERITY_RANK = { closure: 0, warning: 1, info: 2 };

function sqlDateTime(d) {
  return new Date(d).toISOString().slice(0, 19).replace('T', ' ');
}

export async function activeAdvisories({ at = new Date() } = {}) {
  const now = sqlDateTime(at);
  const rows = (await query(
    `SELECT id, severity, messages, starts_at, ends_at, is_active
     FROM advisories
     WHERE is_active = 1
       AND (starts_at IS NULL OR starts_at <= ?)
       AND (ends_at   IS NULL OR ends_at   >= ?)`,
    [now, now]
  )) || [];
  return rows
    .map(shape)
    .sort((a, b) => (SEVERITY_RANK[a.severity] ?? 9) - (SEVERITY_RANK[b.severity] ?? 9));
}

export async function listAllAdvisories() {
  const rows = (await query(
    `SELECT id, severity, messages, starts_at, ends_at, is_active
     FROM advisories ORDER BY is_active DESC, created_at DESC`
  )) || [];
  return rows.map(shape);
}

export async function saveAdvisory({
  id = null, severity = 'info', messages = {},
  starts_at = null, ends_at = null, is_active = 1,
}) {
  if (!messages || !messages.en) throw new Error('An English message is required');
  const params = [
    severity, JSON.stringify(messages),
    starts_at || null, ends_at || null, is_active ? 1 : 0,
  ];
  if (id) {
    await query(
      'UPDATE advisories SET severity=?, messages=?, starts_at=?, ends_at=?, is_active=? WHERE id=?',
      [...params, id]
    );
    return id;
  }
  const res = await query(
    'INSERT INTO advisories (severity, messages, starts_at, ends_at, is_active) VALUES (?, ?, ?, ?, ?)',
    params
  );
  return res.insertId;
}

export async function deleteAdvisory(id) {
  await query('DELETE FROM advisories WHERE id = ?', [id]);
}

/** Own-property read with English fallback. */
export function localeMessage(row, locale) {
  const m = row?.messages || {};
  if (Object.hasOwn(m, locale) && m[locale]) return m[locale];
  if (Object.hasOwn(m, DEFAULT_LOCALE) && m[DEFAULT_LOCALE]) return m[DEFAULT_LOCALE];
  return '';
}
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `npx vitest run tests/db/corridor-tolls.test.js`
Expected: PASS, 13 tests.

- [ ] **Step 6: Confirm neither module imports Next**

Run: `grep -c "next/" lib/corridor/tolls.js lib/corridor/advisories.js`
Expected: `0` for both.

- [ ] **Step 7: Commit**

```bash
git add lib/corridor/tolls.js lib/corridor/advisories.js tests/db/corridor-tolls.test.js
git commit -m "feat(corridor): add toll rate and advisory query layers"
```

---

## Task 7: Corridor cache layer and seed data

**Files:**
- Create: `lib/corridor/cache.js`, `scripts/seed-corridor.mjs`, `tests/unit/corridor-cache-tags.test.js`
- Modify: `lib/revalidate.js`, `package.json`

**Interfaces:**
- Consumes: the four query modules; `next/cache` → `unstable_cache`, `revalidateTag`; `react` → `cache`.
- Produces:
  - `lib/revalidate.js` gains `CORRIDOR_TAG = 'corridor'` and `revalidateCorridor(): void`
  - `lib/corridor/cache.js` exports `getCorridorSummaryCached`, `getInterchangesCached`, `getTollRatesCached`, `getActiveAdvisoriesCached`, `getIllustrativeCached`

Mirror `lib/content/cache.js` exactly: `cache()` wrapping `unstable_cache`. P0+P1 established empirically that `unstable_cache` alone does **not** dedupe two calls racing on a cold entry — a page that reads the corridor in both `generateMetadata` and its component would hit the database twice without the React `cache()` wrapper.

- [ ] **Step 1: Write the failing test**

```js
// tests/unit/corridor-cache-tags.test.js
import { describe, it, expect } from 'vitest';
import { CORRIDOR_TAG, pageTag, LIST_TAG } from '../../lib/revalidate.js';

describe('corridor cache tag', () => {
  it('has a stable, distinct tag', () => {
    expect(CORRIDOR_TAG).toBe('corridor');
    expect(CORRIDOR_TAG).not.toBe(LIST_TAG);
  });

  it('does not collide with a page tag', () => {
    expect(pageTag('corridor')).toBe('page:corridor');
    expect(pageTag('corridor')).not.toBe(CORRIDOR_TAG);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run tests/unit/corridor-cache-tags.test.js`
Expected: FAIL — `CORRIDOR_TAG` is not exported.

- [ ] **Step 3: Extend `lib/revalidate.js`**

Append:

```js
/** One tag for all operational data: segments, interchanges, tolls, advisories.
 *  They are read together and change together, so splitting them would mean
 *  every editor save had to remember which of four tags to invalidate. */
export const CORRIDOR_TAG = 'corridor';

export function revalidateCorridor() {
  revalidateTag(CORRIDOR_TAG);
}
```

- [ ] **Step 4: Write `lib/corridor/cache.js`**

```js
// lib/corridor/cache.js
import { cache } from 'react';
import { unstable_cache } from 'next/cache';
import { corridorSummary } from './segments.js';
import { listInterchanges } from './interchanges.js';
import { listTollRates } from './tolls.js';
import { activeAdvisories } from './advisories.js';
import { isDataIllustrative } from '../settings.js';
import { CORRIDOR_TAG } from '../revalidate.js';

/**
 * Cached readers for the public routes. The admin uses the uncached modules so
 * an editor always sees current data.
 *
 * Each is wrapped in React's cache() as well as unstable_cache: on a COLD entry
 * unstable_cache alone does not dedupe two calls in the same request (proven in
 * P0+P1), so generateMetadata and the page component would each hit the DB.
 */
export const getCorridorSummaryCached = cache(() =>
  unstable_cache(() => corridorSummary(), ['corridor-summary'], { tags: [CORRIDOR_TAG] })()
);

export const getInterchangesCached = cache(() =>
  unstable_cache(() => listInterchanges(), ['corridor-interchanges'], { tags: [CORRIDOR_TAG] })()
);

export const getTollRatesCached = cache(() =>
  unstable_cache(() => listTollRates(), ['corridor-tolls'], { tags: [CORRIDOR_TAG] })()
);

// Advisories are deliberately NOT cached across requests: an advisory exists to
// be current, and a stale closure notice is worse than an extra query. React's
// cache() still dedupes within one request.
export const getActiveAdvisoriesCached = cache(() => activeAdvisories());

export const getIllustrativeCached = cache(() =>
  unstable_cache(() => isDataIllustrative(), ['corridor-illustrative'], { tags: [CORRIDOR_TAG] })()
);
```

- [ ] **Step 5: Write the seed script**

```js
// scripts/seed-corridor.mjs
/**
 * Seeds ILLUSTRATIVE corridor data so the Travel Info pages have something to
 * render before DBEDC supplies the official schedule.
 *
 * Every figure here is reconstructed from public reporting, NOT from an official
 * source. K3+900 and the 18 km Kodda–Purbachal open section are sourced; the
 * intermediate chainages are interpolated. corridor.illustrative is set to true
 * so the site says so on every page that shows these numbers.
 *
 *   node scripts/seed-corridor.mjs [--database=name]
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

const SEGMENTS = [
  { from_m: 0,     to_m: 3900,  status: 'construction', labels: { en: 'Kodda approach' } },
  { from_m: 3900,  to_m: 21900, status: 'open',         labels: { en: 'Kodda – Purbachal' }, opened_on: '2025-08-24' },
  { from_m: 21900, to_m: 48000, status: 'construction', labels: { en: 'Purbachal – Madanpur' } },
];

const INTERCHANGES = [
  { chainage_m: 0,     names: { en: 'Kodda' },      kind: 'interchange',  status: 'construction', connects_to: 'N3 · Dhaka–Mymensingh' },
  { chainage_m: 3900,  names: { en: 'Toll Plaza' }, kind: 'toll_plaza',   status: 'open',         connects_to: '' },
  { chainage_m: 9400,  names: { en: 'Bhogra' },     kind: 'interchange',  status: 'open',         connects_to: 'N4 · Dhaka–Tangail link' },
  { chainage_m: 16200, names: { en: 'Bhaowal' },    kind: 'service_area', status: 'open',         connects_to: '' },
  { chainage_m: 21900, names: { en: 'Purbachal' },  kind: 'interchange',  status: 'open',         connects_to: 'Purbachal Link Road' },
  { chainage_m: 34600, names: { en: 'Bhulta' },     kind: 'interchange',  status: 'construction', connects_to: 'N2 · Dhaka–Sylhet' },
  { chainage_m: 48000, names: { en: 'Madanpur' },   kind: 'interchange',  status: 'construction', connects_to: 'N1 · Dhaka–Chattogram' },
];

const TOLLS = [
  { vehicle_class: 'motorcycle', class_labels: { en: 'Motorcycle' },      class_order: 1, amount_bdt: 40,  effective_from: '2025-08-24' },
  { vehicle_class: 'car',        class_labels: { en: 'Car / Jeep' },      class_order: 2, amount_bdt: 100, effective_from: '2025-08-24' },
  { vehicle_class: 'microbus',   class_labels: { en: 'Microbus' },        class_order: 3, amount_bdt: 150, effective_from: '2025-08-24' },
  { vehicle_class: 'bus_small',  class_labels: { en: 'Bus (up to 31)' },  class_order: 4, amount_bdt: 250, effective_from: '2025-08-24' },
  { vehicle_class: 'bus_large',  class_labels: { en: 'Bus (32+)' },       class_order: 5, amount_bdt: 350, effective_from: '2025-08-24' },
  { vehicle_class: 'truck_4',    class_labels: { en: 'Truck (4 wheel)' }, class_order: 6, amount_bdt: 300, effective_from: '2025-08-24' },
  { vehicle_class: 'truck_6',    class_labels: { en: 'Truck (6 wheel)' }, class_order: 7, amount_bdt: 500, effective_from: '2025-08-24' },
];

try {
  await db.query('DELETE FROM segments');
  await db.query('DELETE FROM interchanges');
  await db.query('DELETE FROM toll_rates');

  for (const s of SEGMENTS) {
    await db.execute(
      'INSERT INTO segments (from_m, to_m, status, opened_on, labels) VALUES (?, ?, ?, ?, ?)',
      [s.from_m, s.to_m, s.status, s.opened_on || null, JSON.stringify(s.labels)]
    );
  }
  for (const i of INTERCHANGES) {
    await db.execute(
      'INSERT INTO interchanges (chainage_m, names, kind, status, connects_to, facilities) VALUES (?, ?, ?, ?, ?, ?)',
      [i.chainage_m, JSON.stringify(i.names), i.kind, i.status, i.connects_to, JSON.stringify([])]
    );
  }
  for (const t of TOLLS) {
    await db.execute(
      'INSERT INTO toll_rates (vehicle_class, class_labels, class_order, section, amount_bdt, effective_from) VALUES (?, ?, ?, ?, ?, ?)',
      [t.vehicle_class, JSON.stringify(t.class_labels), t.class_order, 'Full corridor', t.amount_bdt, t.effective_from]
    );
  }

  await db.execute(
    `INSERT INTO site_settings (setting_key, value) VALUES ('corridor.illustrative', 'true')
     ON DUPLICATE KEY UPDATE value = VALUES(value)`
  );

  console.log(
    `Seeded ${SEGMENTS.length} segments, ${INTERCHANGES.length} interchanges and ` +
    `${TOLLS.length} toll rates on ${DB_NAME}, flagged ILLUSTRATIVE.`
  );
} catch (err) {
  console.error('Seed failed:', err.message);
  process.exitCode = 1;
} finally {
  await db.end();
}
```

- [ ] **Step 6: Add the npm script**

In `package.json`, add beside `db:setup:v3`:

```json
"db:seed:corridor": "node scripts/seed-corridor.mjs"
```

- [ ] **Step 7: Run everything**

Run:
```bash
npx vitest run tests/unit/corridor-cache-tags.test.js
npm run db:setup:v3
npm run db:seed:corridor
npm test
```
Expected: the tag test passes; the seed reports 3 segments, 7 interchanges and 7 toll rates flagged illustrative; the full suite still passes.

- [ ] **Step 8: Commit**

```bash
git add lib/corridor/cache.js lib/revalidate.js scripts/seed-corridor.mjs package.json tests/unit/corridor-cache-tags.test.js
git commit -m "feat(corridor): add cached readers and illustrative seed data"
```

---

## Task 8: Corridor strip and interchange table

**Files:**
- Create: `lib/corridor/strip.js`, `components/corridor/CorridorStrip.jsx`, `components/corridor/InterchangeTable.jsx`, `components/corridor/ProgressBar.jsx`, `tests/unit/corridor-strip-data.test.js`
- Modify: `app/design-tokens.css`, `lib/i18n/ui.js`

**Interfaces:**
- Consumes: `lib/corridor/geometry.js` → `corridorExtent`, `positionPercent`, `sortByChainage`; `lib/corridor/chainage.js` → `formatChainage`, `formatKm`; `lib/corridor/interchanges.js` → `localeName`.
- Produces:
  - `lib/corridor/strip.js` → `buildStripModel({ segments, interchanges, locale }): { extent, bands, markers, legend }`
  - `<CorridorStrip model locale />`, `<InterchangeTable interchanges locale caption />`, `<ProgressBar summary locale />`

**The geometry is computed in a pure function, not in JSX.** `buildStripModel` turns rows into positioned bands and markers, so the maths is unit-tested without a browser and the component stays a thin renderer.

**Accessibility is load-bearing here.** The strip conveys status by colour AND hatching AND a text label, and it is `aria-hidden` with `InterchangeTable` as the real keyboard-navigable equivalent immediately after it. A sighted mouse user gets the diagram; everyone else gets a proper table carrying the same data.

- [ ] **Step 1: Write the failing test**

```js
// tests/unit/corridor-strip-data.test.js
import { describe, it, expect } from 'vitest';
import { buildStripModel } from '../../lib/corridor/strip.js';

const SEGMENTS = [
  { id: 1, from_m: 0, to_m: 3900, status: 'construction', labels: {} },
  { id: 2, from_m: 3900, to_m: 21900, status: 'open', labels: { en: 'Open section' } },
  { id: 3, from_m: 21900, to_m: 48000, status: 'construction', labels: {} },
];
const INTERCHANGES = [
  { id: 1, chainage_m: 21900, names: { en: 'Purbachal' }, kind: 'interchange', status: 'open', connects_to: '' },
  { id: 2, chainage_m: 0, names: { en: 'Kodda' }, kind: 'interchange', status: 'construction', connects_to: 'N3' },
];

describe('buildStripModel', () => {
  it('positions bands as percentages of the extent', () => {
    const m = buildStripModel({ segments: SEGMENTS, interchanges: [], locale: 'en' });
    expect(m.extent.length_m).toBe(48000);
    expect(m.bands).toHaveLength(3);
    expect(m.bands[0].leftPct).toBe(0);
    expect(m.bands[0].widthPct).toBeCloseTo(8.13, 1);
    expect(m.bands[1].widthPct).toBeCloseTo(37.5, 1);
  });

  it('orders markers by chainage regardless of input order', () => {
    const m = buildStripModel({ segments: SEGMENTS, interchanges: INTERCHANGES, locale: 'en' });
    expect(m.markers.map((x) => x.name)).toEqual(['Kodda', 'Purbachal']);
  });

  it('gives every marker a position and a formatted chainage', () => {
    const m = buildStripModel({ segments: SEGMENTS, interchanges: INTERCHANGES, locale: 'en' });
    expect(m.markers[0]).toMatchObject({ leftPct: 0, chainage: 'K0+000' });
    expect(m.markers[1].chainage).toBe('K21+900');
    expect(m.markers[1].leftPct).toBeCloseTo(45.63, 1);
  });

  it('localises marker names with English fallback', () => {
    const ic = [{ id: 1, chainage_m: 0, names: { en: 'Bhulta', bn: 'ভুলতা' }, kind: 'interchange', status: 'open', connects_to: '' }];
    expect(buildStripModel({ segments: SEGMENTS, interchanges: ic, locale: 'bn' }).markers[0].name).toBe('ভুলতা');
    expect(buildStripModel({ segments: SEGMENTS, interchanges: ic, locale: 'zh' }).markers[0].name).toBe('Bhulta');
  });

  it('reports only the statuses actually present in the legend', () => {
    const m = buildStripModel({ segments: SEGMENTS, interchanges: [], locale: 'en' });
    expect([...m.legend].sort()).toEqual(['construction', 'open']);
    const openOnly = buildStripModel({
      segments: [{ id: 1, from_m: 0, to_m: 10, status: 'open', labels: {} }], interchanges: [], locale: 'en',
    });
    expect(openOnly.legend).toEqual(['open']);
  });

  it('returns an empty, renderable model for no data instead of throwing', () => {
    const m = buildStripModel({ segments: [], interchanges: [], locale: 'en' });
    expect(m.bands).toEqual([]);
    expect(m.markers).toEqual([]);
    expect(m.extent.length_m).toBe(0);
    expect(m.legend).toEqual([]);
  });

  it('never positions a band or marker outside 0-100', () => {
    const m = buildStripModel({
      segments: SEGMENTS,
      interchanges: [{ id: 9, chainage_m: 999999, names: { en: 'Bad row' }, kind: 'interchange', status: 'open', connects_to: '' }],
      locale: 'en',
    });
    for (const b of m.bands) {
      expect(b.leftPct).toBeGreaterThanOrEqual(0);
      expect(b.leftPct + b.widthPct).toBeLessThanOrEqual(100.01);
    }
    expect(m.markers[0].leftPct).toBeLessThanOrEqual(100);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run tests/unit/corridor-strip-data.test.js`
Expected: FAIL — cannot resolve `lib/corridor/strip.js`.

- [ ] **Step 3: Write `lib/corridor/strip.js`**

```js
// lib/corridor/strip.js
import { corridorExtent, positionPercent, sortByChainage } from './geometry.js';
import { formatChainage } from './chainage.js';
import { localeName } from './interchanges.js';

/**
 * Turns segment and interchange rows into positioned bands and markers.
 * Pure on purpose: the strip's maths is unit-tested without a browser, and the
 * component stays a thin renderer.
 */
export function buildStripModel({ segments = [], interchanges = [], locale = 'en' } = {}) {
  const extent = corridorExtent(segments);

  const bands = (segments || []).map((s) => {
    const leftPct = positionPercent(s.from_m, extent);
    const rightPct = positionPercent(s.to_m, extent);
    return {
      id: s.id,
      status: s.status,
      leftPct,
      widthPct: Math.max(0, rightPct - leftPct),
      label: (s.labels && s.labels[locale]) || (s.labels && s.labels.en) || '',
      fromChainage: formatChainage(s.from_m),
      toChainage: formatChainage(s.to_m),
    };
  });

  const markers = sortByChainage(interchanges).map((i) => ({
    id: i.id,
    name: localeName(i, locale),
    kind: i.kind,
    status: i.status,
    connectsTo: i.connects_to || '',
    chainage: formatChainage(i.chainage_m),
    leftPct: positionPercent(i.chainage_m, extent),
  }));

  // Only the statuses actually present — a legend listing states that never
  // appear is noise.
  const legend = [...new Set(bands.map((b) => b.status))];

  return { extent, bands, markers, legend };
}
```

- [ ] **Step 4: Write the three components**

```jsx
// components/corridor/CorridorStrip.jsx
import { t } from '../../lib/i18n/ui';

const STATUS_KEY = { open: 'statusOpen', construction: 'statusConstruction', planned: 'statusPlanned' };

/**
 * The schematic corridor. aria-hidden by design: it is a diagram, and
 * InterchangeTable renders the same data as a real table for assistive tech and
 * keyboard users. Status is carried by colour AND hatching AND the text label in
 * that table — never by colour alone.
 */
export default function CorridorStrip({ model, locale }) {
  if (!model || model.bands.length === 0) return null;

  return (
    <div className="db-strip-wrap">
      <div className="db-strip" aria-hidden="true">
        <div className="db-strip-rail">
          {model.bands.map((b) => (
            <span
              key={b.id}
              className={`db-band db-band-${b.status}`}
              style={{ left: `${b.leftPct}%`, width: `${b.widthPct}%` }}
            />
          ))}
        </div>
        <div className="db-strip-markers">
          {model.markers.map((m) => (
            <span key={m.id} className="db-marker" style={{ left: `${m.leftPct}%` }}>
              <span className={`db-marker-pin db-marker-${m.status}`} />
              <span className="db-marker-name">{m.name}</span>
              <span className="db-marker-ch">{m.chainage}</span>
            </span>
          ))}
        </div>
      </div>

      <p className="db-strip-legend">
        {model.legend.map((s) => (
          <span key={s} className="db-legend-item">
            <i className={`db-legend-swatch db-band-${s}`} aria-hidden="true" />
            {t(locale, STATUS_KEY[s] || 'statusPlanned')}
          </span>
        ))}
      </p>
    </div>
  );
}
```

```jsx
// components/corridor/InterchangeTable.jsx
import { t } from '../../lib/i18n/ui';

const KIND_KEY = {
  interchange: 'kindInterchange',
  toll_plaza: 'kindTollPlaza',
  service_area: 'kindServiceArea',
  u_loop: 'kindULoop',
  pedestrian_overpass: 'kindPedestrianOverpass',
};
const STATUS_KEY = { open: 'statusOpen', construction: 'statusConstruction', planned: 'statusPlanned' };

/**
 * The accessible equivalent of the strip, and useful in its own right — this is
 * what a driver actually reads to find their exit. Status appears as text, not
 * only as a colour.
 */
export default function InterchangeTable({ interchanges, locale, caption }) {
  if (!interchanges || interchanges.length === 0) {
    return <p className="db-empty-inline">{t(locale, 'noInterchanges')}</p>;
  }

  return (
    <div className="db-scroll-x">
      <table className="db-table">
        {caption ? <caption className="db-table-caption">{caption}</caption> : null}
        <thead>
          <tr>
            <th scope="col">{t(locale, 'colLocation')}</th>
            <th scope="col">{t(locale, 'colChainage')}</th>
            <th scope="col">{t(locale, 'colType')}</th>
            <th scope="col">{t(locale, 'colConnects')}</th>
            <th scope="col">{t(locale, 'colStatus')}</th>
          </tr>
        </thead>
        <tbody>
          {interchanges.map((i) => (
            <tr key={i.id}>
              <th scope="row">{i.name}</th>
              <td className="db-num">{i.chainage}</td>
              <td>{t(locale, KIND_KEY[i.kind] || 'kindInterchange')}</td>
              <td>{i.connectsTo || '—'}</td>
              <td>
                <span className={`db-tag db-tag-${i.status === 'open' ? 'open' : 'build'}`}>
                  {t(locale, STATUS_KEY[i.status] || 'statusPlanned')}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

```jsx
// components/corridor/ProgressBar.jsx
import { formatKm } from '../../lib/corridor/chainage';
import { t } from '../../lib/i18n/ui';

/** The published progress figure, derived from segments — never hand-entered. */
export default function ProgressBar({ summary, locale }) {
  const pct = summary?.percentOpen ?? 0;
  return (
    <div className="db-progress">
      <div className="db-progress-head">
        <span className="db-progress-value">{pct}%</span>
        <span className="db-progress-label">{t(locale, 'openToTraffic')}</span>
      </div>
      <div
        className="db-progress-rail"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={t(locale, 'openToTraffic')}
      >
        <span className="db-progress-fill" style={{ width: `${pct}%` }} />
      </div>
      <p className="db-progress-note">
        {formatKm(summary?.openLength ?? 0)} km / {formatKm(summary?.extent?.length_m ?? 0)} km
      </p>
    </div>
  );
}
```

- [ ] **Step 5: Add the strings to `lib/i18n/ui.js`**

Add these keys to EACH of the three locale objects in `UI`:

```js
// en
statusOpen: 'Open to traffic', statusConstruction: 'Under construction', statusPlanned: 'Planned',
kindInterchange: 'Interchange', kindTollPlaza: 'Toll plaza', kindServiceArea: 'Service area',
kindULoop: 'U-loop', kindPedestrianOverpass: 'Pedestrian overpass',
colLocation: 'Location', colChainage: 'Chainage', colType: 'Type', colConnects: 'Connects',
colStatus: 'Status', colVehicle: 'Vehicle class', colToll: 'Toll',
openToTraffic: 'Open to traffic', noInterchanges: 'No interchanges have been published yet.',

// bn
statusOpen: 'যান চলাচলের জন্য খোলা', statusConstruction: 'নির্মাণাধীন', statusPlanned: 'পরিকল্পিত',
kindInterchange: 'ইন্টারচেঞ্জ', kindTollPlaza: 'টোল প্লাজা', kindServiceArea: 'সার্ভিস এরিয়া',
kindULoop: 'ইউ-লুপ', kindPedestrianOverpass: 'পদচারী সেতু',
colLocation: 'অবস্থান', colChainage: 'চেইনেজ', colType: 'ধরন', colConnects: 'সংযোগ',
colStatus: 'অবস্থা', colVehicle: 'যানবাহনের শ্রেণি', colToll: 'টোল',
openToTraffic: 'যান চলাচলের জন্য খোলা', noInterchanges: 'এখনও কোনও ইন্টারচেঞ্জ প্রকাশ করা হয়নি।',

// zh
statusOpen: '已通车', statusConstruction: '在建', statusPlanned: '规划中',
kindInterchange: '互通立交', kindTollPlaza: '收费站', kindServiceArea: '服务区',
kindULoop: '掉头匝道', kindPedestrianOverpass: '人行天桥',
colLocation: '位置', colChainage: '桩号', colType: '类型', colConnects: '衔接',
colStatus: '状态', colVehicle: '车型', colToll: '通行费',
openToTraffic: '已通车', noInterchanges: '尚未发布互通立交信息。',
```

- [ ] **Step 6: Add the styles to `app/design-tokens.css`**

Append:

```css
/* ---- corridor strip ---- */
.db-strip-wrap{max-width:var(--db-shell);margin:0 auto;padding:0 clamp(12px,3vw,20px);}
.db-strip{position:relative;padding:8px 0 74px;}
.db-strip-rail{position:relative;height:12px;border-radius:2px;background:var(--db-surface-2);overflow:hidden;}
.db-band{position:absolute;top:0;bottom:0;}
.db-band-open{background:var(--db-open);}
/* Hatched as well as coloured: status is never colour alone. */
.db-band-construction{background:var(--db-build);
  background-image:repeating-linear-gradient(115deg,rgba(0,0,0,.22) 0 6px,transparent 6px 12px);}
.db-band-planned{background:var(--db-rule-2);}
.db-strip-markers{position:relative;height:0;}
.db-marker{position:absolute;top:6px;transform:translateX(-50%);
  display:flex;flex-direction:column;align-items:center;width:84px;text-align:center;}
.db-marker-pin{width:13px;height:13px;border-radius:50%;border:3px solid var(--db-ground);background:var(--db-rule-2);}
.db-marker-open{background:var(--db-open);}
.db-marker-construction{background:var(--db-build);}
.db-marker-name{margin-top:6px;font-family:var(--db-font-display);font-weight:600;
  font-size:.72rem;letter-spacing:.04em;text-transform:uppercase;color:var(--db-ink-2);line-height:1.1;}
.db-marker-ch{font-family:var(--db-font-display);font-size:.66rem;letter-spacing:.06em;color:var(--db-ink-3);}
.db-strip-legend{display:flex;flex-wrap:wrap;gap:8px 20px;margin:0;padding-top:4px;
  font-family:var(--db-font-display);font-size:.72rem;letter-spacing:.1em;
  text-transform:uppercase;color:var(--db-ink-3);}
.db-legend-item{display:inline-flex;align-items:center;gap:7px;}
.db-legend-swatch{display:inline-block;width:22px;height:8px;border-radius:1px;}
/* Below 700px the strip's labels collide; the table below it carries the data. */
@media (max-width:699px){ .db-strip{display:none;} }

/* ---- tables ---- */
.db-table{width:100%;border-collapse:collapse;font-size:.92rem;min-width:560px;}
.db-table-caption{caption-side:top;text-align:left;padding-bottom:8px;color:var(--db-ink-3);font-size:.86rem;}
.db-table th,.db-table td{text-align:left;padding:10px 14px;border-bottom:1px solid var(--db-rule);vertical-align:top;}
.db-table thead th{font-family:var(--db-font-display);font-size:.72rem;letter-spacing:.13em;
  text-transform:uppercase;color:var(--db-ink-3);background:var(--db-surface-2);}
.db-table tbody th{font-weight:600;}
.db-num{font-variant-numeric:tabular-nums;white-space:nowrap;}
.db-empty-inline{color:var(--db-ink-3);padding:12px 0;}

/* ---- progress ---- */
.db-progress{max-width:var(--db-shell);margin:0 auto;padding:0 clamp(12px,3vw,20px);}
.db-progress-head{display:flex;align-items:baseline;gap:10px;}
.db-progress-value{font-family:var(--db-font-display);font-weight:700;
  font-size:clamp(1.8rem,1.2rem + 2vw,2.6rem);line-height:1;font-variant-numeric:tabular-nums;}
.db-progress-label{font-family:var(--db-font-display);font-size:.72rem;letter-spacing:.14em;
  text-transform:uppercase;color:var(--db-ink-3);}
.db-progress-rail{height:10px;border-radius:2px;background:var(--db-surface-2);margin-top:10px;overflow:hidden;}
.db-progress-fill{display:block;height:100%;background:var(--db-open);}
.db-progress-note{margin-top:6px;color:var(--db-ink-3);font-size:.84rem;font-variant-numeric:tabular-nums;}
```

- [ ] **Step 7: Run the tests and the build**

Run:
```bash
npx vitest run tests/unit/corridor-strip-data.test.js tests/unit/ui-strings.test.js
npm run build
```
Expected: both PASS. `ui-strings.test.js` asserts every key exists in every locale, so it fails if you missed one — that is deliberate.

- [ ] **Step 8: Commit**

```bash
git add lib/corridor/strip.js components/corridor lib/i18n/ui.js app/design-tokens.css tests/unit/corridor-strip-data.test.js
git commit -m "feat(corridor): add the schematic strip, interchange table and progress bar"
```

---

## Task 9: Site-wide advisory bar

**Files:**
- Create: `components/corridor/AdvisoryBar.jsx`
- Modify: `app/[locale]/layout.jsx`, `app/design-tokens.css`, `lib/i18n/ui.js`

**Interfaces:**
- Consumes: `lib/corridor/cache.js` → `getActiveAdvisoriesCached`; `lib/corridor/advisories.js` → `localeMessage`.
- Produces: `<AdvisoryBar locale />` — an async server component rendering the most severe active advisory above the header, or nothing.

Renders **only the most severe** advisory, not a stack. A bar that grows to five rows stops being read; the rest live on `/travel/status`.

`role="status"` for info, `role="alert"` for warning and closure — an alert interrupts a screen reader, which is right for a closure and wrong for a notice.

- [ ] **Step 1: Write the component**

```jsx
// components/corridor/AdvisoryBar.jsx
import { getActiveAdvisoriesCached } from '../../lib/corridor/cache';
import { localeMessage } from '../../lib/corridor/advisories';
import { t } from '../../lib/i18n/ui';

const SEVERITY_KEY = { closure: 'sevClosure', warning: 'sevWarning', info: 'sevInfo' };

export default async function AdvisoryBar({ locale }) {
  let advisories = [];
  try {
    advisories = await getActiveAdvisoriesCached();
  } catch {
    // An advisory lookup must never take the whole page down. No bar is the
    // safe failure: pages still render and /travel/status carries the detail.
    return null;
  }

  const top = advisories[0];
  if (!top) return null;

  const message = localeMessage(top, locale);
  if (!message) return null;

  return (
    <div
      className={`db-advisory db-advisory-${top.severity}`}
      role={top.severity === 'info' ? 'status' : 'alert'}
    >
      <div className="db-advisory-inner">
        <span className="db-advisory-tag">{t(locale, SEVERITY_KEY[top.severity] || 'sevInfo')}</span>
        <span className="db-advisory-msg">{message}</span>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Add the strings to `lib/i18n/ui.js`**

Add to each locale:

```js
// en
sevInfo: 'Notice', sevWarning: 'Advisory', sevClosure: 'Closure',
// bn
sevInfo: 'বিজ্ঞপ্তি', sevWarning: 'সতর্কতা', sevClosure: 'বন্ধ',
// zh
sevInfo: '通知', sevWarning: '提醒', sevClosure: '封闭',
```

- [ ] **Step 3: Render it in `app/[locale]/layout.jsx`**

Add the import:

```jsx
import AdvisoryBar from '../../components/corridor/AdvisoryBar.jsx';
```

and render it as the first child inside `.db-root`, immediately BEFORE `<SiteHeaderV2 />`:

```jsx
      <ThemeScript />
      <AdvisoryBar locale={locale} />
      <SiteHeaderV2 locale={locale} />
```

- [ ] **Step 4: Add the styles to `app/design-tokens.css`**

Append:

```css
.db-advisory{border-bottom:1px solid var(--db-rule);}
.db-advisory-inner{max-width:var(--db-shell);margin:0 auto;
  padding:9px clamp(12px,3vw,20px);display:flex;flex-wrap:wrap;align-items:baseline;gap:6px 12px;}
.db-advisory-tag{font-family:var(--db-font-display);font-weight:700;font-size:.72rem;
  letter-spacing:.14em;text-transform:uppercase;white-space:nowrap;}
.db-advisory-msg{font-size:.9rem;}
/* Each severity carries its own text tag as well as its colour. */
.db-advisory-info{background:var(--db-surface-2);color:var(--db-ink-2);}
.db-advisory-info .db-advisory-tag{color:var(--db-ink-3);}
.db-advisory-warning{background:var(--db-build-wash);color:var(--db-ink);}
.db-advisory-warning .db-advisory-tag{color:var(--db-build);}
.db-advisory-closure{background:var(--db-alert-wash);color:var(--db-ink);}
.db-advisory-closure .db-advisory-tag{color:var(--db-alert);}
```

- [ ] **Step 5: Verify both paths**

The no-advisory path is the one the layout must never break on, so check it first.

Run:
```bash
npm run build
npm test
npm run test:e2e
```
Expected: all pass. With no advisories seeded no bar appears, and the existing e2e suite asserts zero console errors on `/en`, `/bn` and `/zh` — a broken layout fails loudly there.

Then insert one advisory and confirm it appears (delete it afterwards):

```bash
node --input-type=module -e "
import mysql from 'mysql2/promise';
import { loadEnv } from './scripts/load-env.mjs';
loadEnv();
const db = await mysql.createConnection({host:process.env.DB_HOST||'127.0.0.1',port:Number(process.env.DB_PORT||3306),user:process.env.DB_USER||'root',password:process.env.DB_PASSWORD||'',database:process.env.DB_NAME});
await db.execute(\"INSERT INTO advisories (severity, messages, is_active) VALUES ('warning', ?, 1)\", [JSON.stringify({en:'Fog advisory in force between Kodda and Bhogra.'})]);
console.log('inserted');
await db.end();
"
```

Load `/en` and confirm the amber advisory bar appears above the header with the text tag "Advisory". Then remove it:

```bash
node --input-type=module -e "
import mysql from 'mysql2/promise';
import { loadEnv } from './scripts/load-env.mjs';
loadEnv();
const db = await mysql.createConnection({host:process.env.DB_HOST||'127.0.0.1',port:Number(process.env.DB_PORT||3306),user:process.env.DB_USER||'root',password:process.env.DB_PASSWORD||'',database:process.env.DB_NAME});
await db.execute('DELETE FROM advisories');
console.log('cleared');
await db.end();
"
```

- [ ] **Step 6: Commit**

```bash
git add components/corridor/AdvisoryBar.jsx "app/[locale]/layout.jsx" app/design-tokens.css lib/i18n/ui.js
git commit -m "feat(corridor): add the site-wide advisory bar"
```

---

## Task 10: Travel Info shell, status and toll pages

**Files:**
- Create: `app/[locale]/travel/layout.jsx`, `app/[locale]/travel/page.jsx`, `app/[locale]/travel/status/page.jsx`, `app/[locale]/travel/toll/page.jsx`
- Modify: `lib/i18n/ui.js`, `app/design-tokens.css`

**Interfaces:**
- Consumes: `lib/corridor/cache.js` → `getCorridorSummaryCached`, `getInterchangesCached`, `getTollRatesCached`, `getIllustrativeCached`; `lib/corridor/strip.js` → `buildStripModel`; `lib/corridor/tolls.js` → `formatTaka`; the Task 8 components; `lib/i18n/locales.js` → `isLocale`, `DEFAULT_LOCALE`.
- Produces: `/[locale]/travel`, `/[locale]/travel/status`, `/[locale]/travel/toll`, and the section sub-navigation.

Every page here calls `getIllustrativeCached()` and renders `<IllustrativeNotice />` when true. That is the promise the spec makes: no unverified operational figure is presented as fact.

- [ ] **Step 1: Write the section shell**

```jsx
// app/[locale]/travel/layout.jsx
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { isLocale } from '../../../lib/i18n/locales';
import { t } from '../../../lib/i18n/ui';

const SECTION = [
  { key: 'travelStatus', href: '/travel/status' },
  { key: 'travelToll', href: '/travel/toll' },
  { key: 'travelRoute', href: '/travel/route' },
  { key: 'travelFacilities', href: '/travel/facilities' },
  { key: 'travelRules', href: '/travel/rules' },
];

export default async function TravelLayout({ children, params }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  return (
    <div className="db-section">
      <nav className="db-subnav" aria-label={t(locale, 'navTravel')}>
        {SECTION.map((item) => (
          <Link key={item.href} href={`/${locale}${item.href}`} className="db-subnav-link">
            {t(locale, item.key)}
          </Link>
        ))}
      </nav>
      {children}
    </div>
  );
}
```

```jsx
// app/[locale]/travel/page.jsx
import { redirect } from 'next/navigation';

/** /travel has no content of its own — status is what a visitor wants first. */
export default async function TravelIndex({ params }) {
  const { locale } = await params;
  redirect(`/${locale}/travel/status`);
}
```

- [ ] **Step 2: Write the status page**

```jsx
// app/[locale]/travel/status/page.jsx
import { notFound } from 'next/navigation';
import { isLocale } from '../../../../lib/i18n/locales';
import { t } from '../../../../lib/i18n/ui';
import {
  getCorridorSummaryCached, getInterchangesCached, getIllustrativeCached,
} from '../../../../lib/corridor/cache';
import { buildStripModel } from '../../../../lib/corridor/strip';
import CorridorStrip from '../../../../components/corridor/CorridorStrip';
import InterchangeTable from '../../../../components/corridor/InterchangeTable';
import ProgressBar from '../../../../components/corridor/ProgressBar';
import IllustrativeNotice from '../../../../components/corridor/IllustrativeNotice';

export async function generateMetadata({ params }) {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return { title: t(locale, 'travelStatus'), description: t(locale, 'travelStatusIntro') };
}

export default async function StatusPage({ params }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const [summary, interchanges, illustrative] = await Promise.all([
    getCorridorSummaryCached(),
    getInterchangesCached(),
    getIllustrativeCached(),
  ]);

  const model = buildStripModel({ segments: summary.segments, interchanges, locale });

  return (
    <>
      <header className="db-page-head">
        <h1 className="db-h1">{t(locale, 'travelStatus')}</h1>
        <p className="db-lede">{t(locale, 'travelStatusIntro')}</p>
      </header>

      {illustrative ? <IllustrativeNotice locale={locale} /> : null}

      <section className="db-block">
        <ProgressBar summary={summary} locale={locale} />
      </section>

      <section className="db-block">
        <CorridorStrip model={model} locale={locale} />
        <InterchangeTable
          interchanges={model.markers}
          locale={locale}
          caption={t(locale, 'interchangeCaption')}
        />
      </section>
    </>
  );
}
```

- [ ] **Step 3: Write the toll page**

```jsx
// app/[locale]/travel/toll/page.jsx
import { notFound } from 'next/navigation';
import { isLocale, DEFAULT_LOCALE } from '../../../../lib/i18n/locales';
import { t } from '../../../../lib/i18n/ui';
import { getTollRatesCached, getIllustrativeCached } from '../../../../lib/corridor/cache';
import { formatTaka } from '../../../../lib/corridor/tolls';
import IllustrativeNotice from '../../../../components/corridor/IllustrativeNotice';

export async function generateMetadata({ params }) {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return { title: t(locale, 'travelToll'), description: t(locale, 'travelTollIntro') };
}

/** Own-property read with English fallback — class_labels is data. */
function classLabel(row, locale) {
  const labels = row.class_labels || {};
  if (Object.hasOwn(labels, locale) && labels[locale]) return labels[locale];
  if (Object.hasOwn(labels, DEFAULT_LOCALE) && labels[DEFAULT_LOCALE]) return labels[DEFAULT_LOCALE];
  return row.vehicle_class;
}

export default async function TollPage({ params }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const [rates, illustrative] = await Promise.all([
    getTollRatesCached(),
    getIllustrativeCached(),
  ]);

  return (
    <>
      <header className="db-page-head">
        <h1 className="db-h1">{t(locale, 'travelToll')}</h1>
        <p className="db-lede">{t(locale, 'travelTollIntro')}</p>
      </header>

      {illustrative ? <IllustrativeNotice locale={locale} /> : null}

      <section className="db-block">
        {rates.length === 0 ? (
          <p className="db-empty-inline">{t(locale, 'noTollRates')}</p>
        ) : (
          <div className="db-scroll-x">
            <table className="db-table">
              <caption className="db-table-caption">{t(locale, 'tollCaption')}</caption>
              <thead>
                <tr>
                  <th scope="col">{t(locale, 'colVehicle')}</th>
                  <th scope="col">{t(locale, 'colSection')}</th>
                  <th scope="col">{t(locale, 'colToll')}</th>
                </tr>
              </thead>
              <tbody>
                {rates.map((r) => (
                  <tr key={r.id}>
                    <th scope="row">{classLabel(r, locale)}</th>
                    <td>{r.section || '—'}</td>
                    <td className="db-num db-toll-amount">{formatTaka(r.amount_bdt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
```

- [ ] **Step 4: Add the strings to `lib/i18n/ui.js`**

Add to each locale:

```js
// en
travelStatus: "What's open", travelToll: 'Toll rates', travelRoute: 'Route & interchanges',
travelFacilities: 'Facilities', travelRules: 'Rules of the road',
travelStatusIntro: 'Which sections of the expressway are carrying traffic today.',
travelTollIntro: 'Current toll by vehicle class.',
colSection: 'Section', tollCaption: 'Toll rates currently in force.',
interchangeCaption: 'Interchanges and facilities along the corridor, north to south.',
noTollRates: 'No toll rates have been published yet.',

// bn
travelStatus: 'কী খোলা আছে', travelToll: 'টোল হার', travelRoute: 'রুট ও ইন্টারচেঞ্জ',
travelFacilities: 'সুবিধাসমূহ', travelRules: 'সড়ক বিধি',
travelStatusIntro: 'এক্সপ্রেসওয়ের কোন অংশগুলি আজ যান চলাচলের জন্য খোলা।',
travelTollIntro: 'যানবাহনের শ্রেণি অনুযায়ী বর্তমান টোল।',
colSection: 'অংশ', tollCaption: 'বর্তমানে কার্যকর টোল হার।',
interchangeCaption: 'করিডোর বরাবর ইন্টারচেঞ্জ ও সুবিধাসমূহ, উত্তর থেকে দক্ষিণে।',
noTollRates: 'এখনও কোনও টোল হার প্রকাশ করা হয়নি।',

// zh
travelStatus: '通车路段', travelToll: '通行费', travelRoute: '路线与互通',
travelFacilities: '配套设施', travelRules: '通行规则',
travelStatusIntro: '快速路目前已通车的路段。',
travelTollIntro: '按车型划分的现行通行费。',
colSection: '路段', tollCaption: '现行通行费标准。',
interchangeCaption: '沿线互通立交与配套设施，由北至南。',
noTollRates: '尚未发布通行费标准。',
```

- [ ] **Step 5: Add the styles to `app/design-tokens.css`**

Append:

```css
.db-subnav{max-width:var(--db-shell);margin:0 auto;padding:14px clamp(12px,3vw,20px) 0;
  display:flex;gap:4px;overflow-x:auto;-webkit-overflow-scrolling:touch;scrollbar-width:none;}
.db-subnav::-webkit-scrollbar{display:none;}
.db-subnav-link{white-space:nowrap;flex:none;font-family:var(--db-font-display);font-weight:600;
  font-size:.82rem;letter-spacing:.08em;text-transform:uppercase;padding:8px 12px;
  border-radius:2px;text-decoration:none;color:var(--db-ink-2);}
.db-subnav-link:hover{background:var(--db-surface-2);color:var(--db-ink);}
.db-page-head{max-width:var(--db-shell);margin:0 auto;padding:clamp(24px,4vw,40px) clamp(12px,3vw,20px) 0;}
.db-h1{font-size:clamp(1.9rem,1.3rem + 2.4vw,3rem);text-transform:uppercase;letter-spacing:.01em;}
.db-h2{font-size:clamp(1.4rem,1.1rem + 1.4vw,2rem);text-transform:uppercase;letter-spacing:.02em;}
.db-lede{max-width:var(--db-measure);margin-top:10px;color:var(--db-ink-2);font-size:1.02rem;}
.db-toll-amount{font-family:var(--db-font-display);font-weight:700;font-size:1.05rem;}
```

- [ ] **Step 6: Verify in a browser and run the suites**

Run:
```bash
npm run build
npm test
```
Then start the dev server and open `/en/travel/status`, `/en/travel/toll`, `/bn/travel/toll` and `/zh/travel/status`. Confirm: the provisional notice appears, the strip renders above 700px and hides below it while the table remains, and the toll table shows one row per vehicle class.

- [ ] **Step 7: Commit**

```bash
git add "app/[locale]/travel" lib/i18n/ui.js app/design-tokens.css
git commit -m "feat(travel): add the Travel Info shell, status and toll pages"
```

---

## Task 11: Route, facilities and rules pages

**Files:**
- Create: `app/[locale]/travel/route/page.jsx`, `app/[locale]/travel/facilities/page.jsx`, `app/[locale]/travel/rules/page.jsx`
- Modify: `lib/i18n/ui.js`, `app/design-tokens.css`

**Interfaces:**
- Consumes: the same cached readers and components as Task 10; `lib/content/cache.js` → `getPageBySlugCached`, `getPageBlocksCached`; `components/blocks/BlockRenderer.jsx`; `lib/corridor/interchanges.js` → `localeName`; `lib/corridor/chainage.js` → `formatChainage`.
- Produces: the remaining three Travel Info routes.

**Route** and **Facilities** are data-driven. **Rules** is prose, so it renders CMS blocks from the page with slug `travel/rules` — an editor writes it, and it shows a friendly empty state until they do rather than 404-ing, because the section navigation links to it and a dead link is worse than a placeholder.

- [ ] **Step 1: Write the route page**

```jsx
// app/[locale]/travel/route/page.jsx
import { notFound } from 'next/navigation';
import { isLocale } from '../../../../lib/i18n/locales';
import { t } from '../../../../lib/i18n/ui';
import {
  getCorridorSummaryCached, getInterchangesCached, getIllustrativeCached,
} from '../../../../lib/corridor/cache';
import { buildStripModel } from '../../../../lib/corridor/strip';
import CorridorStrip from '../../../../components/corridor/CorridorStrip';
import InterchangeTable from '../../../../components/corridor/InterchangeTable';
import IllustrativeNotice from '../../../../components/corridor/IllustrativeNotice';

export async function generateMetadata({ params }) {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return { title: t(locale, 'travelRoute'), description: t(locale, 'travelRouteIntro') };
}

export default async function RoutePage({ params }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const [summary, interchanges, illustrative] = await Promise.all([
    getCorridorSummaryCached(), getInterchangesCached(), getIllustrativeCached(),
  ]);

  const model = buildStripModel({ segments: summary.segments, interchanges, locale });
  const entries = model.markers.filter((m) => m.kind === 'interchange' || m.kind === 'toll_plaza');

  return (
    <>
      <header className="db-page-head">
        <h1 className="db-h1">{t(locale, 'travelRoute')}</h1>
        <p className="db-lede">{t(locale, 'travelRouteIntro')}</p>
      </header>

      {illustrative ? <IllustrativeNotice locale={locale} /> : null}

      <section className="db-block">
        <CorridorStrip model={model} locale={locale} />
        <InterchangeTable
          interchanges={entries}
          locale={locale}
          caption={t(locale, 'routeCaption')}
        />
      </section>

      {/* The geographic map is deliberately absent: it is gated on official
          corridor geometry from the design consultant. Drawing invented
          coordinates would contradict the provisional-data notice above. */}
    </>
  );
}
```

- [ ] **Step 2: Write the facilities page**

```jsx
// app/[locale]/travel/facilities/page.jsx
import { notFound } from 'next/navigation';
import { isLocale } from '../../../../lib/i18n/locales';
import { t } from '../../../../lib/i18n/ui';
import { getInterchangesCached, getIllustrativeCached } from '../../../../lib/corridor/cache';
import { localeName } from '../../../../lib/corridor/interchanges';
import { formatChainage } from '../../../../lib/corridor/chainage';
import IllustrativeNotice from '../../../../components/corridor/IllustrativeNotice';

export async function generateMetadata({ params }) {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return { title: t(locale, 'travelFacilities'), description: t(locale, 'travelFacilitiesIntro') };
}

export default async function FacilitiesPage({ params }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const [interchanges, illustrative] = await Promise.all([
    getInterchangesCached(), getIllustrativeCached(),
  ]);
  const areas = interchanges.filter((i) => i.kind === 'service_area');

  return (
    <>
      <header className="db-page-head">
        <h1 className="db-h1">{t(locale, 'travelFacilities')}</h1>
        <p className="db-lede">{t(locale, 'travelFacilitiesIntro')}</p>
      </header>

      {illustrative ? <IllustrativeNotice locale={locale} /> : null}

      <section className="db-block">
        {areas.length === 0 ? (
          <p className="db-empty-inline">{t(locale, 'noFacilities')}</p>
        ) : (
          <ul className="db-facility-list">
            {areas.map((a) => (
              <li key={a.id} className="db-facility">
                <h2 className="db-facility-name">{localeName(a, locale)}</h2>
                <p className="db-num db-facility-ch">{formatChainage(a.chainage_m)}</p>
                {Array.isArray(a.facilities) && a.facilities.length > 0 ? (
                  <ul className="db-facility-tags">
                    {a.facilities.map((f, i) => (
                      <li key={i} className="db-tag db-tag-accent">{f}</li>
                    ))}
                  </ul>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
```

- [ ] **Step 3: Write the rules page**

```jsx
// app/[locale]/travel/rules/page.jsx
import { notFound } from 'next/navigation';
import { isLocale } from '../../../../lib/i18n/locales';
import { t } from '../../../../lib/i18n/ui';
import { getPageBySlugCached, getPageBlocksCached } from '../../../../lib/content/cache';
import BlockRenderer from '../../../../components/blocks/BlockRenderer';

const SLUG = 'travel/rules';

export async function generateMetadata({ params }) {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return { title: t(locale, 'travelRules'), description: t(locale, 'travelRulesIntro') };
}

/**
 * Rules are prose, not data, so this renders CMS blocks. Until an editor creates
 * the page it shows a friendly empty state rather than a 404 — the section
 * navigation links here, and a dead link is worse than a placeholder.
 */
export default async function RulesPage({ params }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const page = await getPageBySlugCached(SLUG);
  const blocks = page && page.status === 'published'
    ? await getPageBlocksCached(page.id, SLUG)
    : [];

  return (
    <>
      <header className="db-page-head">
        <h1 className="db-h1">{t(locale, 'travelRules')}</h1>
        <p className="db-lede">{t(locale, 'travelRulesIntro')}</p>
      </header>

      {blocks.length === 0 ? (
        <p className="db-empty">{t(locale, 'rulesEmpty')}</p>
      ) : (
        <BlockRenderer blocks={blocks} locale={locale} />
      )}
    </>
  );
}
```

- [ ] **Step 4: Add the strings to `lib/i18n/ui.js`**

Add to each locale:

```js
// en
travelRouteIntro: 'Where to join and leave the expressway.',
travelFacilitiesIntro: 'Service areas and roadside assistance along the corridor.',
travelRulesIntro: 'Speed limits, permitted vehicles and what to do if you break down.',
routeCaption: 'Entry and exit points, north to south.',
noFacilities: 'No service areas have been published yet.',
rulesEmpty: 'The rules of the road have not been published yet.',

// bn
travelRouteIntro: 'এক্সপ্রেসওয়েতে ওঠা ও নামার স্থান।',
travelFacilitiesIntro: 'করিডোর বরাবর সার্ভিস এরিয়া ও সড়ক সহায়তা।',
travelRulesIntro: 'গতিসীমা, অনুমোদিত যানবাহন এবং যানবাহন বিকল হলে করণীয়।',
routeCaption: 'প্রবেশ ও প্রস্থানের স্থান, উত্তর থেকে দক্ষিণে।',
noFacilities: 'এখনও কোনও সার্ভিস এরিয়া প্রকাশ করা হয়নি।',
rulesEmpty: 'সড়ক বিধি এখনও প্রকাশ করা হয়নি।',

// zh
travelRouteIntro: '上下快速路的位置。',
travelFacilitiesIntro: '沿线服务区与道路救援。',
travelRulesIntro: '限速、准许通行车辆，以及车辆故障时的处理方式。',
routeCaption: '出入口，由北至南。',
noFacilities: '尚未发布服务区信息。',
rulesEmpty: '尚未发布通行规则。',
```

- [ ] **Step 5: Add the styles to `app/design-tokens.css`**

Append:

```css
.db-facility-list{list-style:none;margin:0;padding:0;display:grid;gap:16px;
  grid-template-columns:repeat(auto-fit,minmax(240px,1fr));}
.db-facility{border:1px solid var(--db-rule);border-radius:3px;padding:16px 18px;background:var(--db-surface);}
.db-facility-name{font-size:1.05rem;text-transform:uppercase;letter-spacing:.05em;}
.db-facility-ch{color:var(--db-ink-3);font-family:var(--db-font-display);font-size:.78rem;letter-spacing:.08em;}
.db-facility-tags{list-style:none;margin:10px 0 0;padding:0;display:flex;flex-wrap:wrap;gap:6px;}
/* The facility chips use the accent tag variant, which P0+P1 never defined —
   only -open, -build and -alert exist. Defined here so they are not unstyled. */
.db-tag-accent{background:var(--db-accent-wash);color:var(--db-accent);}
```

- [ ] **Step 6: Verify and run the suites**

Run:
```bash
npm run build
npm test
```
Then open `/en/travel/route`, `/en/travel/facilities` and `/en/travel/rules` and confirm each renders, including the two empty states.

- [ ] **Step 7: Commit**

```bash
git add "app/[locale]/travel" lib/i18n/ui.js app/design-tokens.css
git commit -m "feat(travel): add route, facilities and rules pages"
```

---

## Task 12: Corridor admin editors

**Files:**
- Create: `lib/corridor/form.js`, `app/admin/(dash)/corridor/page.jsx`, `app/admin/(dash)/corridor/actions.js`, `app/admin/(dash)/corridor/segments/page.jsx`, `app/admin/(dash)/corridor/interchanges/page.jsx`, `app/admin/(dash)/corridor/tolls/page.jsx`, `app/admin/(dash)/corridor/advisories/page.jsx`, `tests/unit/corridor-form.test.js`

**Interfaces:**
- Consumes: `lib/auth/assert-can.js` → `assertCan`; the four uncached query modules; `lib/settings.js`; `lib/revalidate.js` → `revalidateCorridor`; `lib/corridor/chainage.js` → `parseChainage`, `formatChainage`.
- Produces: `lib/corridor/form.js` → `parseChainageField(value): number`, and server actions `listCorridorAction`, `saveSegmentAction`, `deleteSegmentAction`, `saveInterchangeAction`, `deleteInterchangeAction`, `saveTollRateAction`, `deleteTollRateAction`, `saveAdvisoryAction`, `deleteAdvisoryAction`, `setIllustrativeAction`.

**Every action calls `assertCan('edit_blocks')` first.** Operational data is structural content — a translator must not be able to change a toll rate.

`parseChainageField` lives in `lib/corridor/form.js`, NOT in the `'use server'` module: Next 15 rejects non-async exports there, and the test imports it directly. This mirrors the `lib/blocks/form.js` split P0+P1 established for the same reason.

**Every action calls `revalidateCorridor()` after a successful write**, or the public pages keep serving the old figures.

- [ ] **Step 1: Write the failing test**

```js
// tests/unit/corridor-form.test.js
import { describe, it, expect } from 'vitest';
import { parseChainageField } from '../../lib/corridor/form.js';

describe('parseChainageField', () => {
  it("accepts the engineers' notation", () => {
    expect(parseChainageField('K3+900')).toBe(3900);
    expect(parseChainageField('k21+900')).toBe(21900);
  });

  it('accepts a plain metre count', () => {
    expect(parseChainageField('3900')).toBe(3900);
  });

  it('throws a message that tells the editor the format', () => {
    expect(() => parseChainageField('three km')).toThrow(/K3\+900/);
    expect(() => parseChainageField('')).toThrow(/K3\+900/);
    expect(() => parseChainageField(null)).toThrow(/K3\+900/);
  });

  it('rejects a malformed metre part rather than guessing', () => {
    expect(() => parseChainageField('K3+9000')).toThrow(/K3\+900/);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run tests/unit/corridor-form.test.js`
Expected: FAIL — cannot resolve `lib/corridor/form.js`.

- [ ] **Step 3: Write `lib/corridor/form.js`**

```js
// lib/corridor/form.js
import { parseChainage } from './chainage.js';

/**
 * Reads a chainage from an admin form. Pure and synchronous, so it cannot live
 * in the 'use server' module. Throws a message that tells the editor the format
 * rather than a validation code.
 */
export function parseChainageField(value) {
  const metres = parseChainage(typeof value === 'string' ? value : String(value ?? ''));
  if (metres === null) {
    throw new Error('Enter a chainage like K3+900, or a plain number of metres');
  }
  return metres;
}
```

- [ ] **Step 4: Write the server actions**

```js
// app/admin/(dash)/corridor/actions.js
'use server';

import { revalidatePath } from 'next/cache';
import { assertCan } from '../../../../lib/auth/assert-can';
import { revalidateCorridor } from '../../../../lib/revalidate';
import { parseChainageField } from '../../../../lib/corridor/form';
import { saveSegment, deleteSegment, listSegments } from '../../../../lib/corridor/segments';
import { saveInterchange, deleteInterchange, listInterchanges } from '../../../../lib/corridor/interchanges';
import { saveTollRate, deleteTollRate, listAllTollRates } from '../../../../lib/corridor/tolls';
import { saveAdvisory, deleteAdvisory, listAllAdvisories } from '../../../../lib/corridor/advisories';
import { setSetting, isDataIllustrative } from '../../../../lib/settings';

const ADMIN = '/admin/corridor';

/** Operational data is structural: a translator must not change a toll rate. */
const ACTION = 'edit_blocks';

const STATUSES = ['open', 'construction', 'planned'];
const KINDS = ['interchange', 'toll_plaza', 'service_area', 'u_loop', 'pedestrian_overpass'];
const SEVERITIES = ['info', 'warning', 'closure'];

function localeMap(formData, prefix) {
  const out = {};
  for (const locale of ['en', 'bn', 'zh']) {
    const v = String(formData.get(`${prefix}.${locale}`) ?? '').trim();
    if (v) out[locale] = v;
  }
  return out;
}

/**
 * Our own validation messages are user-facing and must survive; a driver error
 * carries `code`/`sqlMessage` and must not reach the browser.
 */
function friendly(err, fallback) {
  if (err && !err.code && !err.sqlMessage && typeof err.message === 'string') throw err;
  throw new Error(fallback);
}

export async function listCorridorAction() {
  await assertCan(ACTION);
  const [segments, interchanges, tolls, advisories, illustrative] = await Promise.all([
    listSegments(), listInterchanges(), listAllTollRates(), listAllAdvisories(), isDataIllustrative(),
  ]);
  return { segments, interchanges, tolls, advisories, illustrative };
}

export async function saveSegmentAction(formData) {
  await assertCan(ACTION);
  const id = Number(formData.get('id')) || null;
  const from_m = parseChainageField(formData.get('from_m'));
  const to_m = parseChainageField(formData.get('to_m'));
  const status = String(formData.get('status') || 'planned');
  if (!STATUSES.includes(status)) throw new Error('Status must be open, construction or planned');

  try {
    await saveSegment({
      id, from_m, to_m, status,
      opened_on: String(formData.get('opened_on') || '') || null,
      labels: localeMap(formData, 'label'),
    });
  } catch (err) { friendly(err, 'Could not save the segment. Please try again.'); }
  revalidateCorridor();
  revalidatePath(`${ADMIN}/segments`);
}

export async function deleteSegmentAction(formData) {
  await assertCan(ACTION);
  try {
    await deleteSegment(Number(formData.get('id')));
  } catch { throw new Error('Could not delete the segment. Please try again.'); }
  revalidateCorridor();
  revalidatePath(`${ADMIN}/segments`);
}

export async function saveInterchangeAction(formData) {
  await assertCan(ACTION);
  const chainage_m = parseChainageField(formData.get('chainage_m'));
  const names = localeMap(formData, 'name');
  if (!names.en) throw new Error('An English name is required');

  const kind = String(formData.get('kind') || 'interchange');
  const status = String(formData.get('status') || 'planned');
  if (!KINDS.includes(kind)) throw new Error('That is not a known kind of location');
  if (!STATUSES.includes(status)) throw new Error('Status must be open, construction or planned');

  try {
    await saveInterchange({
      id: Number(formData.get('id')) || null,
      chainage_m, names, kind, status,
      connects_to: String(formData.get('connects_to') || ''),
      facilities: String(formData.get('facilities') || '')
        .split(',').map((s) => s.trim()).filter(Boolean),
      lat: String(formData.get('lat') || '') || null,
      lng: String(formData.get('lng') || '') || null,
    });
  } catch (err) { friendly(err, 'Could not save the interchange. Please try again.'); }
  revalidateCorridor();
  revalidatePath(`${ADMIN}/interchanges`);
}

export async function deleteInterchangeAction(formData) {
  await assertCan(ACTION);
  try {
    await deleteInterchange(Number(formData.get('id')));
  } catch { throw new Error('Could not delete the interchange. Please try again.'); }
  revalidateCorridor();
  revalidatePath(`${ADMIN}/interchanges`);
}

export async function saveTollRateAction(formData) {
  await assertCan(ACTION);
  try {
    await saveTollRate({
      id: Number(formData.get('id')) || null,
      vehicle_class: String(formData.get('vehicle_class') || '').trim(),
      class_labels: localeMap(formData, 'class'),
      class_order: Number(formData.get('class_order')) || 0,
      section: String(formData.get('section') || ''),
      amount_bdt: Number(formData.get('amount_bdt')),
      effective_from: String(formData.get('effective_from') || ''),
    });
  } catch (err) { friendly(err, 'Could not save the toll rate. Please try again.'); }
  revalidateCorridor();
  revalidatePath(`${ADMIN}/tolls`);
}

export async function deleteTollRateAction(formData) {
  await assertCan(ACTION);
  try {
    await deleteTollRate(Number(formData.get('id')));
  } catch { throw new Error('Could not delete the toll rate. Please try again.'); }
  revalidateCorridor();
  revalidatePath(`${ADMIN}/tolls`);
}

export async function saveAdvisoryAction(formData) {
  await assertCan(ACTION);
  const severity = String(formData.get('severity') || 'info');
  if (!SEVERITIES.includes(severity)) {
    throw new Error('Severity must be info, warning or closure');
  }
  const messages = localeMap(formData, 'message');
  if (!messages.en) throw new Error('An English message is required');

  try {
    await saveAdvisory({
      id: Number(formData.get('id')) || null,
      severity, messages,
      starts_at: String(formData.get('starts_at') || '').replace('T', ' ') || null,
      ends_at: String(formData.get('ends_at') || '').replace('T', ' ') || null,
      is_active: formData.get('is_active') ? 1 : 0,
    });
  } catch (err) { friendly(err, 'Could not save the advisory. Please try again.'); }
  revalidateCorridor();
  revalidatePath(`${ADMIN}/advisories`);
}

export async function deleteAdvisoryAction(formData) {
  await assertCan(ACTION);
  try {
    await deleteAdvisory(Number(formData.get('id')));
  } catch { throw new Error('Could not delete the advisory. Please try again.'); }
  revalidateCorridor();
  revalidatePath(`${ADMIN}/advisories`);
}

export async function setIllustrativeAction(formData) {
  await assertCan(ACTION);
  try {
    await setSetting('corridor.illustrative', Boolean(formData.get('illustrative')));
  } catch { throw new Error('Could not update the setting. Please try again.'); }
  revalidateCorridor();
  revalidatePath(ADMIN);
}
```

- [ ] **Step 5: Write the admin hub**

```jsx
// app/admin/(dash)/corridor/page.jsx
import Link from 'next/link';
import { listCorridorAction, setIllustrativeAction } from './actions';

export const dynamic = 'force-dynamic';

export default async function CorridorHub() {
  const { segments, interchanges, tolls, advisories, illustrative } = await listCorridorAction();

  const areas = [
    { href: '/admin/corridor/segments', name: 'Segments', count: segments.length,
      note: 'Which stretches are open, under construction or planned. The published progress figure is calculated from these.' },
    { href: '/admin/corridor/interchanges', name: 'Interchanges', count: interchanges.length,
      note: 'Entry and exit points, toll plazas and service areas.' },
    { href: '/admin/corridor/tolls', name: 'Toll rates', count: tolls.length,
      note: 'Rates by vehicle class. The public page shows only the rate in force today.' },
    { href: '/admin/corridor/advisories', name: 'Advisories', count: advisories.length,
      note: 'Closures and notices. The most severe active one appears site-wide.' },
  ];

  return (
    <div className="p-6 space-y-8">
      <header>
        <h1 className="text-2xl font-bold">Corridor data</h1>
        <p className="text-sm text-gray-500">The operational figures behind the Travel Info pages.</p>
      </header>

      <form action={setIllustrativeAction} className="border rounded p-4 space-y-2">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="illustrative" defaultChecked={illustrative} />
          Mark this data as provisional
        </label>
        <p className="text-sm text-gray-500">
          While this is on, every page showing operational figures carries a notice that
          they await official confirmation. Turn it off only once DBEDC has confirmed the
          toll table, the interchange schedule and the section statuses.
        </p>
        <button type="submit" className="px-4 py-2 rounded bg-black text-white">Save</button>
      </form>

      <ul className="grid gap-4 sm:grid-cols-2">
        {areas.map((a) => (
          <li key={a.href} className="border rounded p-4">
            <Link href={a.href} className="font-semibold underline">{a.name}</Link>
            <span className="ml-2 text-sm text-gray-500">{a.count}</span>
            <p className="text-sm text-gray-500 mt-1">{a.note}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

- [ ] **Step 6: Write the segments editor**

```jsx
// app/admin/(dash)/corridor/segments/page.jsx
import { listCorridorAction, saveSegmentAction, deleteSegmentAction } from '../actions';
import { formatChainage } from '../../../../../lib/corridor/chainage';

export const dynamic = 'force-dynamic';

const STATUSES = ['open', 'construction', 'planned'];

function SegmentForm({ segment }) {
  return (
    <form action={saveSegmentAction} className="grid gap-2 sm:grid-cols-6 items-end border-t py-3">
      <input type="hidden" name="id" value={segment?.id ?? ''} />
      <label className="flex flex-col text-sm">From
        <input name="from_m" required defaultValue={segment ? formatChainage(segment.from_m) : ''}
          placeholder="K0+000" className="border rounded px-2 py-1" />
      </label>
      <label className="flex flex-col text-sm">To
        <input name="to_m" required defaultValue={segment ? formatChainage(segment.to_m) : ''}
          placeholder="K48+000" className="border rounded px-2 py-1" />
      </label>
      <label className="flex flex-col text-sm">Status
        <select name="status" defaultValue={segment?.status ?? 'planned'} className="border rounded px-2 py-1">
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </label>
      <label className="flex flex-col text-sm">Opened
        <input type="date" name="opened_on"
          defaultValue={segment?.opened_on ? String(segment.opened_on).slice(0, 10) : ''}
          className="border rounded px-2 py-1" />
      </label>
      <label className="flex flex-col text-sm">Label (EN)
        <input name="label.en" defaultValue={segment?.labels?.en ?? ''} className="border rounded px-2 py-1" />
      </label>
      <button type="submit" className="px-3 py-1 rounded bg-black text-white h-8">Save</button>
    </form>
  );
}

export default async function SegmentsAdmin() {
  const { segments } = await listCorridorAction();

  return (
    <div className="p-6 space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Segments</h1>
        <p className="text-sm text-gray-500">
          Chainage may be entered as K3+900 or as a plain number of metres. Segments may
          touch but must not overlap. The published progress figure is calculated from
          these rows — it is never typed in.
        </p>
      </header>

      {segments.map((s) => (
        <div key={s.id}>
          <SegmentForm segment={s} />
          <form action={deleteSegmentAction}>
            <input type="hidden" name="id" value={s.id} />
            <button type="submit" className="text-red-600 text-sm">Delete this segment</button>
          </form>
        </div>
      ))}

      <div>
        <h2 className="font-semibold">Add a segment</h2>
        <SegmentForm />
      </div>
    </div>
  );
}
```

- [ ] **Step 7: Write the other three editors**

Follow the exact shape of the segments screen above — a `<Thing>Form` component reused for both edit and create, a delete form per row, and a create form at the bottom. Each page calls `listCorridorAction()` and reads its own slice. Fields:

**`interchanges/page.jsx`** — action `saveInterchangeAction`, delete `deleteInterchangeAction`:
`chainage_m` (text, placeholder `K9+400`, prefill with `formatChainage`), `name.en` (required), `name.bn`, `name.zh`, `kind` (select over `interchange`, `toll_plaza`, `service_area`, `u_loop`, `pedestrian_overpass`), `status` (select over the three statuses), `connects_to` (text, e.g. `N2 · Dhaka–Sylhet`), `facilities` (text, comma-separated), `lat` and `lng` (number, `step="0.0000001"`, left blank until the survey data arrives).

**`tolls/page.jsx`** — action `saveTollRateAction`, delete `deleteTollRateAction`:
`vehicle_class` (text key, e.g. `car`), `class.en` (required), `class.bn`, `class.zh`, `class_order` (number), `section` (text), `amount_bdt` (number, `step="0.01"`, `min="0"`), `effective_from` (date, required).
Put this note on the page: *"The public table shows only the rate in force today. To schedule a change, add a new row for the same vehicle class with a future effective date — do not edit the current one."*

**`advisories/page.jsx`** — action `saveAdvisoryAction`, delete `deleteAdvisoryAction`:
`severity` (select over `info`, `warning`, `closure`), `message.en` (required, textarea), `message.bn`, `message.zh` (textareas), `starts_at` and `ends_at` (`datetime-local`, both optional — blank means always), `is_active` (checkbox).
Put this note on the page: *"The most severe active advisory appears at the top of every page. Leave both dates blank for a notice that stays until you switch it off."*

- [ ] **Step 8: Run the tests and the build**

Run:
```bash
npx vitest run tests/unit/corridor-form.test.js
npm test
npm run build
```
Expected: all PASS. The build is what proves `actions.js` exports only async functions — had `parseChainageField` been exported from it, Next 15 would refuse.

- [ ] **Step 9: Verify every action is gated**

Run:
```bash
grep -c "await assertCan" "app/admin/(dash)/corridor/actions.js"
grep -c "^export async function" "app/admin/(dash)/corridor/actions.js"
```
Expected: the two counts are EQUAL. Every exported server action is a remotely callable endpoint; one without `assertCan` is an unauthenticated write.

- [ ] **Step 10: Commit**

```bash
git add "app/admin/(dash)/corridor" lib/corridor/form.js tests/unit/corridor-form.test.js
git commit -m "feat(admin): add corridor editors for segments, interchanges, tolls and advisories"
```

---

## Task 13: Lead the home page with the corridor

**Files:**
- Modify: `app/[locale]/page.jsx`, `lib/i18n/ui.js`, `app/design-tokens.css`

**Interfaces:**
- Consumes: `lib/corridor/cache.js` → all four readers; `lib/corridor/strip.js` → `buildStripModel`; `lib/corridor/tolls.js` → `formatTaka`; the Task 8 components.
- Produces: a home page that opens with operational status, per the spec's homepage sequence.

The spec's sequence is: advisory strip, hero, corridor strip, toll preview, progress, outcomes, news. Task 9 placed the advisory strip; this places the rest. **The CMS blocks an editor authored stay** — they render after the operational summary, not instead of it, so the editor keeps control of the narrative below the fold.

Keep the existing `page.status !== 'published'` check and `generateMetadata` exactly as they are.

- [ ] **Step 1: Add the strings to `lib/i18n/ui.js`**

Add to each locale:

```js
// en
homeCorridorHeading: 'The corridor today', seeAllTolls: 'All toll rates', seeRoute: 'Route & interchanges',
// bn
homeCorridorHeading: 'আজকের করিডোর', seeAllTolls: 'সব টোল হার', seeRoute: 'রুট ও ইন্টারচেঞ্জ',
// zh
homeCorridorHeading: '今日通行状况', seeAllTolls: '全部通行费', seeRoute: '路线与互通',
```

- [ ] **Step 2: Extend `app/[locale]/page.jsx`**

Add these imports:

```jsx
import Link from 'next/link';
import {
  getCorridorSummaryCached, getInterchangesCached, getTollRatesCached, getIllustrativeCached,
} from '../../lib/corridor/cache';
import { buildStripModel } from '../../lib/corridor/strip';
import { formatTaka } from '../../lib/corridor/tolls';
import CorridorStrip from '../../components/corridor/CorridorStrip';
import InterchangeTable from '../../components/corridor/InterchangeTable';
import ProgressBar from '../../components/corridor/ProgressBar';
import IllustrativeNotice from '../../components/corridor/IllustrativeNotice';
import { t } from '../../lib/i18n/ui';
```

Add this data loading inside the component, alongside the existing page lookup:

```jsx
  const [summary, interchanges, rates, illustrative] = await Promise.all([
    getCorridorSummaryCached(), getInterchangesCached(), getTollRatesCached(), getIllustrativeCached(),
  ]);
  const model = buildStripModel({ segments: summary.segments, interchanges, locale });
  // The car rate is the one most visitors are looking for.
  const topRate = rates.find((r) => r.vehicle_class === 'car') || rates[0] || null;
```

And render this immediately BEFORE the existing `<BlockRenderer … />`:

```jsx
      <section className="db-block">
        <h2 className="db-h2">{t(locale, 'homeCorridorHeading')}</h2>
        {illustrative ? <IllustrativeNotice locale={locale} /> : null}
        <ProgressBar summary={summary} locale={locale} />
        <CorridorStrip model={model} locale={locale} />
        <InterchangeTable interchanges={model.markers.slice(0, 5)} locale={locale} />
        <p className="db-actions">
          <Link href={`/${locale}/travel/toll`} className="db-btn db-btn-primary">
            {t(locale, 'seeAllTolls')}{topRate ? ` — ${formatTaka(topRate.amount_bdt)}` : ''}
          </Link>
          <Link href={`/${locale}/travel/route`} className="db-btn db-btn-secondary">
            {t(locale, 'seeRoute')}
          </Link>
        </p>
      </section>
```

- [ ] **Step 3: Add the button styles to `app/design-tokens.css`**

Append:

```css
.db-actions{display:flex;flex-wrap:wrap;gap:10px;margin-top:20px;}
.db-btn{font-family:var(--db-font-display);font-weight:700;font-size:.88rem;letter-spacing:.09em;
  text-transform:uppercase;padding:12px 20px;border-radius:2px;text-decoration:none;display:inline-block;}
.db-btn-primary{background:var(--db-accent-bright);color:#0B1620;}
.db-btn-secondary{border:1px solid var(--db-rule-2);color:var(--db-ink);}
```

- [ ] **Step 4: Run everything**

Run:
```bash
npm test
npm run build
```
Then open `/en`, `/bn` and `/zh` and confirm the home page leads with the corridor summary, carries the provisional notice, and the two buttons link into Travel Info with the car rate shown on the first.

- [ ] **Step 5: Commit**

```bash
git add "app/[locale]/page.jsx" lib/i18n/ui.js app/design-tokens.css
git commit -m "feat(home): lead with the corridor summary and Travel Info links"
```

---

## Task 14: Travel Info end-to-end tests

**Files:**
- Create: `tests/e2e/travel.spec.js`

**Interfaces:**
- Consumes: the running dev server and seeded corridor data.
- Produces: the regression net for the Travel Info section.

- [ ] **Step 1: Write the spec**

```js
// tests/e2e/travel.spec.js
import { test, expect } from '@playwright/test';

const PAGES = ['/travel/status', '/travel/toll', '/travel/route', '/travel/facilities', '/travel/rules'];
const LOCALES = ['en', 'bn', 'zh'];

for (const locale of LOCALES) {
  for (const path of PAGES) {
    test(`/${locale}${path} renders with no console errors`, async ({ page }) => {
      const errors = [];
      page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
      page.on('pageerror', (e) => errors.push(String(e)));

      const res = await page.goto(`/${locale}${path}`);
      expect(res.status()).toBe(200);
      await expect(page.locator('h1')).toBeVisible();
      expect(errors).toEqual([]);
    });
  }
}

test('/travel redirects to the status page', async ({ page }) => {
  await page.goto('/en/travel');
  await expect(page).toHaveURL(/\/en\/travel\/status$/);
});

test('the toll table shows a taka amount on every row', async ({ page }) => {
  await page.goto('/en/travel/toll');
  const rows = page.locator('table.db-table tbody tr');
  await expect(rows.first()).toBeVisible();
  const count = await rows.count();
  expect(count).toBeGreaterThan(0);

  // An empty price column is worse than no table at all.
  for (let i = 0; i < count; i += 1) {
    await expect(rows.nth(i).locator('.db-toll-amount')).toContainText('৳');
  }
});

test('provisional data is labelled as provisional', async ({ page }) => {
  await page.goto('/en/travel/toll');
  // The seed sets corridor.illustrative = true, so the notice must be present.
  await expect(page.getByRole('note')).toBeVisible();
});

test('the interchange table is present at every width, including where the strip hides', async ({ page }) => {
  for (const width of [360, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/en/travel/route');
    // The strip is aria-hidden and hides below 700px; the table is the real
    // content and must always be there.
    await expect(page.locator('table.db-table')).toBeVisible();
  }
});

test('the corridor strip is hidden from assistive technology', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/en/travel/status');
  const strip = page.locator('.db-strip');
  if (await strip.count()) {
    await expect(strip).toHaveAttribute('aria-hidden', 'true');
  }
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
  // The row scrolls horizontally on purpose, so only the first item has to be
  // in view without scrolling — but it must be.
  const box = await links.first().boundingBox();
  expect(box.x).toBeGreaterThanOrEqual(-1);
  expect(box.x + box.width).toBeLessThanOrEqual(321);
});

test('the progress figure matches the open length', async ({ page }) => {
  await page.goto('/en/travel/status');
  const bar = page.getByRole('progressbar');
  await expect(bar).toBeVisible();
  const now = Number(await bar.getAttribute('aria-valuenow'));
  expect(now).toBeGreaterThan(0);
  expect(now).toBeLessThanOrEqual(100);
});
```

- [ ] **Step 2: Run the suite**

Run:
```bash
npm run db:setup:v3
npm run db:seed:corridor
npm run test:e2e
```
Expected: every spec passes, including the pre-existing locale, theme, responsive and legacy suites.

**If any spec fails, that is a finding — report it. Do NOT weaken the assertion or change the app to make it pass without saying so explicitly.**

- [ ] **Step 3: Commit**

```bash
git add tests/e2e/travel.spec.js
git commit -m "test(e2e): add Travel Info coverage across locales and viewports"
```

---

## Self-Review

**1. Spec coverage.**

| Spec requirement (P2/P3) | Task |
|---|---|
| `segments` table + editor | 1, 5, 12 |
| `interchanges` table + editor | 1, 5, 12 |
| `toll_rates` table + editor | 1, 6, 12 |
| `advisories` table + editor | 1, 6, 12 |
| Corridor strip used across the site | 8, 10, 11, 13 |
| `/travel/status` | 10 |
| `/travel/toll` | 10 |
| `/travel/route` | 11 |
| `/travel/facilities` | 11 |
| `/travel/rules` | 11 |
| Site-wide advisory strip | 9 |
| Home page leads with operational status | 13 |
| Progress derived from data, never typed | 3 (`percentOpen`), 5, 8 |
| Provisional data labelled in the UI | 4, and every page in 10, 11, 13 |
| Two-gate authorization on every admin entry | 12 (with a count check) |
| Tag-based revalidation on save | 7, 12 |
| WCAG 2.2 AA — status never colour alone | 8 (hatching + text label), 9 (severity tag), 14 (assertions) |
| Responsive 320–2560, no clipped controls | 8 (strip hides below 700px, table remains), 10, 14 |
| Trilingual, English fallback | every component and page; `ui-strings.test.js` enforces key parity |

**Deliberately deferred, stated in the header:** the interactive geographic map, gated on official corridor geometry. `interchanges.lat`/`lng` exist and are nullable so the data model is ready.

**Out of scope by design:** the remaining editor-placeable block types, the newsroom, the institutional pages, sitemap/robots/structured data, analytics, and the cutover redirect map.

**2. Placeholder scan.** One deliberate compression: Task 12 Step 7 specifies three editor screens by their exact field lists rather than repeating three near-identical JSX files, immediately after showing the full pattern in the segments screen. Every field, its input type, its validation and its on-page guidance note are named. This is repetition avoided, not detail omitted.

**3. Type consistency check performed.**
- `buildStripModel` returns `{ extent, bands, markers, legend }`. `CorridorStrip` reads `model.bands`, `model.markers`, `model.legend`. `InterchangeTable` consumes `model.markers`, whose items are `{ id, name, kind, status, connectsTo, chainage, leftPct }` — matching the table's column reads exactly.
- `corridorSummary()` returns `{ extent, openLength, percentOpen, segments }`; `ProgressBar` reads `percentOpen`, `openLength`, `extent.length_m`.
- `formatChainage`/`parseChainage` round-trip, asserted in Task 2 and relied on by the admin prefill in Task 12.
- `localeName(row, locale)` and `localeMessage(row, locale)` share one signature shape; `classLabel` in Task 10 follows the same pattern inline.
- `CORRIDOR_TAG` is defined in Task 7 and consumed by every cached reader and every admin action.
- `assertCan` is imported from `lib/auth/assert-can.js` — the plain module, not the `'use server'` file.
- `parseChainageField` lives in `lib/corridor/form.js`, mirroring `lib/blocks/form.js`.

**4. Carried preconditions from P0+P1 honoured.**
- No query module imports `next/cache`; cached wrappers are separate, with explicit grep checks in Tasks 5 and 6.
- Two-gate authorization on every admin action, verified by the count check in Task 12 Step 9.
- Multi-row validation runs inside a transaction with rows locked (Task 5, `saveSegment` uses `FOR UPDATE`).
- Locale-keyed object maps use `Object.hasOwn` (Tasks 5, 6, 10).
- Driver errors are wrapped into user-facing sentences in every action (Task 12, `friendly`).
- The responsive rule that `overflow-x:hidden` hides clipping is respected: Task 14 asserts control positions, not just `scrollWidth`.
