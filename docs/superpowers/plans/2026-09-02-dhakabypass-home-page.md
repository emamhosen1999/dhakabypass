# Dhaka Bypass Home Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the final, comprehensive home page for dhakabypass.com — a road-operator front door driven end-to-end by the block CMS, illustrated with DBEDC's own photography registered as replaceable placeholders, with an admin screen and written guide for swapping every image later.

**Architecture:** Seven new block types register into the existing `lib/blocks/registry.js` (a block type is one module declaring `fields` + `Component`; the admin form and validator derive from `fields`, so no admin or renderer edits are needed). The 51 legacy images already sitting in `public/` are registered as rows in the existing `media` table with a new `origin='legacy'` marker rather than copied — they are already statically served, and the marker is what drives the admin's "needs replacing" list. All home copy is newly written in operator voice; none of the old site's prose survives.

**Tech Stack:** Next.js 15.2.3 App Router, React 19 server components, Tailwind v4 + `app/design-tokens.css`, `mysql2` (no ORM), Vitest, Playwright.

**Spec:** `docs/superpowers/specs/2026-08-31-dhakabypass-reinnovation-design.md`

## Global Constraints

- **Never modify** `app/(site)/`, `content/`, `lib/content.js`, `lib/admin-sections.js`, `lib/news.js`, `lib/gallery.js`, `components/SiteHeader.jsx`, `components/SiteFooter.jsx`, `middleware.js`, `scripts/db-setup.mjs`, `scripts/db-setup-v2.mjs`. The legacy site must keep working; `tests/e2e/legacy.spec.js` is the tripwire.
- **Never use** `git commit --no-verify`.
- **No deploy, no push, no server action** without explicit authorisation from the Boss.
- Every admin entry point checks `session.user.isAdmin` **AND** `can(session.user.role, action)`. Server actions open with `await assertCan('edit_blocks')`.
- Modules under `'use server'` may export **async functions only**.
- Chainage is stored as **integer metres**; `K3+218` means 3 km + 218 m.
- Dhaka time is fixed **UTC+6**, no DST. Use the existing helpers, never `toISOString()` on a local date.
- Locales are exactly `en | bn | zh`, English is the fallback, and fallback is **per block**, not per page.
- Copy rule: the road is **open and tolling on 18 km**. Present tense. No "upon completion", no "will transform", no completion date that has passed. Facts carried over from the old site are **provisional** until the Boss confirms them and must render inside the existing `IllustrativeNotice` scope or carry their own provisional marker.
- Legacy images are **low resolution** (hero aerial is 686×386). Every one is a placeholder; none may be upscaled or presented as final art.
- **Photographs of identifiable people may not be published on the new site until DBEDC confirms it holds consent.** Several inherited images — `/friends.webp` and much of `/photo/` — show recognisable faces, including children, in CSR settings. They were on the old site, which is not evidence of consent. Until the Boss confirms, only images whose subject is the *road* may be seeded. This is a hard gate, not a preference.
- **Every link rendered inside `/[locale]/` must stay inside it.** A link to `/gallery` or `/contact` from `/bn` drops a Bangla reader onto the legacy English site. Until a localised destination exists, either point at a localised route that does exist or omit the link. Never seed a bare legacy path into localised content.
- All new CSS uses existing tokens from `app/design-tokens.css`. Define a token before referencing it.
- Tests: `npx vitest run` must stay green; `vitest.config.mjs` has `fileParallelism: false` — do not change it.

---

## File Structure

**Media layer**
- `scripts/db-setup-v4.mjs` — adds `media.origin` and `media.credit`; idempotent.
- `scripts/import-legacy-media.mjs` — registers `public/*.webp` and `public/photo/*.webp` as `media` rows with real pixel dimensions.
- `lib/media/probe.js` — WebP/PNG/JPEG header dimension reader, no dependency.
- `lib/media/repo.js` — `listMedia`, `getMediaByPath`, `mediaAlt(row, locale)`.
- `components/SiteImage.jsx` — renders a media row with intrinsic `width`/`height` (no CLS) and focal-point `object-position`.

**Block types** (each is a `lib/blocks/types/*.js` definition + a `components/blocks/*.jsx` renderer)
- `hero.js` / `HeroBlock.jsx`
- `media-prose.js` / `MediaProseBlock.jsx`
- `figure-grid.js` / `FigureGridBlock.jsx`
- `card-grid.js` / `CardGridBlock.jsx`
- `cta-band.js` / `CtaBandBlock.jsx`
- `partner-row.js` / `PartnerRowBlock.jsx`
- `toll-preview.js` / `TollPreviewBlock.jsx` — reads live toll rates
- `lib/blocks/index.js` — modified: register the new types

**Page + content**
- `app/[locale]/page.jsx` — modified: hero block renders above the corridor summary, the rest below
- `scripts/seed-home-v2.mjs` — all-new EN/BN/ZH home content

**Admin**
- `app/admin/(dash)/media/page.jsx` — media library, placeholder-first
- `app/admin/(dash)/media/actions.js` — replace-in-place server action
- `docs/admin/replacing-images.md` — the Boss's guide
- `app/admin/(dash)/media/GuideNotice.jsx` — links the guide from the screen

**Styles**
- `app/design-tokens.css` — modified: new block classes

**Tests**
- `tests/media-probe.test.js`, `tests/media-repo.test.js`, `tests/blocks-home-types.test.js`, `tests/blocks-toll-preview.test.js`, `tests/e2e/home.spec.js`

---

### Task 1: Media schema and dimension probe

**Files:**
- Create: `scripts/db-setup-v4.mjs`
- Create: `lib/media/probe.js`
- Test: `tests/media-probe.test.js`

**Interfaces:**
- Consumes: nothing.
- Produces: `imageSize(buffer) -> { width, height, mime } | null`. Adds columns `media.origin VARCHAR(16) NOT NULL DEFAULT 'upload'` and `media.credit VARCHAR(160) NOT NULL DEFAULT ''`.

- [ ] **Step 1: Write the failing test**

```js
// tests/media-probe.test.js
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { imageSize } from '../lib/media/probe.js';

const pub = (p) => fs.readFileSync(path.join(process.cwd(), 'public', p));

describe('imageSize', () => {
  it('reads a lossy VP8 webp', () => {
    expect(imageSize(pub('bg-hero.webp'))).toEqual({ width: 686, height: 386, mime: 'image/webp' });
  });

  it('reads the large map webp', () => {
    const r = imageSize(pub('map.webp'));
    expect(r.width).toBe(1449);
    expect(r.height).toBe(1153);
  });

  it('reads a gallery photo', () => {
    const r = imageSize(pub('photo/36.webp'));
    expect(r).toEqual({ width: 1024, height: 768, mime: 'image/webp' });
  });

  it('returns null for a non-image buffer', () => {
    expect(imageSize(Buffer.from('not an image at all'))).toBeNull();
  });

  it('returns null for a truncated header', () => {
    expect(imageSize(pub('bg-hero.webp').subarray(0, 8))).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/media-probe.test.js`
Expected: FAIL — cannot resolve `../lib/media/probe.js`.

- [ ] **Step 3: Write the implementation**

```js
// lib/media/probe.js
/**
 * Minimal image header reader. We register 51 existing files and need their
 * real pixel dimensions so <img> can carry width/height and reserve layout
 * space. Pulling in a dependency for four header formats is not worth it on
 * a memory-limited shared host.
 *
 * Returns null rather than throwing for anything unrecognised: a bad file in
 * public/ must not abort the whole import run.
 */
function webp(buf) {
  if (buf.length < 30) return null;
  if (buf.toString('ascii', 0, 4) !== 'RIFF' || buf.toString('ascii', 8, 12) !== 'WEBP') return null;
  const kind = buf.toString('ascii', 12, 16);
  if (kind === 'VP8 ') {
    return { width: buf.readUInt16LE(26) & 0x3fff, height: buf.readUInt16LE(28) & 0x3fff };
  }
  if (kind === 'VP8L') {
    const b = buf.readUInt32LE(21);
    return { width: (b & 0x3fff) + 1, height: ((b >> 14) & 0x3fff) + 1 };
  }
  if (kind === 'VP8X') {
    const w = buf[24] | (buf[25] << 8) | (buf[26] << 16);
    const h = buf[27] | (buf[28] << 8) | (buf[29] << 16);
    return { width: w + 1, height: h + 1 };
  }
  return null;
}

function png(buf) {
  if (buf.length < 24) return null;
  if (buf.readUInt32BE(0) !== 0x89504e47) return null;
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
}

function jpeg(buf) {
  if (buf.length < 4 || buf[0] !== 0xff || buf[1] !== 0xd8) return null;
  let i = 2;
  while (i + 9 < buf.length) {
    if (buf[i] !== 0xff) { i += 1; continue; }
    const marker = buf[i + 1];
    // SOF0-SOF15, excluding the non-frame markers DHT (c4), JPGA (c8), DAC (cc)
    if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
      return { height: buf.readUInt16BE(i + 5), width: buf.readUInt16BE(i + 7) };
    }
    i += 2 + buf.readUInt16BE(i + 2);
  }
  return null;
}

export function imageSize(buffer) {
  if (!buffer || buffer.length < 12) return null;
  const buf = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer);
  const w = webp(buf);
  if (w && w.width > 0 && w.height > 0) return { ...w, mime: 'image/webp' };
  const p = png(buf);
  if (p && p.width > 0 && p.height > 0) return { ...p, mime: 'image/png' };
  const j = jpeg(buf);
  if (j && j.width > 0 && j.height > 0) return { ...j, mime: 'image/jpeg' };
  return null;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/media-probe.test.js`
Expected: PASS, 5 tests.

- [ ] **Step 5: Write the migration**

```js
// scripts/db-setup-v4.mjs
/**
 * Adds provenance to the media table.
 *
 * origin='legacy' marks the images inherited from the old site. They are real
 * DBEDC photographs but they are low-resolution web derivatives, so every one
 * is a placeholder awaiting an original. The admin media screen sorts on this
 * column, and docs/admin/replacing-images.md explains it to the operator.
 *
 * Safe to re-run: each ALTER is guarded by an information_schema check.
 */
import './load-env.mjs';
import mysql from 'mysql2/promise';

const db = await mysql.createConnection({
  host: process.env.DB_HOST, port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER, password: process.env.DB_PASSWORD, database: process.env.DB_NAME,
});

async function addColumn(table, column, ddl) {
  const [rows] = await db.execute(
    `SELECT 1 FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    [table, column],
  );
  if (rows.length) { console.log(`  ${table}.${column} already present`); return; }
  await db.query(`ALTER TABLE \`${table}\` ADD COLUMN ${ddl}`);
  console.log(`  added ${table}.${column}`);
}

await addColumn('media', 'origin', "origin VARCHAR(16) NOT NULL DEFAULT 'upload'");
await addColumn('media', 'credit', "credit VARCHAR(160) NOT NULL DEFAULT ''");

console.log('media schema ready');
await db.end();
```

- [ ] **Step 6: Run the migration twice to prove idempotence**

Run: `node scripts/db-setup-v4.mjs && node scripts/db-setup-v4.mjs`
Expected: first run prints `added media.origin` / `added media.credit`; second prints `already present` for both. No error either time.

- [ ] **Step 7: Commit**

```bash
git add lib/media/probe.js tests/media-probe.test.js scripts/db-setup-v4.mjs
git commit -m "feat(media): read image dimensions and record asset provenance"
```

---

### Task 2: Register the legacy images as replaceable placeholders

**Files:**
- Create: `scripts/import-legacy-media.mjs`
- Create: `lib/media/repo.js`
- Test: `tests/media-repo.test.js`

**Interfaces:**
- Consumes: `imageSize` from Task 1; `media.origin` / `media.credit` columns from Task 1.
- Produces: `listMedia({ origin } = {}) -> Promise<Row[]>`, `getMediaByPath(path) -> Promise<Row|null>`, `mediaAlt(row, locale) -> string`. A `Row` is `{ id, path, width, height, bytes, mime, focal_x, focal_y, alt, origin, credit }` where `alt` is an object keyed by locale.

- [ ] **Step 1: Write the failing test**

```js
// tests/media-repo.test.js
import { describe, it, expect } from 'vitest';
import { mediaAlt } from '../lib/media/repo.js';

describe('mediaAlt', () => {
  it('returns the requested locale', () => {
    expect(mediaAlt({ alt: { en: 'Aerial view', bn: 'আকাশ থেকে' } }, 'bn')).toBe('আকাশ থেকে');
  });

  it('falls back to English when the locale is missing', () => {
    expect(mediaAlt({ alt: { en: 'Aerial view' } }, 'zh')).toBe('Aerial view');
  });

  it('returns empty string when there is no alt at all', () => {
    expect(mediaAlt({ alt: null }, 'en')).toBe('');
    expect(mediaAlt({}, 'en')).toBe('');
    expect(mediaAlt(null, 'en')).toBe('');
  });

  it('survives a scalar or malformed alt value', () => {
    // A hand-edited row can put a string where an object belongs. It must
    // degrade to no alt text, never take the page down.
    expect(mediaAlt({ alt: 'just a string' }, 'en')).toBe('');
    expect(mediaAlt({ alt: ['array'] }, 'en')).toBe('');
  });

  it('ignores a non-string value for the requested locale', () => {
    expect(mediaAlt({ alt: { en: 'ok', bn: 42 } }, 'bn')).toBe('ok');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/media-repo.test.js`
Expected: FAIL — cannot resolve `../lib/media/repo.js`.

- [ ] **Step 3: Write the repository**

```js
// lib/media/repo.js
import { query } from '../db.js';

const COLS = 'id, path, width, height, bytes, mime, focal_x, focal_y, alt, origin, credit';

/**
 * Same defensive shape as lib/corridor's repositories: a malformed JSON value
 * in one row degrades that row, it never throws and takes down a page that
 * renders many rows.
 */
function shape(row) {
  let alt = null;
  try {
    alt = typeof row.alt === 'string' ? JSON.parse(row.alt) : row.alt;
  } catch { alt = null; }
  if (!alt || typeof alt !== 'object' || Array.isArray(alt)) alt = {};
  return { ...row, alt, width: Number(row.width) || 0, height: Number(row.height) || 0 };
}

export function mediaAlt(row, locale) {
  const alt = row && row.alt;
  if (!alt || typeof alt !== 'object' || Array.isArray(alt)) return '';
  const want = alt[locale];
  if (typeof want === 'string' && want) return want;
  return typeof alt.en === 'string' ? alt.en : '';
}

export async function listMedia({ origin } = {}) {
  const rows = origin
    ? await query(`SELECT ${COLS} FROM media WHERE origin = ? ORDER BY path`, [origin])
    : await query(`SELECT ${COLS} FROM media ORDER BY origin DESC, path`);
  return (rows || []).map(shape);
}

export async function getMediaByPath(path) {
  const rows = await query(`SELECT ${COLS} FROM media WHERE path = ? LIMIT 1`, [path]);
  return rows && rows.length ? shape(rows[0]) : null;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/media-repo.test.js`
Expected: PASS, 5 tests.

- [ ] **Step 5: Write the import script**

Alt text below is written fresh — it describes what is actually in each frame. Do not copy the old site's alt values, which were all the string "Dhaka Bypass Expressway".

```js
// scripts/import-legacy-media.mjs
/**
 * Registers the images inherited from the old site as media rows.
 *
 * The files are NOT copied. They already live in public/ and are already
 * served statically by Next, so the row's `path` is the URL that works today.
 * When the Boss replaces one through the admin, the new upload lands in
 * MEDIA_ROOT and the row's path is rewritten to /uploads/... — see
 * docs/admin/replacing-images.md.
 *
 * Every row is written with origin='legacy', which is what marks it as a
 * placeholder in the admin media screen. Re-running updates dimensions and
 * origin but never clobbers an alt or credit the operator has edited.
 */
import './load-env.mjs';
import fs from 'node:fs';
import path from 'node:path';
import mysql from 'mysql2/promise';
import { imageSize } from '../lib/media/probe.js';

/**
 * AUDITED allowlist. Every entry here was opened and looked at.
 *
 * This is an allowlist, not a convenience map, because auditing the inherited
 * library found that a large share of it is NOT DBEDC photography at all:
 *   cbri.webp   — a Belt and Road Initiative route map, a third-party infographic
 *   hma.webp    — a generic 3D "surface / base / subbase course" stock diagram
 *   road.webp   — an aerial of a motorway through temperate farmland; not this road
 *   eco-eff.webp— a Google Maps screenshot carrying a visible "Map data (c)2015 Google"
 * Republishing any of those on a PPP company's corporate site is a copyright
 * problem, and two of them would also misrepresent another country's road as
 * this one. They are excluded here and must not be reinstated without a licence.
 *
 * Images showing identifiable people (friends.webp and most of /photo/) are
 * excluded pending the consent confirmation named in Global Constraints.
 *
 * `status` is written to media.credit so the admin screen can show an operator
 * why an image is or is not available.
 */
const AUDITED = {
  // --- Road and construction -------------------------------------------
  '/bg-hero.webp': { alt: 'The expressway seen from the air, curving between wetland and villages with traffic on the open carriageway', credit: 'DBEDC' },
  '/bypass-ex.webp': { alt: 'A gantry over the carriageway reading “Welcome to Dhaka Bypass Expressway”, with the toll plaza and trucks beyond', credit: 'DBEDC' },
  '/photo/20.webp': { alt: 'Aerial view along the finished expressway, traffic running on both carriageways', credit: 'DBEDC' },
  '/photo/21.webp': { alt: 'Aerial view of a bridge under construction crossing open water', credit: 'DBEDC' },
  '/photo/22.webp': { alt: 'Aerial view of the completed viaduct crossing a river, with traffic running', credit: 'DBEDC' },
  '/photo/23.webp': { alt: 'Aerial view along the viaduct deck toward the horizon', credit: 'DBEDC' },
  '/photo/18.webp': { alt: 'A paver laying asphalt at dusk, lit by the low sun', credit: 'DBEDC' },
  '/photo/17.webp': { alt: 'A roller compacting fresh asphalt between concrete retaining walls', credit: 'DBEDC' },
  '/photo/16.webp': { alt: 'Newly finished asphalt with people walking on the new surface', credit: 'DBEDC' },
  '/photo/14.webp': { alt: 'A roller working new pavement beside a concrete retaining wall', credit: 'DBEDC' },
  '/photo/19.webp': { alt: 'Freshly laid asphalt running through a cutting', credit: 'DBEDC' },
  '/photo/10.webp': { alt: 'A roller compacting the subgrade ahead of surfacing', credit: 'DBEDC' },
  '/photo/13.webp': { alt: 'A worker spreading fill at the edge of the live carriageway', credit: 'DBEDC' },
  '/photo/11.webp': { alt: 'Steel reinforcement laid in a drainage channel, with workers in protective equipment', credit: 'DBEDC' },
  '/photo/12.webp': { alt: 'Waterproofing being applied to a bridge deck', credit: 'DBEDC' },
  '/photo/7.webp': { alt: 'Formwork and reinforcement around a pier under construction', credit: 'DBEDC' },
  '/photo/8.webp': { alt: 'Concrete blocks laid as slope protection on an embankment', credit: 'DBEDC' },
  '/photo/9.webp': { alt: 'A survey team working at the roadside during construction', credit: 'DBEDC' },
  '/photo/15.webp': { alt: 'Materials testing on the compacted subbase', credit: 'DBEDC' },
  '/photo/25.webp': { alt: 'A site meeting beside a completed structure', credit: 'DBEDC' },
  '/cp.webp': { alt: 'Workers fixing reinforcement along a bridge parapet on the alignment', credit: 'DBEDC' },
  '/semi.webp': { alt: 'Concrete being poured onto a reinforced bridge deck, with completed viaduct spans behind', credit: 'DBEDC' },
  // --- Identity ---------------------------------------------------------
  '/logo.webp': { alt: 'Dhaka Bypass Expressway Development Company logo', credit: 'DBEDC — raster only, vector original still needed' },
  '/route.webp': { alt: 'Diagram of the corridor from Vogra in the north to Madanpur in the south', credit: 'DBEDC — own artwork, confirm before reuse' },
  // --- People. Consent confirmed by the Boss on 2026-09-03. -------------
  // Cleared for an About or Community page. NOT seeded on the home page:
  // this is a road operator's front door, not a corporate album.
  '/photo/1.webp': { alt: 'A handover ceremony at the Public Private Partnership Authority', credit: 'DBEDC — consent confirmed 2026-09-03' },
  '/photo/24.webp': { alt: 'Project staff and local residents handling materials during a community visit', credit: 'DBEDC — consent confirmed 2026-09-03' },
  '/DSC02357.webp': { alt: 'Bangladeshi and Chinese project staff at a ceremony beneath both national flags', credit: 'DBEDC — consent confirmed 2026-09-03' },
  '/IMG_6282.webp': { alt: 'A plaque being presented at a school handover', credit: 'DBEDC — consent confirmed 2026-09-03' },
};

/**
 * Opened, looked at, and REJECTED. Recorded so the next person does not have to
 * repeat the audit, and so the admin can explain the gap to the Boss.
 */
const REJECTED = {
  '/cbri.webp': 'Third-party Belt and Road Initiative map. Not DBEDC content.',
  '/hma.webp': 'Generic stock pavement-layer diagram. Not DBEDC content.',
  '/road.webp': 'Stock aerial of a motorway in temperate farmland. Not this road.',
  '/eco-eff.webp': 'Google Maps screenshot, "Map data (c)2015 Google" visible. Licensing and eleven years stale.',
  '/friends.webp': 'Generic China-Bangladesh flag graphic. Stock artwork of unknown provenance.',
  '/map.webp': 'Google satellite screenshot with annotations. Same licensing problem as eco-eff.',
  '/photo/2.webp': 'Newspaper infographic headlined "DHAKA BYPASS PROJECT IN A JAM". Third-party AND hostile press.',
  '/photo/3.webp': 'Internal right-of-way acquisition annotations. Working document, not public content.',
  '/photo/5.webp': 'Internal alignment and utility overlay. Working document, not public content.',
  '/photo/6.webp': 'Engineering drawing. Working document, not public content.',
};

const db = await mysql.createConnection({
  host: process.env.DB_HOST, port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER, password: process.env.DB_PASSWORD, database: process.env.DB_NAME,
});

const root = path.join(process.cwd(), 'public');
const files = [];
for (const name of fs.readdirSync(root)) {
  if (name.toLowerCase().endsWith('.webp')) files.push('/' + name);
}
const photoDir = path.join(root, 'photo');
if (fs.existsSync(photoDir)) {
  for (const name of fs.readdirSync(photoDir)) {
    if (name.toLowerCase().endsWith('.webp')) files.push('/photo/' + name);
  }
}
files.sort();

let ok = 0;
let skipped = 0;
for (const rel of files) {
  const abs = path.join(root, rel);
  const buf = fs.readFileSync(abs);
  const size = imageSize(buf);
  if (!size) { console.warn(`  ! unreadable, skipped: ${rel}`); skipped += 1; continue; }
  const alt = JSON.stringify(ALT[rel] ? { en: ALT[rel] } : {});
  await db.execute(
    `INSERT INTO media (path, width, height, bytes, mime, alt, origin, credit)
     VALUES (?, ?, ?, ?, ?, ?, 'legacy', 'DBEDC')
     ON DUPLICATE KEY UPDATE
       width = VALUES(width), height = VALUES(height),
       bytes = VALUES(bytes), mime = VALUES(mime), origin = 'legacy'`,
    [rel, size.width, size.height, buf.length, size.mime, alt],
  );
  ok += 1;
}

console.log(`registered ${ok} legacy images, skipped ${skipped}`);
console.log('every one is a PLACEHOLDER — see docs/admin/replacing-images.md');
await db.end();
```

- [ ] **Step 6: Run the import twice**

Run: `node scripts/import-legacy-media.mjs && node scripts/import-legacy-media.mjs`
Expected: `registered 51 legacy images, skipped 0` both times, no error.

Then verify no alt was clobbered on the second pass:

Run:
```bash
node -e "process.env.NODE_ENV='development'" ; node --input-type=module -e "
import './scripts/load-env.mjs';
import mysql from 'mysql2/promise';
const db = await mysql.createConnection({host:process.env.DB_HOST,port:Number(process.env.DB_PORT||3306),user:process.env.DB_USER,password:process.env.DB_PASSWORD,database:process.env.DB_NAME});
const [r] = await db.execute(\"SELECT path, width, height, JSON_EXTRACT(alt,'\$.en') a FROM media WHERE path='/bg-hero.webp'\");
console.log(r); await db.end();"
```
Expected: one row, width 686, height 386, alt present.

- [ ] **Step 7: Commit**

```bash
git add lib/media/repo.js tests/media-repo.test.js scripts/import-legacy-media.mjs
git commit -m "feat(media): register the legacy photo library as replaceable placeholders"
```

---

### Task 3: SiteImage component

**Files:**
- Create: `components/SiteImage.jsx`
- Modify: `app/design-tokens.css` (append the `.db-figure` group)
- Test: `tests/site-image.test.jsx`

**Interfaces:**
- Consumes: `mediaAlt` from Task 2.
- Produces: `<SiteImage media={row} locale={l} sizes="..." className="..." priority={bool} />`. Every block renderer from Task 4 onward uses this and never writes a bare `<img>`.

- [ ] **Step 1: Write the failing test**

```jsx
// tests/site-image.test.jsx
import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import SiteImage from '../components/SiteImage.jsx';

const row = {
  path: '/bg-hero.webp', width: 686, height: 386,
  alt: { en: 'Aerial view', bn: 'আকাশ থেকে' }, focal_x: 0.5, focal_y: 0.35,
};

describe('SiteImage', () => {
  it('carries intrinsic dimensions so layout does not shift', () => {
    const html = renderToStaticMarkup(<SiteImage media={row} locale="en" />);
    expect(html).toContain('width="686"');
    expect(html).toContain('height="386"');
  });

  it('uses the locale alt text', () => {
    const html = renderToStaticMarkup(<SiteImage media={row} locale="bn" />);
    expect(html).toContain('আকাশ থেকে');
  });

  it('applies the focal point as object-position', () => {
    const html = renderToStaticMarkup(<SiteImage media={row} locale="en" />);
    expect(html).toContain('50% 35%');
  });

  it('is lazy by default and eager when priority is set', () => {
    expect(renderToStaticMarkup(<SiteImage media={row} locale="en" />)).toContain('loading="lazy"');
    const p = renderToStaticMarkup(<SiteImage media={row} locale="en" priority />);
    expect(p).toContain('loading="eager"');
    expect(p).toContain('fetchpriority="high"');
  });

  it('renders nothing when there is no media row', () => {
    expect(renderToStaticMarkup(<SiteImage media={null} locale="en" />)).toBe('');
  });

  it('marks a decorative image as empty alt rather than omitting the attribute', () => {
    const html = renderToStaticMarkup(<SiteImage media={{ ...row, alt: {} }} locale="en" />);
    expect(html).toContain('alt=""');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/site-image.test.jsx`
Expected: FAIL — cannot resolve `../components/SiteImage.jsx`.

- [ ] **Step 3: Write the component**

```jsx
// components/SiteImage.jsx
import { mediaAlt } from '../lib/media/repo.js';

/**
 * The only way an image reaches a page.
 *
 * width/height are always present so the browser reserves the box before the
 * bytes arrive — the legacy library is low-resolution and loads fast, which
 * makes an unreserved box shift the page under the reader.
 *
 * focal_x/focal_y drive object-position so a cropped hero keeps its subject.
 * alt="" is written explicitly for a decorative image: omitting alt makes a
 * screen reader read the filename instead.
 */
export default function SiteImage({ media, locale, sizes, className, priority = false, style }) {
  if (!media || !media.path) return null;
  const fx = Number(media.focal_x);
  const fy = Number(media.focal_y);
  const x = Number.isFinite(fx) ? Math.round(fx * 100) : 50;
  const y = Number.isFinite(fy) ? Math.round(fy * 100) : 50;
  return (
    <img
      src={media.path}
      alt={mediaAlt(media, locale)}
      width={media.width || undefined}
      height={media.height || undefined}
      sizes={sizes}
      className={className}
      loading={priority ? 'eager' : 'lazy'}
      decoding={priority ? 'sync' : 'async'}
      fetchPriority={priority ? 'high' : undefined}
      style={{ objectPosition: `${x}% ${y}%`, ...style }}
    />
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/site-image.test.jsx`
Expected: PASS, 6 tests.

- [ ] **Step 5: Add the figure styles**

Append to `app/design-tokens.css`:

```css
/* ---- Images -------------------------------------------------------------
   The legacy library tops out at 1449px wide and the hero is 686px. Images
   are therefore always allowed to fill their box and are cropped with
   object-fit rather than letterboxed — a soft crop reads as a photograph,
   a letterboxed one reads as a mistake. */
.db-figure{margin:0;position:relative;overflow:hidden;background:var(--db-surface-2);}
.db-figure img{display:block;width:100%;height:100%;object-fit:cover;}
.db-figure figcaption{font-size:.86rem;color:var(--db-ink-3);padding-top:8px;line-height:1.5;}
.db-ratio-wide{aspect-ratio:16/9;}
.db-ratio-photo{aspect-ratio:4/3;}
.db-ratio-hero{aspect-ratio:21/9;}
@media (max-width:700px){ .db-ratio-hero{aspect-ratio:4/3;} }
```

- [ ] **Step 6: Verify the tokens referenced already exist**

Run: `grep -n -- "--db-surface-2\|--db-ink-3" app/design-tokens.css | head`
Expected: both appear in a `:root` declaration **before** the block just added. If either does not exist, stop and report — do not invent a token value.

- [ ] **Step 7: Commit**

```bash
git add components/SiteImage.jsx tests/site-image.test.jsx app/design-tokens.css
git commit -m "feat(media): add SiteImage with intrinsic sizing and focal-point cropping"
```

---

### Task 4: Hero block

**Files:**
- Create: `lib/blocks/types/hero.js`
- Create: `components/blocks/HeroBlock.jsx`
- Modify: `lib/blocks/index.js`
- Modify: `app/design-tokens.css`
- Test: `tests/blocks-home-types.test.js`

**Interfaces:**
- Consumes: `registerBlock` from `lib/blocks/registry.js`; `SiteImage` from Task 3; `getMediaByPath` from Task 2.
- Produces: block type `'hero'` with fields `image` (image), `eyebrow` (text), `headline` (text, required), `standfirst` (text), `primaryLabel`/`primaryHref`/`secondaryLabel`/`secondaryHref` (text). Later tasks reference the type string `'hero'` exactly.

- [ ] **Step 1: Write the failing test**

```js
// tests/blocks-home-types.test.js
import { describe, it, expect, beforeAll } from 'vitest';
import { getBlock, validateBlockData, defaultBlockData } from '../lib/blocks/registry.js';

beforeAll(async () => { await import('../lib/blocks/index.js'); });

describe('hero block', () => {
  it('is registered', () => {
    expect(getBlock('hero')).toBeTruthy();
  });

  it('requires a headline', () => {
    const r = validateBlockData('hero', { headline: '' });
    expect(r.ok).toBe(false);
    expect(r.errors.join(' ')).toMatch(/headline/i);
  });

  it('accepts a full record', () => {
    const r = validateBlockData('hero', {
      image: '/bg-hero.webp', eyebrow: 'Dhaka Bypass Expressway',
      headline: 'Eighteen kilometres open', standfirst: 'Vogra to K21, tolled.',
      primaryLabel: 'Toll rates', primaryHref: '/en/travel/toll',
      secondaryLabel: "What's open", secondaryHref: '/en/travel/status',
    });
    expect(r).toEqual({ ok: true, errors: [] });
  });

  it('has a default record with every field present', () => {
    const d = defaultBlockData('hero');
    for (const k of ['image', 'eyebrow', 'headline', 'standfirst',
      'primaryLabel', 'primaryHref', 'secondaryLabel', 'secondaryHref']) {
      expect(d).toHaveProperty(k);
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/blocks-home-types.test.js`
Expected: FAIL — `getBlock('hero')` returns null.

- [ ] **Step 3: Write the block definition**

```js
// lib/blocks/types/hero.js
import HeroBlock from '../../../components/blocks/HeroBlock.jsx';

/**
 * The front door. One per page, always first.
 *
 * The image is deliberately optional: the inherited hero aerial is 686x386
 * and will be replaced, and the page must still stand up if an operator
 * clears it while waiting for a better frame.
 */
export default {
  type: 'hero',
  label: 'Hero',
  fields: [
    { name: 'image', type: 'image', label: 'Background image' },
    { name: 'eyebrow', type: 'text', label: 'Eyebrow' },
    { name: 'headline', type: 'text', label: 'Headline', required: true },
    { name: 'standfirst', type: 'text', label: 'Standfirst' },
    { name: 'primaryLabel', type: 'text', label: 'Primary button label' },
    { name: 'primaryHref', type: 'text', label: 'Primary button link' },
    { name: 'secondaryLabel', type: 'text', label: 'Secondary button label' },
    { name: 'secondaryHref', type: 'text', label: 'Secondary button link' },
  ],
  Component: HeroBlock,
};
```

- [ ] **Step 4: Write the renderer**

```jsx
// components/blocks/HeroBlock.jsx
import Link from 'next/link';
import SiteImage from '../SiteImage.jsx';
import { getMediaByPath } from '../../lib/media/repo.js';

/**
 * A scrim, not a filter. The inherited aerial is 686px wide and will be soft
 * on a large display; a strong bottom-weighted gradient makes that softness
 * read as depth and guarantees the headline's contrast regardless of which
 * photograph an operator swaps in later.
 */
export default async function HeroBlock({ data, locale }) {
  let media = null;
  if (data.image) {
    try { media = await getMediaByPath(data.image); } catch { media = null; }
  }
  return (
    <section className="db-hero">
      {media ? (
        <div className="db-hero-bg" aria-hidden="true">
          <SiteImage media={{ ...media, alt: {} }} locale={locale} priority sizes="100vw" />
        </div>
      ) : null}
      <div className="db-hero-inner">
        {data.eyebrow ? <p className="db-hero-eyebrow">{data.eyebrow}</p> : null}
        <h1 className="db-hero-title">{data.headline}</h1>
        {data.standfirst ? <p className="db-hero-standfirst">{data.standfirst}</p> : null}
        {(data.primaryLabel && data.primaryHref) || (data.secondaryLabel && data.secondaryHref) ? (
          <p className="db-actions">
            {data.primaryLabel && data.primaryHref ? (
              <Link href={data.primaryHref} className="db-btn db-btn-primary">{data.primaryLabel}</Link>
            ) : null}
            {data.secondaryLabel && data.secondaryHref ? (
              <Link href={data.secondaryHref} className="db-btn db-btn-ondark">{data.secondaryLabel}</Link>
            ) : null}
          </p>
        ) : null}
      </div>
    </section>
  );
}
```

- [ ] **Step 5: Register it**

In `lib/blocks/index.js`, add the import and extend `ALL`:

```js
import hero from './types/hero.js';
```
and change `const ALL = [richText, statRow];` to `const ALL = [hero, richText, statRow];`

- [ ] **Step 6: Add the hero styles**

Append to `app/design-tokens.css`:

```css
/* ---- Hero ---------------------------------------------------------------- */
.db-hero{position:relative;isolation:isolate;background:var(--db-plate-bg);
  color:var(--db-plate-fg);border-radius:3px;overflow:hidden;
  display:flex;align-items:flex-end;min-height:clamp(320px,46vw,560px);}
.db-hero-bg{position:absolute;inset:0;z-index:-2;}
.db-hero-bg img{width:100%;height:100%;object-fit:cover;}
.db-hero::after{content:"";position:absolute;inset:0;z-index:-1;
  background:linear-gradient(to top,rgba(6,14,20,.92) 0%,rgba(6,14,20,.62) 46%,rgba(6,14,20,.28) 100%);}
.db-hero-inner{padding:clamp(22px,4vw,46px);max-width:44rem;}
.db-hero-eyebrow{font-family:var(--db-font-display);font-weight:600;text-transform:uppercase;
  letter-spacing:.2em;font-size:.74rem;color:rgba(237,242,245,.72);margin:0;}
.db-hero-title{font-family:var(--db-font-display);font-weight:700;text-transform:uppercase;
  line-height:1.02;text-wrap:balance;margin:12px 0 0;
  font-size:clamp(2rem,1rem + 4.4vw,3.6rem);}
.db-hero-standfirst{margin:14px 0 0;font-size:clamp(1rem,.94rem + .3vw,1.14rem);
  color:rgba(237,242,245,.84);max-width:46ch;}
.db-hero .db-actions{margin-top:22px;}
.db-btn-ondark{background:transparent;color:var(--db-plate-fg);
  border:1px solid rgba(237,242,245,.5);}
.db-btn-ondark:hover{border-color:var(--db-plate-fg);}
```

- [ ] **Step 7: Verify the tokens exist**

Run: `grep -n -- "--db-plate-bg\|--db-plate-fg\|--db-font-display" app/design-tokens.css | head`
Expected: each is declared in `:root` earlier in the file. If `--db-plate-bg` or `--db-plate-fg` does not exist, stop and report the actual plate token names rather than inventing them.

- [ ] **Step 8: Run the tests**

Run: `npx vitest run tests/blocks-home-types.test.js`
Expected: PASS, 4 tests.

- [ ] **Step 9: Commit**

```bash
git add lib/blocks/types/hero.js components/blocks/HeroBlock.jsx lib/blocks/index.js \
        app/design-tokens.css tests/blocks-home-types.test.js
git commit -m "feat(blocks): add hero block"
```

---

### Task 5: Media-prose block

**Files:**
- Create: `lib/blocks/types/media-prose.js`
- Create: `components/blocks/MediaProseBlock.jsx`
- Modify: `lib/blocks/index.js`, `app/design-tokens.css`, `tests/blocks-home-types.test.js`

**Interfaces:**
- Consumes: `SiteImage`, `getMediaByPath`.
- Produces: block type `'media-prose'`, fields `image`, `side` (text: `left`|`right`), `heading` (required), `body` (richtext), `linkLabel`, `linkHref`, `caption`.

- [ ] **Step 1: Add the failing test**

Append to `tests/blocks-home-types.test.js`:

```js
describe('media-prose block', () => {
  it('is registered and requires a heading', () => {
    expect(getBlock('media-prose')).toBeTruthy();
    expect(validateBlockData('media-prose', { heading: '' }).ok).toBe(false);
  });

  it('accepts a full record', () => {
    const r = validateBlockData('media-prose', {
      image: '/bypass-ex.webp', side: 'right', heading: 'What this road does',
      body: '<p>Real prose.</p>', linkLabel: 'The route', linkHref: '/en/travel/route',
      caption: 'The open carriageway near Mirer Bazar.',
    });
    expect(r.ok).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/blocks-home-types.test.js`
Expected: FAIL — `getBlock('media-prose')` is null.

- [ ] **Step 3: Write the definition**

```js
// lib/blocks/types/media-prose.js
import MediaProseBlock from '../../../components/blocks/MediaProseBlock.jsx';

/** One photograph beside one argument. The workhorse of the home page. */
export default {
  type: 'media-prose',
  label: 'Image and text',
  fields: [
    { name: 'image', type: 'image', label: 'Image' },
    { name: 'side', type: 'text', label: 'Image side (left or right)', default: 'right' },
    { name: 'heading', type: 'text', label: 'Heading', required: true },
    { name: 'body', type: 'richtext', label: 'Body' },
    { name: 'caption', type: 'text', label: 'Image caption' },
    { name: 'linkLabel', type: 'text', label: 'Link label' },
    { name: 'linkHref', type: 'text', label: 'Link target' },
  ],
  Component: MediaProseBlock,
};
```

- [ ] **Step 4: Write the renderer**

```jsx
// components/blocks/MediaProseBlock.jsx
import Link from 'next/link';
import SiteImage from '../SiteImage.jsx';
import { getMediaByPath } from '../../lib/media/repo.js';

export default async function MediaProseBlock({ data, locale }) {
  let media = null;
  if (data.image) {
    try { media = await getMediaByPath(data.image); } catch { media = null; }
  }
  // Anything that is not exactly 'left' is treated as 'right' so a typo in the
  // admin cannot produce an unstyled third state.
  const left = data.side === 'left';
  return (
    <section className={`db-block db-mediaprose${left ? ' db-mediaprose-left' : ''}`}>
      <div className="db-mediaprose-text">
        <h2 className="db-h2">{data.heading}</h2>
        {data.body ? (
          <div className="db-prose" dangerouslySetInnerHTML={{ __html: data.body }} />
        ) : null}
        {data.linkLabel && data.linkHref ? (
          <p className="db-actions">
            <Link href={data.linkHref} className="db-btn db-btn-secondary">{data.linkLabel}</Link>
          </p>
        ) : null}
      </div>
      {media ? (
        <figure className="db-figure db-mediaprose-figure">
          <div className="db-figure db-ratio-photo">
            <SiteImage media={media} locale={locale} sizes="(max-width: 860px) 100vw, 46vw" />
          </div>
          {data.caption ? <figcaption>{data.caption}</figcaption> : null}
        </figure>
      ) : null}
    </section>
  );
}
```

Note: `data.body` is trusted rich text authored in the admin by an authenticated editor, matching how `RichTextBlock` already handles its field. Do not widen this to untrusted input.

- [ ] **Step 5: Register it**

In `lib/blocks/index.js` import `mediaProse from './types/media-prose.js'` and add it to `ALL`.

- [ ] **Step 6: Add the styles**

Append to `app/design-tokens.css`:

```css
/* ---- Image and text ------------------------------------------------------ */
.db-mediaprose{display:grid;gap:clamp(20px,3.5vw,44px);align-items:start;
  grid-template-columns:1fr;}
.db-mediaprose-figure{min-width:0;}
@media (min-width:860px){
  .db-mediaprose{grid-template-columns:1fr 1fr;align-items:center;}
  .db-mediaprose-left .db-mediaprose-text{order:2;}
  .db-mediaprose-left .db-mediaprose-figure{order:1;}
}
```

- [ ] **Step 7: Run the tests**

Run: `npx vitest run tests/blocks-home-types.test.js`
Expected: PASS, 6 tests.

- [ ] **Step 8: Commit**

```bash
git add lib/blocks/types/media-prose.js components/blocks/MediaProseBlock.jsx \
        lib/blocks/index.js app/design-tokens.css tests/blocks-home-types.test.js
git commit -m "feat(blocks): add image-and-text block"
```

---

### Task 6: Figure-grid and card-grid blocks

**Files:**
- Create: `lib/blocks/types/figure-grid.js`, `components/blocks/FigureGridBlock.jsx`
- Create: `lib/blocks/types/card-grid.js`, `components/blocks/CardGridBlock.jsx`
- Modify: `lib/blocks/index.js`, `app/design-tokens.css`, `tests/blocks-home-types.test.js`

**Interfaces:**
- Consumes: `SiteImage`, `listMedia`/`getMediaByPath`.
- Produces: block type `'figure-grid'` with fields `heading`, `intro`, `items` (list of `{ image, caption }`), `linkLabel`, `linkHref`. Block type `'card-grid'` with fields `heading`, `intro`, `items` (list of `{ title, body, meta }`).

- [ ] **Step 1: Add the failing tests**

Append to `tests/blocks-home-types.test.js`:

```js
describe('figure-grid block', () => {
  it('is registered and takes a list of items', () => {
    expect(getBlock('figure-grid')).toBeTruthy();
    expect(validateBlockData('figure-grid', {
      heading: 'The corridor', intro: '', linkLabel: '', linkHref: '',
      items: [{ image: '/photo/1.webp', caption: 'Open carriageway' }],
    }).ok).toBe(true);
  });

  it('rejects a non-array items value', () => {
    expect(validateBlockData('figure-grid', { heading: 'x', items: 'nope' }).ok).toBe(false);
  });
});

describe('card-grid block', () => {
  it('is registered and takes a list of cards', () => {
    expect(getBlock('card-grid')).toBeTruthy();
    expect(validateBlockData('card-grid', {
      heading: 'Connections', intro: '',
      items: [{ title: 'N1', body: 'Dhaka–Chattogram', meta: 'South' }],
    }).ok).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/blocks-home-types.test.js`
Expected: FAIL on both new describes.

- [ ] **Step 3: Write both definitions**

```js
// lib/blocks/types/figure-grid.js
import FigureGridBlock from '../../../components/blocks/FigureGridBlock.jsx';

/** A row of photographs. Used for the corridor gallery teaser. */
export default {
  type: 'figure-grid',
  label: 'Photo grid',
  fields: [
    { name: 'heading', type: 'text', label: 'Heading' },
    { name: 'intro', type: 'text', label: 'Intro' },
    { name: 'items', type: 'list', label: 'Photographs', default: [] },
    { name: 'linkLabel', type: 'text', label: 'Link label' },
    { name: 'linkHref', type: 'text', label: 'Link target' },
  ],
  Component: FigureGridBlock,
};
```

```js
// lib/blocks/types/card-grid.js
import CardGridBlock from '../../../components/blocks/CardGridBlock.jsx';

/** Short titled facts. Used for the highway connections. */
export default {
  type: 'card-grid',
  label: 'Card grid',
  fields: [
    { name: 'heading', type: 'text', label: 'Heading' },
    { name: 'intro', type: 'text', label: 'Intro' },
    { name: 'items', type: 'list', label: 'Cards', default: [] },
  ],
  Component: CardGridBlock,
};
```

- [ ] **Step 4: Write both renderers**

```jsx
// components/blocks/FigureGridBlock.jsx
import Link from 'next/link';
import SiteImage from '../SiteImage.jsx';
import { getMediaByPath } from '../../lib/media/repo.js';

export default async function FigureGridBlock({ data, locale }) {
  const items = Array.isArray(data.items) ? data.items : [];
  // One query per image, resolved together. A missing row yields a skipped
  // tile rather than a broken one — same principle as the corridor tables.
  const resolved = await Promise.all(items.map(async (it) => {
    if (!it || !it.image) return null;
    try { return { media: await getMediaByPath(it.image), caption: it.caption || '' }; }
    catch { return null; }
  }));
  const tiles = resolved.filter((r) => r && r.media);
  if (tiles.length === 0) return null;

  return (
    <section className="db-block">
      {data.heading ? <h2 className="db-h2">{data.heading}</h2> : null}
      {data.intro ? <p className="db-lede">{data.intro}</p> : null}
      <ul className="db-figuregrid">
        {tiles.map((tile, i) => (
          <li key={i}>
            <figure className="db-figure-item">
              <div className="db-figure db-ratio-photo">
                <SiteImage media={tile.media} locale={locale} sizes="(max-width: 700px) 50vw, 30vw" />
              </div>
              {tile.caption ? <figcaption>{tile.caption}</figcaption> : null}
            </figure>
          </li>
        ))}
      </ul>
      {data.linkLabel && data.linkHref ? (
        <p className="db-actions">
          <Link href={data.linkHref} className="db-btn db-btn-secondary">{data.linkLabel}</Link>
        </p>
      ) : null}
    </section>
  );
}
```

```jsx
// components/blocks/CardGridBlock.jsx
export default function CardGridBlock({ data }) {
  const items = Array.isArray(data.items) ? data.items : [];
  if (items.length === 0) return null;
  return (
    <section className="db-block">
      {data.heading ? <h2 className="db-h2">{data.heading}</h2> : null}
      {data.intro ? <p className="db-lede">{data.intro}</p> : null}
      <ul className="db-cardgrid">
        {items.map((c, i) => (
          <li key={i} className="db-card">
            {c && c.meta ? <p className="db-card-meta">{c.meta}</p> : null}
            <h3 className="db-card-title">{c ? c.title : ''}</h3>
            {c && c.body ? <p className="db-card-body">{c.body}</p> : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
```

- [ ] **Step 5: Register both**

In `lib/blocks/index.js` import `figureGrid` and `cardGrid` and add both to `ALL`.

- [ ] **Step 6: Add the styles**

Append to `app/design-tokens.css`:

```css
/* ---- Grids --------------------------------------------------------------- */
.db-figuregrid{list-style:none;margin:20px 0 0;padding:0;display:grid;gap:16px;
  grid-template-columns:repeat(auto-fit,minmax(210px,1fr));}
.db-figure-item{margin:0;}
.db-cardgrid{list-style:none;margin:20px 0 0;padding:0;display:grid;gap:2px;
  grid-template-columns:repeat(auto-fit,minmax(220px,1fr));}
.db-card{background:var(--db-surface);border-top:3px solid var(--db-accent);
  padding:18px 20px 20px;}
.db-card-meta{font-family:var(--db-font-display);font-size:.7rem;letter-spacing:.15em;
  text-transform:uppercase;color:var(--db-ink-3);margin:0;}
.db-card-title{font-family:var(--db-font-display);font-size:1.15rem;text-transform:uppercase;
  letter-spacing:.03em;margin:6px 0 0;}
.db-card-body{margin:8px 0 0;color:var(--db-ink-2);font-size:.95rem;}
```

- [ ] **Step 7: Verify tokens and run tests**

Run: `grep -n -- "--db-surface:\|--db-accent:\|--db-ink-2:" app/design-tokens.css | head`
Expected: all three declared in `:root`. Then:

Run: `npx vitest run tests/blocks-home-types.test.js`
Expected: PASS, 9 tests.

- [ ] **Step 8: Commit**

```bash
git add lib/blocks/types/figure-grid.js lib/blocks/types/card-grid.js \
        components/blocks/FigureGridBlock.jsx components/blocks/CardGridBlock.jsx \
        lib/blocks/index.js app/design-tokens.css tests/blocks-home-types.test.js
git commit -m "feat(blocks): add photo grid and card grid blocks"
```

---

### Task 7: CTA band and partner row blocks

**Files:**
- Create: `lib/blocks/types/cta-band.js`, `components/blocks/CtaBandBlock.jsx`
- Create: `lib/blocks/types/partner-row.js`, `components/blocks/PartnerRowBlock.jsx`
- Modify: `lib/blocks/index.js`, `app/design-tokens.css`, `tests/blocks-home-types.test.js`

**Interfaces:**
- Produces: block type `'cta-band'` with fields `heading` (required), `body`, `primaryLabel`, `primaryHref`, `secondaryLabel`, `secondaryHref`. Block type `'partner-row'` with fields `heading`, `intro`, `items` (list of `{ name, role, share }`).

- [ ] **Step 1: Add the failing tests**

Append to `tests/blocks-home-types.test.js`:

```js
describe('cta-band block', () => {
  it('is registered and requires a heading', () => {
    expect(getBlock('cta-band')).toBeTruthy();
    expect(validateBlockData('cta-band', { heading: '' }).ok).toBe(false);
    expect(validateBlockData('cta-band', {
      heading: 'Report a problem on the road', body: 'Call the control room.',
      primaryLabel: 'Contact', primaryHref: '/en/contact',
      secondaryLabel: '', secondaryHref: '',
    }).ok).toBe(true);
  });
});

describe('partner-row block', () => {
  it('is registered and takes partners', () => {
    expect(getBlock('partner-row')).toBeTruthy();
    expect(validateBlockData('partner-row', {
      heading: 'Who runs this road', intro: '',
      items: [{ name: 'SRBG', role: 'Lead partner', share: '60%' }],
    }).ok).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/blocks-home-types.test.js`
Expected: FAIL on both new describes.

- [ ] **Step 3: Write both definitions**

```js
// lib/blocks/types/cta-band.js
import CtaBandBlock from '../../../components/blocks/CtaBandBlock.jsx';

/** A full-width dark band. One per page at most — it closes the argument. */
export default {
  type: 'cta-band',
  label: 'Call to action',
  fields: [
    { name: 'heading', type: 'text', label: 'Heading', required: true },
    { name: 'body', type: 'text', label: 'Body' },
    { name: 'primaryLabel', type: 'text', label: 'Primary button label' },
    { name: 'primaryHref', type: 'text', label: 'Primary button link' },
    { name: 'secondaryLabel', type: 'text', label: 'Secondary button label' },
    { name: 'secondaryHref', type: 'text', label: 'Secondary button link' },
  ],
  Component: CtaBandBlock,
};
```

```js
// lib/blocks/types/partner-row.js
import PartnerRowBlock from '../../../components/blocks/PartnerRowBlock.jsx';

/**
 * The concession partners as text, not logos. We do not hold vector marks for
 * SRBG, SEL or UDC, and a stretched raster logo of another company's brand is
 * worse than a clean typographic credit.
 */
export default {
  type: 'partner-row',
  label: 'Partners',
  fields: [
    { name: 'heading', type: 'text', label: 'Heading' },
    { name: 'intro', type: 'text', label: 'Intro' },
    { name: 'items', type: 'list', label: 'Partners', default: [] },
  ],
  Component: PartnerRowBlock,
};
```

- [ ] **Step 4: Write both renderers**

```jsx
// components/blocks/CtaBandBlock.jsx
import Link from 'next/link';

export default function CtaBandBlock({ data }) {
  return (
    <section className="db-block db-ctaband">
      <div className="db-ctaband-text">
        <h2 className="db-ctaband-title">{data.heading}</h2>
        {data.body ? <p className="db-ctaband-body">{data.body}</p> : null}
      </div>
      <p className="db-actions">
        {data.primaryLabel && data.primaryHref ? (
          <Link href={data.primaryHref} className="db-btn db-btn-primary">{data.primaryLabel}</Link>
        ) : null}
        {data.secondaryLabel && data.secondaryHref ? (
          <Link href={data.secondaryHref} className="db-btn db-btn-ondark">{data.secondaryLabel}</Link>
        ) : null}
      </p>
    </section>
  );
}
```

```jsx
// components/blocks/PartnerRowBlock.jsx
export default function PartnerRowBlock({ data }) {
  const items = Array.isArray(data.items) ? data.items : [];
  if (items.length === 0) return null;
  return (
    <section className="db-block">
      {data.heading ? <h2 className="db-h2">{data.heading}</h2> : null}
      {data.intro ? <p className="db-lede">{data.intro}</p> : null}
      <dl className="db-partners">
        {items.map((p, i) => (
          <div key={i} className="db-partner">
            {/* dt precedes dd: the project's dl convention, set in Task 17 of the
                foundations plan. Visual order is CSS's problem, not the DOM's. */}
            <dt className="db-partner-name">{p ? p.name : ''}</dt>
            <dd className="db-partner-role">
              {p && p.role ? p.role : ''}
              {p && p.share ? <span className="db-partner-share">{p.share}</span> : null}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
```

- [ ] **Step 5: Register both**

In `lib/blocks/index.js` import `ctaBand` and `partnerRow` and add both to `ALL`.

- [ ] **Step 6: Add the styles**

Append to `app/design-tokens.css`:

```css
/* ---- CTA band and partners ----------------------------------------------- */
.db-ctaband{background:var(--db-plate-bg);color:var(--db-plate-fg);border-radius:3px;
  padding:clamp(22px,3.6vw,40px);display:grid;gap:20px;align-items:center;}
@media (min-width:820px){ .db-ctaband{grid-template-columns:1fr auto;} }
.db-ctaband-title{font-family:var(--db-font-display);font-weight:700;text-transform:uppercase;
  letter-spacing:.03em;line-height:1.06;margin:0;font-size:clamp(1.4rem,1rem + 1.6vw,2.1rem);}
.db-ctaband-body{margin:10px 0 0;color:rgba(237,242,245,.8);max-width:52ch;}
.db-ctaband .db-actions{margin:0;}
.db-partners{display:grid;gap:2px;margin:20px 0 0;
  grid-template-columns:repeat(auto-fit,minmax(210px,1fr));}
.db-partner{background:var(--db-surface);padding:16px 18px;display:flex;
  flex-direction:column;gap:4px;}
.db-partner-name{font-family:var(--db-font-display);font-weight:700;font-size:1.1rem;
  text-transform:uppercase;letter-spacing:.03em;}
.db-partner-role{margin:0;color:var(--db-ink-2);font-size:.93rem;
  display:flex;justify-content:space-between;gap:10px;}
.db-partner-share{font-variant-numeric:tabular-nums;color:var(--db-ink);font-weight:600;}
```

- [ ] **Step 7: Run the tests**

Run: `npx vitest run tests/blocks-home-types.test.js`
Expected: PASS, 11 tests.

- [ ] **Step 8: Commit**

```bash
git add lib/blocks/types/cta-band.js lib/blocks/types/partner-row.js \
        components/blocks/CtaBandBlock.jsx components/blocks/PartnerRowBlock.jsx \
        lib/blocks/index.js app/design-tokens.css tests/blocks-home-types.test.js
git commit -m "feat(blocks): add call-to-action band and partner row"
```

---

### Task 8: Toll-preview block reading live rates

**Files:**
- Create: `lib/blocks/types/toll-preview.js`, `components/blocks/TollPreviewBlock.jsx`
- Create: `lib/blocks/tollPreview.js` (the pure selection function)
- Modify: `lib/blocks/index.js`, `app/design-tokens.css`
- Test: `tests/blocks-toll-preview.test.js`

**Interfaces:**
- Consumes: `getTollRatesCached` from `lib/corridor/cache`, `formatTaka` from `lib/corridor/tolls`.
- Produces: block type `'toll-preview'` with fields `heading`, `intro`, `classes` (list of vehicle_class strings), `linkLabel`, `linkHref`. Pure helper `pickRates(rates, wanted) -> Row[]`.

- [ ] **Step 1: Write the failing test**

```js
// tests/blocks-toll-preview.test.js
import { describe, it, expect } from 'vitest';
import { pickRates } from '../lib/blocks/tollPreview.js';

const RATES = [
  { vehicle_class: 'car', amount_bdt: 150 },
  { vehicle_class: 'microbus', amount_bdt: 190 },
  { vehicle_class: 'large_bus', amount_bdt: 310 },
  { vehicle_class: 'heavy_truck', amount_bdt: 610 },
];

describe('pickRates', () => {
  it('returns the requested classes in the requested order', () => {
    expect(pickRates(RATES, ['large_bus', 'car']).map((r) => r.vehicle_class))
      .toEqual(['large_bus', 'car']);
  });

  it('silently drops a class that has no rate in force', () => {
    expect(pickRates(RATES, ['car', 'motorcycle']).map((r) => r.vehicle_class)).toEqual(['car']);
  });

  it('falls back to the first three rates when nothing is requested', () => {
    expect(pickRates(RATES, []).map((r) => r.vehicle_class))
      .toEqual(['car', 'microbus', 'large_bus']);
    expect(pickRates(RATES, null)).toHaveLength(3);
  });

  it('returns an empty array for missing or malformed rates', () => {
    expect(pickRates(null, ['car'])).toEqual([]);
    expect(pickRates('nope', ['car'])).toEqual([]);
  });

  it('never returns a duplicate even if a class is listed twice', () => {
    expect(pickRates(RATES, ['car', 'car'])).toHaveLength(1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/blocks-toll-preview.test.js`
Expected: FAIL — cannot resolve `../lib/blocks/tollPreview.js`.

- [ ] **Step 3: Write the helper**

```js
// lib/blocks/tollPreview.js
/**
 * Choose which rates the home page shows.
 *
 * A class the operator asked for that has no rate in force is dropped rather
 * than rendered blank: showing a vehicle class with no price on the front page
 * of a toll road reads as "free", which is the one wrong answer.
 */
export function pickRates(rates, wanted) {
  if (!Array.isArray(rates)) return [];
  const list = rates.filter((r) => r && typeof r.vehicle_class === 'string');
  if (!Array.isArray(wanted) || wanted.length === 0) return list.slice(0, 3);
  const out = [];
  const seen = new Set();
  for (const cls of wanted) {
    if (typeof cls !== 'string' || seen.has(cls)) continue;
    const hit = list.find((r) => r.vehicle_class === cls);
    if (hit) { out.push(hit); seen.add(cls); }
  }
  return out;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/blocks-toll-preview.test.js`
Expected: PASS, 5 tests.

- [ ] **Step 5: Write the definition and renderer**

```js
// lib/blocks/types/toll-preview.js
import TollPreviewBlock from '../../../components/blocks/TollPreviewBlock.jsx';

/**
 * Live rates on the front page. The amounts are never authored here — they are
 * read from toll_rates so the home page can never disagree with /travel/toll.
 */
export default {
  type: 'toll-preview',
  label: 'Toll rates preview',
  fields: [
    { name: 'heading', type: 'text', label: 'Heading' },
    { name: 'intro', type: 'text', label: 'Intro' },
    { name: 'classes', type: 'list', label: 'Vehicle classes to show', default: [] },
    { name: 'linkLabel', type: 'text', label: 'Link label' },
    { name: 'linkHref', type: 'text', label: 'Link target' },
  ],
  Component: TollPreviewBlock,
};
```

```jsx
// components/blocks/TollPreviewBlock.jsx
import Link from 'next/link';
import { getTollRatesCached } from '../../lib/corridor/cache';
import { formatTaka } from '../../lib/corridor/tolls';
import { pickRates } from '../../lib/blocks/tollPreview.js';
import { t } from '../../lib/i18n/ui';

export default async function TollPreviewBlock({ data, locale }) {
  let rates = [];
  try { rates = await getTollRatesCached(); } catch { rates = []; }
  const shown = pickRates(rates, data.classes);
  if (shown.length === 0) return null;

  return (
    <section className="db-block">
      {data.heading ? <h2 className="db-h2">{data.heading}</h2> : null}
      {data.intro ? <p className="db-lede">{data.intro}</p> : null}
      <dl className="db-tollpreview">
        {shown.map((r) => (
          <div key={r.vehicle_class} className="db-tollpreview-item">
            <dt className="db-tollpreview-class">{t(locale, `vehicle_${r.vehicle_class}`)}</dt>
            <dd className="db-tollpreview-amount">{formatTaka(r.amount_bdt)}</dd>
          </div>
        ))}
      </dl>
      {data.linkLabel && data.linkHref ? (
        <p className="db-actions">
          <Link href={data.linkHref} className="db-btn db-btn-primary">{data.linkLabel}</Link>
        </p>
      ) : null}
    </section>
  );
}
```

Before writing this file, run `grep -n "vehicle_car\|vehicle_" lib/i18n/ui.js | head` and confirm the key prefix used by the existing toll table. If the existing keys are named differently, use the existing names — do not add a parallel naming scheme.

- [ ] **Step 6: Register and style**

In `lib/blocks/index.js` import `tollPreview` and add it to `ALL`. Append to `app/design-tokens.css`:

```css
/* ---- Toll preview -------------------------------------------------------- */
.db-tollpreview{display:grid;gap:2px;margin:20px 0 0;
  grid-template-columns:repeat(auto-fit,minmax(190px,1fr));}
.db-tollpreview-item{background:var(--db-surface);padding:16px 18px;
  display:flex;flex-direction:column;gap:6px;}
.db-tollpreview-class{font-family:var(--db-font-display);font-size:.74rem;letter-spacing:.14em;
  text-transform:uppercase;color:var(--db-ink-3);}
.db-tollpreview-amount{margin:0;font-family:var(--db-font-display);font-weight:700;
  font-size:1.9rem;line-height:1;font-variant-numeric:tabular-nums;}
```

- [ ] **Step 7: Run the full unit suite**

Run: `npx vitest run`
Expected: every test file passes. Report the exact `Test Files` / `Tests` counts.

- [ ] **Step 8: Commit**

```bash
git add lib/blocks/tollPreview.js lib/blocks/types/toll-preview.js \
        components/blocks/TollPreviewBlock.jsx lib/blocks/index.js \
        app/design-tokens.css tests/blocks-toll-preview.test.js
git commit -m "feat(blocks): add toll rates preview reading live rates"
```

---

### Task 9: Assemble the home page

**Files:**
- Modify: `app/[locale]/page.jsx`

**Interfaces:**
- Consumes: every block type registered in Tasks 4–8.
- Produces: a home page whose hero renders **above** the corridor summary and whose remaining blocks render below it.

The hero must precede the corridor summary because the summary is the site's operational lede and the hero is its masthead — but the summary must still be the first thing a returning driver can act on, so nothing else may come between them.

- [ ] **Step 1: Split the block list**

Replace the render body of `app/[locale]/page.jsx` (from `const model = buildStripModel(...)` to the closing `);`) with:

```jsx
  const model = buildStripModel({ segments: summary.segments, interchanges, locale });
  // The car rate is the one most visitors are looking for.
  const topRate = rates.find((r) => r.vehicle_class === 'car') || rates[0] || null;

  // The hero is the masthead and sits above the corridor summary; everything
  // else sits below it, so the first actionable thing on the page is always
  // the live status of the road.
  const heroBlocks = blocks.filter((b) => b.type === 'hero');
  const restBlocks = blocks.filter((b) => b.type !== 'hero');

  return (
    <>
      <BlockRenderer blocks={heroBlocks} locale={locale} />
      {summary.segments.length === 0 ? null : (
        <section className="db-block">
          <h2 className="db-h2">{t(locale, 'homeCorridorHeading')}</h2>
          {illustrative ? <IllustrativeNotice locale={locale} /> : null}
          <ProgressBar summary={summary} locale={locale} publishedLengthKm={publishedLengthKm} />
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
      )}
      <BlockRenderer blocks={restBlocks} locale={locale} />
    </>
  );
```

- [ ] **Step 2: Verify the build compiles**

Run: `npm run build`
Expected: `✓ Compiled successfully`. Report any warning that names a file changed in this plan.

- [ ] **Step 3: Commit**

```bash
git add "app/[locale]/page.jsx"
git commit -m "feat(home): render the hero above the corridor summary"
```

---

### Task 10: Write the home content — English

**Files:**
- Create: `scripts/seed-home-v2.mjs`

**Interfaces:**
- Consumes: block types `hero`, `toll-preview`, `stat-row`, `media-prose`, `card-grid`, `figure-grid`, `partner-row`, `cta-band`; media paths registered in Task 2.
- Produces: a published `home` page whose blocks are the section order below.

**Copy rules for this task, restated because they are the whole point:**
- Not one sentence may be copied from `content/seed.json` or `content/pages.json`. Those files are a source of **numbers**, never of prose.
- Present tense. The road is open on 18 km and charging tolls.
- No completion date. The old site's "July 2025" has passed and the corridor is not complete.
- Figures carried across from the old site (12 bridges, 7 flyovers, 27 underpasses, ৳3,585–3,723 crore, US$350–412M, 1,000+ jobs, 25-year concession, SRBG 60%) are **unverified**. Every one of them must sit inside a block whose copy says so, using the wording given below. Do not present any of them as confirmed.

- [ ] **Step 1: Write the seed script**

```js
// scripts/seed-home-v2.mjs
/**
 * The home page content.
 *
 * Every line here is newly written for a road that is OPEN and tolling. The
 * old site's prose described a project awaiting completion in July 2025; none
 * of it survives. Where a number came from the old site it is unverified, and
 * the block copy says so in the reader's own words rather than hiding it in a
 * footnote.
 *
 * Re-running replaces the home page's blocks wholesale. It does not touch any
 * other page.
 */
import './load-env.mjs';
import mysql from 'mysql2/promise';

const db = await mysql.createConnection({
  host: process.env.DB_HOST, port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER, password: process.env.DB_PASSWORD, database: process.env.DB_NAME,
});

const BLOCKS = [
  {
    type: 'hero',
    data: {
      image: '/bg-hero.webp',
      eyebrow: 'Dhaka Bypass Expressway',
      headline: 'Eighteen kilometres open, and tolling',
      standfirst:
        'The first section of the bypass carries traffic between Vogra and Mirer Bazar today. '
        + 'The rest of the 48-kilometre corridor is still under construction.',
      primaryLabel: 'Toll rates',
      primaryHref: '/en/travel/toll',
      secondaryLabel: 'What is open',
      secondaryHref: '/en/travel/status',
    },
  },
  {
    type: 'toll-preview',
    data: {
      heading: 'What it costs',
      intro: 'Rates in force on the open section. Motorcycles and three-wheelers may not use the expressway.',
      classes: ['car', 'microbus', 'large_bus', 'heavy_truck'],
      linkLabel: 'All nine vehicle classes',
      linkHref: '/en/travel/toll',
    },
  },
  {
    type: 'media-prose',
    data: {
      image: '/bypass-ex.webp',
      side: 'right',
      heading: 'A road around the city, not through it',
      body:
        '<p>The Dhaka Bypass runs 48 kilometres down the eastern edge of the capital, from Gazipur in '
        + 'the north to Narayanganj in the south. It exists so that freight moving between the northern '
        + 'industrial belt and the southern ports does not have to cross Dhaka to get there.</p>'
        + '<p>It is access-controlled: traffic joins and leaves only at built interchanges, and every '
        + 'crossing is grade-separated. That is what separates it from the national highways it connects '
        + 'to, and it is why a journey that takes two hours through the city is meant to take a fraction '
        + 'of that once the full corridor opens.</p>',
      caption: 'The completed carriageway on the open section.',
      linkLabel: 'Where to join and leave',
      linkHref: '/en/travel/route',
    },
  },
  {
    type: 'card-grid',
    data: {
      heading: 'What it connects',
      intro: 'Four national highways meet the corridor along its length.',
      items: [
        { meta: 'North', title: 'N1', body: 'The Dhaka–Chattogram highway, toward the southern ports.' },
        { meta: 'North', title: 'N2', body: 'The Dhaka–Sylhet highway, toward the north-east.' },
        { meta: 'Centre', title: 'N3', body: 'The Dhaka–Mymensingh highway, toward the north.' },
        { meta: 'South', title: 'N4', body: 'The Tangail and Jamuna bridge corridor, toward the north-west.' },
      ],
    },
  },
  {
    // Only figures we can derive or have confirmed. The concession term, the
    // investment total and the structure counts all came from the old site and
    // are unverified — they do NOT belong in a stat row, which reads as a row
    // of established facts. They stay in prose, marked, until DBEDC confirms.
    type: 'stat-row',
    data: {
      stats: [
        { label: 'Corridor length', value: '48', unit: 'km' },
        { label: 'Open to traffic', value: '18', unit: 'km' },
        { label: 'Vehicle classes tolled', value: '9', unit: '' },
        { label: 'National highways joined', value: '4', unit: '' },
      ],
    },
  },
  {
    type: 'media-prose',
    data: {
      // eco-eff.webp was the obvious pick and is disqualified: it is a Google Maps
      // screenshot with a visible 2015 copyright line. A finished-road frame is
      // the right subject here anyway: this section is about the road in use.
      image: '/photo/16.webp',
      side: 'left',
      heading: 'What the open section changes now',
      body:
        '<p>Traffic that used to queue through Gazipur can now run the tolled section instead. For a '
        + 'freight operator that is measured in fuel burned while stationary and in drivers’ hours, '
        + 'not in kilometres saved.</p>'
        + '<p>The corridor is built and operated under a public–private partnership covering design, '
        + 'construction, finance, operation and maintenance. Tolls are what pays for it.</p>'
        + '<p class="db-provisional-inline">Figures published for this project during construction — '
        + 'total investment, jobs created, bridges and underpasses built, the length of the concession — '
        + 'have not been reconfirmed since the road opened. They are not republished here until DBEDC '
        + 'has verified them.</p>',
      caption: 'The finished wearing course on the open section.',
      linkLabel: 'The corridor today',
      linkHref: '/en/travel/status',
    },
  },
  {
    // The four aerials are the strongest images DBEDC holds and none of them
    // appear anywhere else on the page. Road subjects only: the CSR library is
    // cleared for use but belongs on an About page, not on a road operator's
    // front door.
    //
    // No link. There is no localised gallery route yet, and pointing a Bangla
    // reader at the legacy English /gallery is worse than offering nothing.
    type: 'figure-grid',
    data: {
      heading: 'The corridor',
      intro: 'The alignment during construction and since opening.',
      items: [
        { image: '/photo/22.webp', caption: 'The viaduct crossing the river.' },
        { image: '/photo/20.webp', caption: 'Traffic on the open section.' },
        { image: '/photo/21.webp', caption: 'Bridge construction over open water.' },
        { image: '/photo/18.webp', caption: 'Surfacing at dusk.' },
        { image: '/photo/17.webp', caption: 'Compacting the wearing course.' },
        { image: '/photo/23.webp', caption: 'Looking south along the deck.' },
      ],
      linkLabel: '',
      linkHref: '',
    },
  },
  {
    type: 'partner-row',
    data: {
      heading: 'Who builds and runs it',
      intro: 'The Dhaka Bypass Expressway Development Company holds the concession.',
      items: [
        { name: 'SRBG', role: 'Sichuan Road & Bridge Group, lead partner', share: '60%' },
        { name: 'SEL', role: 'Shamim Enterprise Ltd', share: '' },
        { name: 'UDC', role: 'UDC Construction Ltd', share: '' },
      ],
    },
  },
  {
    type: 'cta-band',
    data: {
      heading: 'Something wrong on the road?',
      body: 'Breakdowns, obstructions, damage to the carriageway — tell the operator.',
      primaryLabel: 'Contact DBEDC',
      primaryHref: '/contact',
      secondaryLabel: 'Rules of the road',
      secondaryHref: '/en/travel/rules',
    },
  },
];

const [pageRows] = await db.execute('SELECT id FROM pages WHERE slug = ?', ['home']);
let pageId;
if (pageRows.length) {
  pageId = pageRows[0].id;
  await db.execute('UPDATE pages SET status = ? WHERE id = ?', ['published', pageId]);
  const [old] = await db.execute('SELECT id FROM blocks WHERE page_id = ?', [pageId]);
  for (const b of old) await db.execute('DELETE FROM block_translations WHERE block_id = ?', [b.id]);
  await db.execute('DELETE FROM blocks WHERE page_id = ?', [pageId]);
} else {
  const [ins] = await db.execute("INSERT INTO pages (slug, status) VALUES ('home', 'published')");
  pageId = ins.insertId;
}

const [tr] = await db.execute(
  'SELECT id FROM page_translations WHERE page_id = ? AND locale = ?', [pageId, 'en'],
);
if (tr.length) {
  await db.execute(
    'UPDATE page_translations SET title = ?, status = ? WHERE id = ?',
    ['Dhaka Bypass Expressway', 'published', tr[0].id],
  );
} else {
  await db.execute(
    "INSERT INTO page_translations (page_id, locale, title, status) VALUES (?, 'en', ?, 'published')",
    [pageId, 'Dhaka Bypass Expressway'],
  );
}

let sort = 0;
for (const block of BLOCKS) {
  const [ins] = await db.execute(
    'INSERT INTO blocks (page_id, type, sort_order) VALUES (?, ?, ?)',
    [pageId, block.type, sort],
  );
  await db.execute(
    "INSERT INTO block_translations (block_id, locale, data, status) VALUES (?, 'en', ?, 'published')",
    [ins.insertId, JSON.stringify(block.data)],
  );
  sort += 1;
}

console.log(`seeded ${BLOCKS.length} home blocks (en)`);
await db.end();
```

- [ ] **Step 2: Add the inline-provisional style**

Append to `app/design-tokens.css`:

```css
.db-provisional-inline{border-left:3px solid var(--db-build);padding-left:14px;
  color:var(--db-ink-2);font-size:.93rem;}
```

Run `grep -n -- "--db-build" app/design-tokens.css | head` first and use whatever the construction-status token is actually called; do not invent one.

- [ ] **Step 3: Run the seed twice**

Run: `node scripts/seed-home-v2.mjs && node scripts/seed-home-v2.mjs`
Expected: `seeded 9 home blocks (en)` both times, no duplicate-key error, and afterwards exactly 9 rows:

Run:
```bash
node --input-type=module -e "
import './scripts/load-env.mjs';
import mysql from 'mysql2/promise';
const db=await mysql.createConnection({host:process.env.DB_HOST,port:Number(process.env.DB_PORT||3306),user:process.env.DB_USER,password:process.env.DB_PASSWORD,database:process.env.DB_NAME});
const [r]=await db.execute(\"SELECT COUNT(*) n FROM blocks b JOIN pages p ON p.id=b.page_id WHERE p.slug='home'\");
console.log(r); await db.end();"
```
Expected: `n: 9`.

- [ ] **Step 4: Look at the page**

Start the dev server, load `http://localhost:3000/en`, and confirm by eye: the hero image renders, the corridor summary sits directly beneath it, all nine sections appear in order, and no section is empty. Report anything that renders blank.

- [ ] **Step 5: Commit**

```bash
git add scripts/seed-home-v2.mjs app/design-tokens.css
git commit -m "feat(home): write the home page content for an open, tolling road"
```

---

### Task 11: Bangla and Chinese home content

**Files:**
- Modify: `scripts/seed-home-v2.mjs`

**Interfaces:**
- Consumes: the `BLOCKS` array from Task 10.
- Produces: `bn` and `zh` rows in `block_translations` for every block that has translatable copy.

Translation rule: translate the **meaning**, not the words. Place names stay in their published form until DBEDC supplies Bangla spellings — that is a known gap already on the Boss's list, and it is better to show a Latin place name than to invent a Bengali one.

- [ ] **Step 1: Add the translations**

Add to `scripts/seed-home-v2.mjs`, immediately before the seeding loop, a parallel structure keyed by block index. Write real Bangla and Chinese for every string; do not leave any as English placeholder text. Vehicle-class names, headings, standfirsts, captions, button labels and card bodies all translate. The `image`, `side`, `classes`, `linkHref`, `primaryHref` and `secondaryHref` values do **not** translate and must be copied through unchanged.

Then extend the loop so each block writes its `en`, `bn` and `zh` rows:

```js
for (const [i, block] of BLOCKS.entries()) {
  const [ins] = await db.execute(
    'INSERT INTO blocks (page_id, type, sort_order) VALUES (?, ?, ?)',
    [pageId, block.type, i],
  );
  for (const locale of ['en', 'bn', 'zh']) {
    const data = locale === 'en' ? block.data : TRANSLATIONS[locale][i];
    if (!data) continue; // no translation yet: BlockRenderer falls back to en
    await db.execute(
      'INSERT INTO block_translations (block_id, locale, data, status) VALUES (?, ?, ?, ?)',
      [ins.insertId, locale, JSON.stringify(data), 'published'],
    );
  }
}
```

- [ ] **Step 2: Re-run the seed and check all three locales**

Run: `node scripts/seed-home-v2.mjs`

Then load `/en`, `/bn` and `/zh` in the dev server. Confirm: Bangla renders in Hind Siliguri with no boxes or fallback serif; Chinese renders; no section shows English text on the `/bn` page except place names and the `৳` amounts.

- [ ] **Step 3: Commit**

```bash
git add scripts/seed-home-v2.mjs
git commit -m "feat(home): add Bangla and Chinese home page content"
```

---

### Task 12: Admin media library

**Files:**
- Create: `app/admin/(dash)/media/page.jsx`
- Create: `app/admin/(dash)/media/actions.js`
- Modify: whichever module builds the admin navigation (find it with `grep -rn "pages-v2" app/admin --include=*.jsx | head`)

**Interfaces:**
- Consumes: `listMedia` from Task 2; `assertCan` from the existing auth helpers; `saveUpload` from `lib/media.js`.
- Produces: `/admin/media`, listing placeholders first, each with a replace control.

- [ ] **Step 1: Read the existing patterns before writing anything**

Run:
```bash
sed -n '1,60p' "app/admin/(dash)/corridor/actions.js"
sed -n '1,50p' "app/admin/(dash)/corridor/segments/page.jsx"
```

Follow those exactly: the same `assertCan` call as the first statement of every exported action, the same allowlist `friendly()` error sanitiser (rethrow only `err.code === 'VALIDATION'`, otherwise a generic message), the same `revalidateTag` call after a successful write, and the same page-level session check. Do not invent a different shape.

- [ ] **Step 2: Write the replace action**

```js
// app/admin/(dash)/media/actions.js
'use server';

import { revalidateTag } from 'next/cache';
import { assertCan } from '../../../../lib/auth/guard.js';
import { query } from '../../../../lib/db.js';
import { saveUpload, ALLOWED_MIME_TYPES } from '../../../../lib/media.js';
import { imageSize } from '../../../../lib/media/probe.js';

function validationError(message) {
  const err = new Error(message);
  err.code = 'VALIDATION';
  return err;
}

// Allowlist, matching app/admin/(dash)/corridor/actions.js: a denylist leaks
// any Error without a .code, including database messages naming DB_HOST.
function friendly(err, fallback) {
  if (err?.code === 'VALIDATION') throw err;
  throw new Error(fallback);
}

/**
 * Replaces the file behind an existing media row, keeping its id so every
 * block that references it picks the new image up with no re-authoring.
 */
export async function replaceMedia(formData) {
  await assertCan('edit_blocks');
  try {
    const id = Number(formData.get('id'));
    if (!Number.isInteger(id) || id <= 0) throw validationError('Pick an image to replace.');

    const file = formData.get('file');
    if (!file || typeof file.arrayBuffer !== 'function') throw validationError('Choose a file.');
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      throw validationError(`That file type is not allowed. Use ${ALLOWED_MIME_TYPES.join(', ')}.`);
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const size = imageSize(buffer);
    if (!size) throw validationError('That file does not look like an image we can read.');

    const saved = await saveUpload({ buffer, filename: file.name, mime: file.type });
    const rows = await query('SELECT id FROM media WHERE id = ? LIMIT 1', [id]);
    if (!rows || rows.length === 0) throw validationError('That image no longer exists.');

    const result = await query(
      `UPDATE media SET path = ?, width = ?, height = ?, bytes = ?, mime = ?, origin = 'upload'
        WHERE id = ?`,
      [saved.path, size.width, size.height, buffer.length, size.mime, id],
    );
    if (!result || result.affectedRows === 0) {
      throw validationError('Nothing was updated. Try again.');
    }

    revalidateTag('pages');
    return { ok: true };
  } catch (err) {
    friendly(err, 'The image could not be replaced.');
  }
}
```

Before writing this, confirm the real import paths and names with:
```bash
grep -rn "assertCan" lib/ app/admin --include=*.js --include=*.jsx | head -5
grep -rn "revalidateTag" "app/admin/(dash)/corridor/actions.js" | head -5
grep -n "export .*saveUpload" lib/media.js
```
Use the names that exist. If `saveUpload` returns something other than `{ path }`, adapt and say so in the report.

- [ ] **Step 3: Write the page**

The page lists media with `origin='legacy'` first under a heading that says plainly what they are, then the uploads. Each row shows a thumbnail, the path, the pixel dimensions, and a file input posting to `replaceMedia`. Dimensions below 1600px wide are flagged, because that is the threshold at which a hero or full-width image starts to look soft.

Follow the existing admin page's session check and layout classes exactly.

- [ ] **Step 4: Verify the guard**

Confirm by reading the code that an editor without `edit_blocks` cannot reach the action, and that the page itself checks the session before rendering. State in the report which helper enforces each.

- [ ] **Step 5: Verify the build**

Run: `npm run build`
Expected: `✓ Compiled successfully`. A `'use server'` module exporting a non-async value fails here — if it does, the export is the bug, not the build.

- [ ] **Step 6: Commit**

```bash
git add "app/admin/(dash)/media"
git commit -m "feat(admin): add the media library with replace-in-place"
```

---

### Task 13: The replacement guide

**Files:**
- Create: `docs/admin/replacing-images.md`
- Create: `app/admin/(dash)/media/GuideNotice.jsx`
- Modify: `app/admin/(dash)/media/page.jsx`

**Interfaces:**
- Produces: a written guide the Boss can follow without help, linked from the media screen.

- [ ] **Step 1: Write the guide**

`docs/admin/replacing-images.md` covers, in this order and in plain language:

1. **Why every image says "placeholder"** — they are DBEDC's own photographs taken from the old website, but they are small web copies (the largest is 1449 pixels wide; the home page banner is 686). They are real, they are yours, and they will look soft on a large screen until originals replace them.
2. **What to send** — the original camera files, unedited, largest available. JPEG, PNG or WebP. For the home page banner, at least 2400 pixels wide.
3. **How to replace one** — sign in, go to Media, find the image (placeholders are listed first), choose the file, press Replace. Every page using that image updates at once; there is nothing else to edit.
4. **What not to do** — do not upload an image taken from Google or another company's website. DBEDC would be publishing someone else's copyright on its own corporate site. If a photograph is needed that DBEDC does not own, commission it or buy a licence.
5. **Alt text** — one sentence describing what is in the frame, for readers using a screen reader and for search engines. Written per language.
6. **The shortlist** — the exact images that matter most, in priority order: `/bg-hero.webp` (home banner), `/bypass-ex.webp`, `/eco-eff.webp`, `/map.webp`, then the gallery.

- [ ] **Step 2: Link it from the screen**

`GuideNotice.jsx` is a short server component rendering a standing notice at the top of `/admin/media` that says what a placeholder is and links to the guide. Render it above the listing.

- [ ] **Step 3: Verify**

Load `/admin/media` signed in as an admin and confirm the notice renders and the link resolves.

- [ ] **Step 4: Commit**

```bash
git add docs/admin/replacing-images.md "app/admin/(dash)/media/GuideNotice.jsx" "app/admin/(dash)/media/page.jsx"
git commit -m "docs(admin): explain how to replace the placeholder images"
```

---

### Task 14: End-to-end coverage for the home page

**Files:**
- Create: `tests/e2e/home.spec.js`

**Interfaces:**
- Consumes: the seeded content from Tasks 10–11.

This is the first e2e coverage the home page has had. Write assertions that fail for the right reason: assert on visible text and structure, never on status code alone, and never with a selector that substring-matches a different element.

- [ ] **Step 1: Write the tests**

```js
// tests/e2e/home.spec.js
import { test, expect } from '@playwright/test';

test.describe('home page', () => {
  test('leads with the hero, then the corridor summary', async ({ page }) => {
    await page.goto('/en');
    const h1 = page.locator('h1');
    await expect(h1).toHaveCount(1);
    await expect(h1).toContainText(/open/i);

    // The corridor summary must come before every other section.
    const headings = page.locator('h1, h2');
    await expect(headings.nth(1)).toContainText(/corridor/i);
  });

  test('shows live toll amounts that match the toll page', async ({ page }) => {
    await page.goto('/en');
    const preview = page.locator('.db-tollpreview-amount').first();
    await expect(preview).toBeVisible();
    const shown = (await preview.textContent()).replace(/\s/g, '');

    await page.goto('/en/travel/toll');
    const cheapest = page.locator('.db-toll-amount').first();
    await expect(cheapest).toHaveText(new RegExp(shown.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  });

  test('renders every seeded section', async ({ page }) => {
    await page.goto('/en');
    for (const text of [
      'What it costs', 'A road around the city', 'What it connects',
      'What the open section changes now', 'The corridor', 'Who builds and runs it',
      'Something wrong on the road',
    ]) {
      await expect(page.getByText(text, { exact: false }).first()).toBeVisible();
    }
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
    expect(overflow).toBeLessThanOrEqual(0);
  });

  test('renders in Bangla without falling back to English headings', async ({ page }) => {
    await page.goto('/bn');
    await expect(page.locator('h1')).not.toContainText('Eighteen kilometres');
  });
});
```

- [ ] **Step 2: Run them**

Run: `npx playwright test tests/e2e/home.spec.js`
Expected: 6 passed. If the Bangla test fails, the translations in Task 11 are incomplete — fix the content, not the test.

- [ ] **Step 3: Run the whole e2e suite**

Run: `npm run test:e2e`
Expected: all pass, including `legacy.spec.js`. Report the exact counts.

- [ ] **Step 4: Commit**

```bash
git add tests/e2e/home.spec.js
git commit -m "test(home): cover the home page end to end"
```

---

### Task 15: Responsive, dark and accessibility pass

**Files:**
- Modify: `app/design-tokens.css` as needed

- [ ] **Step 1: Capture the page at five widths in both themes**

Widths: 360, 390, 700, 1024, 1440. Themes: light and dark. Check each for: horizontal overflow, text over image with insufficient contrast, a heading that collides with the hero scrim, cards of unequal height in a row, and any figure that letterboxes instead of filling.

- [ ] **Step 2: Verify hero contrast**

The hero headline sits on a photograph. Measure the actual rendered contrast at the headline's position against the darkest and lightest parts of the scrimmed image. It must clear 4.5:1. If it does not, deepen the gradient rather than adding a text shadow.

- [ ] **Step 3: Check heading order**

Run an accessibility check confirming exactly one `h1`, and that no heading level is skipped between the hero and the last block.

- [ ] **Step 4: Fix what the pass found, then re-run everything**

Run: `npx vitest run && npm run build && npm run test:e2e`
Expected: all green. Report exact counts.

- [ ] **Step 5: Commit**

```bash
git add app/design-tokens.css
git commit -m "fix(home): responsive and contrast corrections from the design pass"
```

---

## Self-Review

**Spec coverage.** The spec's home-page requirements — operator-first framing, block-driven content, trilingual with per-block fallback, light and dark, provisional marking of unconfirmed figures — are covered by Tasks 4–11 and 15. The media-replacement requirement the Boss added is Tasks 1–3, 12 and 13.

**Known gaps, deliberately out of scope for this plan:**
- No admin UI exists yet for reordering home blocks; the seed script sets the order. The block builder is a later phase.
- Bangla and Chinese copy is written by the implementer and marked for review. It is real translation, not placeholder text, but it has not been read by a native speaker or by DBEDC. The Boss already holds a standing action to supply official Bangla place names.
- The photo grid ships with road subjects only. Any image showing identifiable people stays out until consent is confirmed — see Global Constraints.

**Type consistency.** `imageSize` returns `{ width, height, mime }` throughout. `mediaAlt(row, locale)` takes the row, not the alt object. `pickRates(rates, wanted)` returns an array. Block type strings used in Task 9's filter (`'hero'`) and Task 10's seed match the `type` field of each definition exactly.

**Verification steps that could pass for the wrong reason, and how each is hardened:** the e2e "renders every seeded section" test asserts visible text rather than element counts; the toll-preview test compares the home figure against the toll page's own rendering rather than a hardcoded number; the Bangla test asserts the English string is *absent* rather than that any text is present.
